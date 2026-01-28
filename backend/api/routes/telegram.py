from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import VideoJob, JobStatus
from api.utils.credits import complete_reservation, release_reservation
from services.telegram_service import TelegramService
from services.zipline_service import ZiplineService
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
import aiohttp
import logging
import re

router = APIRouter()
logger = logging.getLogger(__name__)

class TelegramWebhookUpdate(BaseModel):
    update_id: int
    message: Optional[dict] = None
    callback_query: Optional[dict] = None

@router.post("/webhook")
async def telegram_webhook(
    update: TelegramWebhookUpdate,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint để nhận messages từ Telegram Bot
    Xử lý khi admin gửi file (ảnh/video) để upload kết quả job
    """
    try:
        # Xử lý callback query (khi click nút)
        if update.callback_query:
            data = update.callback_query.get("data", "")
            if data.startswith("upload_result_"):
                job_id = data.replace("upload_result_", "")
                # Gửi message hướng dẫn
                chat_id = update.callback_query["from"]["id"]
                await TelegramService.send_message(
                    str(chat_id),
                    f"📤 Vui lòng reply với file ảnh/video cho Job ID: <code>{job_id}</code>"
                )
                return {"ok": True}
        
        # Xử lý message (khi admin gửi file)
        if not update.message:
            return {"ok": True}
        
        message = update.message
        chat_id = str(message["chat"]["id"])
        
        # Chỉ xử lý messages từ admin chat
        if chat_id != TelegramService.TELEGRAM_ADMIN_CHAT_ID:
            return {"ok": True}
        
        # Kiểm tra xem có file (photo/video/document) không
        file_info = None
        file_type = None
        caption = message.get("caption", "")
        
        # Tìm job_id trong caption hoặc reply message
        job_id = None
        if caption:
            # Tìm job_id trong caption (format: Job ID: <code>xxx</code>)
            match = re.search(r'Job ID:\s*<code>([^<]+)</code>', caption)
            if not match:
                match = re.search(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', caption)
            if match:
                job_id = match.group(1)
        
        # Nếu không tìm thấy trong caption, kiểm tra reply message
        if not job_id and "reply_to_message" in message:
            reply_text = message["reply_to_message"].get("text", "")
            match = re.search(r'Job ID:\s*<code>([^<]+)</code>', reply_text)
            if not match:
                match = re.search(r'([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})', reply_text)
            if match:
                job_id = match.group(1)
        
        if not job_id:
            await TelegramService.send_message(
                chat_id,
                "❌ Không tìm thấy Job ID. Vui lòng reply vào message job để upload kết quả."
            )
            return {"ok": True}
        
        # Kiểm tra job tồn tại
        job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
        if not job:
            await TelegramService.send_message(
                chat_id,
                f"❌ Job ID <code>{job_id}</code> không tồn tại."
            )
            return {"ok": True}
        
        if job.status == JobStatus.COMPLETED:
            await TelegramService.send_message(
                chat_id,
                f"⚠️ Job <code>{job_id}</code> đã hoàn thành rồi."
            )
            return {"ok": True}
        
        # Xử lý photo
        if "photo" in message:
            photos = message["photo"]
            # Lấy photo có kích thước lớn nhất
            largest_photo = max(photos, key=lambda p: p.get("file_size", 0))
            file_info = largest_photo
            file_type = "image"
        
        # Xử lý video
        elif "video" in message:
            file_info = message["video"]
            file_type = "video"
        
        # Xử lý document (có thể là ảnh hoặc video)
        elif "document" in message:
            doc = message["document"]
            mime_type = doc.get("mime_type", "")
            if mime_type.startswith("image/"):
                file_info = doc
                file_type = "image"
            elif mime_type.startswith("video/"):
                file_info = doc
                file_type = "video"
        
        if not file_info:
            await TelegramService.send_message(
                chat_id,
                "❌ Vui lòng gửi file ảnh hoặc video."
            )
            return {"ok": True}
        
        # Download file từ Telegram
        file_id = file_info["file_id"]
        file_url = await _get_telegram_file_url(file_id)
        
        if not file_url:
            await TelegramService.send_message(
                chat_id,
                "❌ Không thể tải file từ Telegram."
            )
            return {"ok": True}
        
        # Upload file lên Zipline
        try:
            filename = file_info.get("file_name", f"{job_id}_{file_type}.{'jpg' if file_type == 'image' else 'mp4'}")
            upload_result = await ZiplineService.upload_file_from_url(file_url, filename)
            result_url = upload_result["url"]
        except Exception as e:
            logger.error(f"Error uploading to Zipline: {str(e)}")
            # Đánh dấu job lỗi và hoàn trả credit cho user
            job.status = JobStatus.FAILED
            job.error_message = f"Upload Zipline failed: {str(e)}"
            db.commit()
            if job.reservation_id:
                await release_reservation(
                    job.reservation_id, db,
                    reason=f"Upload Zipline failed: {str(e)}"
                )
            await TelegramService.send_message(
                chat_id,
                f"❌ Lỗi khi upload file lên Zipline: {str(e)}\nĐã hoàn trả credit cho user."
            )
            return {"ok": True}
        
        # Cập nhật job
        job.status = JobStatus.COMPLETED
        job.progress = 100
        job.result_url = result_url
        job.admin_status = "completed"
        job.admin_notes = caption if caption else None
        job.completed_at = datetime.utcnow()
        db.commit()
        
        # Complete reservation (trừ credits)
        if job.reservation_id:
            await complete_reservation(job.reservation_id, db)
        
        # Gửi thông báo thành công
        await TelegramService.send_message(
            chat_id,
            f"✅ <b>Job hoàn thành!</b>\n\n"
            f"<b>Job ID:</b> <code>{job_id}</code>\n"
            f"<b>Result URL:</b> <a href=\"{result_url}\">Xem kết quả</a>"
        )
        
        return {"ok": True}
        
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"ok": False, "error": str(e)}


async def _get_telegram_file_url(file_id: str) -> Optional[str]:
    """
    Lấy URL để download file từ Telegram Bot API
    """
    if not TelegramService.TELEGRAM_BOT_TOKEN:
        return None
    
    # Lấy file path từ Telegram
    url = f"https://api.telegram.org/bot{TelegramService.TELEGRAM_BOT_TOKEN}/getFile"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params={"file_id": file_id}) as response:
                if response.status != 200:
                    return None
                
                data = await response.json()
                if not data.get("ok"):
                    return None
                
                file_path = data["result"]["file_path"]
                
                # Tạo URL để download file
                file_url = f"https://api.telegram.org/file/bot{TelegramService.TELEGRAM_BOT_TOKEN}/{file_path}"
                return file_url
                
    except Exception as e:
        logger.error(f"Error getting Telegram file URL: {str(e)}")
        return None

