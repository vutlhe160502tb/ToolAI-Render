import os
import aiohttp
from typing import Optional, List

class TelegramService:
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_ADMIN_CHAT_ID = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "")
    ADMIN_DASHBOARD_URL = os.getenv("ADMIN_DASHBOARD_URL", "http://localhost:3000/admin")
    
    @staticmethod
    async def send_message(chat_id: str, text: str, reply_markup: Optional[dict] = None) -> bool:
        """
        Gửi message qua Telegram Bot API
        """
        if not TelegramService.TELEGRAM_BOT_TOKEN:
            print("Warning: TELEGRAM_BOT_TOKEN not set, skipping Telegram notification")
            return False
        
        url = f"https://api.telegram.org/bot{TelegramService.TELEGRAM_BOT_TOKEN}/sendMessage"
        
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        
        if reply_markup:
            payload["reply_markup"] = reply_markup
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        error_text = await response.text()
                        print(f"Telegram API error: {response.status} - {error_text}")
                        return False
        except Exception as e:
            print(f"Error sending Telegram message: {str(e)}")
            return False
    
    @staticmethod
    async def send_photo(chat_id: str, photo_url: str, caption: str = "") -> bool:
        """
        Gửi ảnh qua Telegram Bot API
        """
        if not TelegramService.TELEGRAM_BOT_TOKEN:
            print("Warning: TELEGRAM_BOT_TOKEN not set, skipping Telegram notification")
            return False
        
        url = f"https://api.telegram.org/bot{TelegramService.TELEGRAM_BOT_TOKEN}/sendPhoto"
        
        # Telegram API yêu cầu gửi URL trong form data, không phải JSON
        payload = aiohttp.FormData()
        payload.add_field('chat_id', chat_id)
        payload.add_field('photo', photo_url)
        if caption:
            payload.add_field('caption', caption)
            payload.add_field('parse_mode', 'HTML')
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        error_text = await response.text()
                        print(f"Telegram API error: {response.status} - {error_text}")
                        return False
        except Exception as e:
            print(f"Error sending Telegram photo: {str(e)}")
            return False
    
    @staticmethod
    async def send_video(chat_id: str, video_url: str, caption: str = "") -> bool:
        """
        Gửi video qua Telegram Bot API
        """
        if not TelegramService.TELEGRAM_BOT_TOKEN:
            print("Warning: TELEGRAM_BOT_TOKEN not set, skipping Telegram notification")
            return False
        
        url = f"https://api.telegram.org/bot{TelegramService.TELEGRAM_BOT_TOKEN}/sendVideo"
        
        # Telegram API yêu cầu gửi URL trong form data, không phải JSON
        payload = aiohttp.FormData()
        payload.add_field('chat_id', chat_id)
        payload.add_field('video', video_url)
        if caption:
            payload.add_field('caption', caption)
            payload.add_field('parse_mode', 'HTML')
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data=payload) as response:
                    if response.status == 200:
                        return True
                    else:
                        error_text = await response.text()
                        print(f"Telegram API error: {response.status} - {error_text}")
                        return False
        except Exception as e:
            print(f"Error sending Telegram video: {str(e)}")
            return False
    
    @staticmethod
    async def send_job_notification(job_id: str, user_name: str, user_email: str, 
                                   feature_type: str, input_files: List[dict]) -> bool:
        """
        Gửi thông báo job mới cần xử lý cho người cầm bot
        input_files: List[{"url": "...", "type": "image"|"video", "name": "..."}]
        """
        if not TelegramService.TELEGRAM_ADMIN_CHAT_ID:
            print("Warning: TELEGRAM_ADMIN_CHAT_ID not set, skipping Telegram notification")
            return False
        
        # Format feature type name
        feature_names = {
            "create-image": "Tạo Ảnh",
            "create-video": "Tạo Video",
            "upscale-image": "Làm Nét Ảnh",
            "google-banana-pro": "Google Banana Pro",
            "product-model": "Người Mẫu Giới Thiệu Sản Phẩm",
            "change-outfit": "Thay Trang Phục",
            "skin-edit": "Chỉnh Sửa Da",
            "face-swap": "Face Swap",
            "character-swap": "Character Swap",
            "character-swap-2": "Character Swap 2",
            "dance-image-bg": "Nhảy Với Nền Từ Ảnh",
            "dance-video-bg": "Nhảy Với Nền Từ Video",
            "edit-video": "Edit Video",
            "replace-ad": "Thay Nhân Vật Quảng Cáo",
            "replace-ad-2": "Thay Nhân Vật Quảng Cáo 2",
            "product-intro-audio": "Giới Thiệu Sản Phẩm Theo Âm Thanh",
            "lip-sync": "Lips Sync",
        }
        
        # Feature descriptions
        feature_descriptions = {
            "create-image": "Biến mọi trí tưởng tượng thành hiện thực",
            "create-video": "Biến ảnh tĩnh nhàm chán trở nên hấp dẫn hơn",
            "upscale-image": "Tăng chất lượng hình ảnh lên tới 4k",
            "google-banana-pro": "Model tạo ảnh tốt nhất hiện nay",
            "product-model": "Ghép người mẫu và sản phẩm tuỳ biến",
            "change-outfit": "Thay mọi trang phục bạn muốn",
            "skin-edit": "Làn da nhân vật thực tế hơn",
            "face-swap": "Thay thế và hoà không",
            "character-swap": "Thay thế và hoán đổi nhân vật",
            "character-swap-2": "Thay thế và hoán đổi nhân vật",
            "dance-image-bg": "AI sẽ tạo video nhảy dùng nền từ ảnh gốc",
            "dance-video-bg": "AI sẽ tạo video nhảy dùng nền từ video gốc",
            "edit-video": "Tuỳ chỉnh và thay đổi chi tiết video",
            "replace-ad": "AI sẽ tạo video thay nhân vật quảng cáo",
            "replace-ad-2": "AI tạo video thay nhân vật quảng cáo",
            "product-intro-audio": "AI sẽ tạo video nói theo lời thoại",
            "lip-sync": "AI sẽ nhại theo tiếng file âm thanh",
        }
        
        feature_name = feature_names.get(feature_type, feature_type)
        description = feature_descriptions.get(feature_type, "")
        
        # Gửi message thông tin trước với inline keyboard
        message = f"""
🎨 <b>JOB MỚI CẦN XỬ LÝ</b>

<b>Job ID:</b> <code>{job_id}</code>
<b>User:</b> {user_name} ({user_email})
<b>Feature:</b> {feature_name}
<b>Yêu cầu:</b> {description}

💡 <i>Reply với file ảnh/video để upload kết quả</i>
        """.strip()
        
        # Tạo inline keyboard với nút hướng dẫn
        reply_markup = {
            "inline_keyboard": [[
                {
                    "text": "📤 Gửi file kết quả",
                    "callback_data": f"upload_result_{job_id}"
                }
            ]]
        }
        
        await TelegramService.send_message(
            TelegramService.TELEGRAM_ADMIN_CHAT_ID,
            message,
            reply_markup=reply_markup
        )
        
        # Gửi files (ảnh/video) trực tiếp
        for file_info in input_files:
            file_url = file_info.get("url", "")
            file_type = file_info.get("type", "")
            file_name = file_info.get("name", "")
            
            caption = f"<b>File:</b> {file_name}\n<b>Job ID:</b> <code>{job_id}</code>"
            
            if file_type == "image":
                await TelegramService.send_photo(
                    TelegramService.TELEGRAM_ADMIN_CHAT_ID,
                    file_url,
                    caption
                )
            elif file_type == "video":
                await TelegramService.send_video(
                    TelegramService.TELEGRAM_ADMIN_CHAT_ID,
                    file_url,
                    caption
                )
        
        return True
    
    @staticmethod
    async def send_job_completed_notification(job_id: str, user_name: str, result_url: str) -> bool:
        """
        Gửi thông báo job đã hoàn thành (optional, có thể dùng để notify user)
        """
        if not TelegramService.TELEGRAM_ADMIN_CHAT_ID:
            return False
        
        message = f"""
✅ <b>JOB ĐÃ HOÀN THÀNH</b>

<b>Job ID:</b> <code>{job_id}</code>
<b>User:</b> {user_name}
<b>Result:</b> <a href="{result_url}">Xem kết quả</a>
        """.strip()
        
        return await TelegramService.send_message(
            TelegramService.TELEGRAM_ADMIN_CHAT_ID,
            message
        )

