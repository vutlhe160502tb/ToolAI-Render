from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, Body, BackgroundTasks
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from database import get_db
from models import VideoJob, JobStatus, User
from api.utils.credits import check_and_reserve_credits, complete_reservation
from services.telegram_service import TelegramService
from services.zipline_service import ZiplineService
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime
import asyncio

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Helper function để validate và upload files
async def validate_and_upload_files(
    files: List[UploadFile],
    allowed_types_map: dict,  # {"field_name": ["type1", "type2"]}
    max_sizes_map: dict,  # {"field_name": size_in_bytes}
    field_names: List[str]
) -> List[dict]:
    """Validate và upload files, trả về list of file results"""
    results = []
    
    for i, file in enumerate(files):
        field_name = field_names[i] if i < len(field_names) else f"file{i}"
        allowed_types = allowed_types_map.get(field_name, [])
        max_size = max_sizes_map.get(field_name, 50 * 1024 * 1024)
        
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid {field_name} type")
        
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail=f"{field_name} size exceeds {max_size // 1024 // 1024}MB limit")
        
        await file.seek(0)
        
        try:
            result = await ZiplineService.upload_file(file)
            file_type = "video" if file.content_type.startswith("video/") else ("audio" if file.content_type.startswith("audio/") else "image")
            results.append({"url": result["url"], "type": file_type, "name": result["name"]})
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload {field_name}: {str(e)}")
    
    return results

# Helper function để gửi Telegram notification an toàn
async def _send_telegram_notification_safe(
    job_id: str,
    user_name: str,
    user_email: str,
    feature_type: str,
    input_files: List[dict],
    prompt: Optional[str] = None
):
    """Wrapper để gửi Telegram notification với error handling"""
    try:
        await TelegramService.send_job_notification(
            job_id=job_id,
            user_name=user_name,
            user_email=user_email,
            feature_type=feature_type,
            input_files=input_files,
            prompt=prompt
        )
    except Exception as e:
        print(f"Error sending Telegram notification for job {job_id}: {str(e)}")
        # Không raise exception, chỉ log

# Helper function để tạo job chung
async def create_job_helper(
    user_id: str,
    feature_type: str,
    input_files: List[dict],  # [{"url": "...", "type": "...", "name": "..."}]
    prompt: Optional[str] = None,
    db: Session = None,
    background_tasks: Optional[BackgroundTasks] = None
) -> dict:
    """
    Helper function để tạo job: upload files, reserve credits, tạo job, gửi Telegram
    """
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="Database session is required")
        
        # Validate user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check and reserve credits
        try:
            reservation_id = await check_and_reserve_credits(
                user_id=user_id,
                feature_type=feature_type,
                db=db
            )
        except ValueError as e:
            raise HTTPException(status_code=402, detail=str(e))
        
        # Create job
        job_id = str(uuid.uuid4())
        job = VideoJob(
            id=job_id,
            user_id=user_id,
            feature_type=feature_type,
            status=JobStatus.PENDING,
            progress=0,
            reservation_id=reservation_id,
            input_file_url=input_files[0]["url"] if input_files else None,
            prompt=prompt,
            admin_status="pending"
        )
        db.add(job)
        db.commit()
        
        # Send Telegram notification (background task, không block response)
        if background_tasks:
            background_tasks.add_task(
                _send_telegram_notification_safe,
                job_id=job_id,
                user_name=user.name or "Unknown",
                user_email=user.email or "",
                feature_type=feature_type,
                input_files=input_files,
                prompt=prompt
            )
        else:
            # Fallback: dùng asyncio.create_task nhưng wrap trong try-except
            try:
                asyncio.create_task(
                    _send_telegram_notification_safe(
                        job_id=job_id,
                        user_name=user.name or "Unknown",
                        user_email=user.email or "",
                        feature_type=feature_type,
                        input_files=input_files,
                        prompt=prompt
                    )
                )
            except Exception as e:
                print(f"Warning: Failed to schedule Telegram notification: {str(e)}")
        
        return {"job_id": job_id, "status": "pending"}
    except HTTPException:
        raise
    except Exception as e:
        # Đảm bảo luôn trả về JSON error
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/dance-image-bg")
@limiter.limit("10/minute")  # Max 10 requests per minute per IP
async def create_dance_image_bg(
    request: Request,  # Add Request parameter for rate limiting
    image: UploadFile = File(...),
    video: UploadFile = File(...),
    user_id: str = Form(...),  # Get from form data, required
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    # Validate file types
    allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    allowed_video_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    
    input_files = await validate_and_upload_files(
        [image, video],
        {"image": allowed_image_types, "video": allowed_video_types},
        {"image": 50 * 1024 * 1024, "video": 200 * 1024 * 1024},
        ["image", "video"]
    )
    
    return await create_job_helper(
        user_id=user_id,
        feature_type="dance-image-bg",
        input_files=input_files,
        db=db,
        background_tasks=background_tasks
    )

@router.get("/{job_id}/progress")
async def get_job_progress(
    job_id: str,
    db: Session = Depends(get_db)
):
    job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job.id,
        "status": job.status.value,
        "progress": job.progress,
        "result_url": job.result_url,
        "error_message": job.error_message
    }

# ========== CREATE IMAGE ==========
@router.post("/create-image")
@limiter.limit("10/minute")
async def create_image(
    request: Request,
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Tạo ảnh từ prompt và file reference (optional)"""
    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP")
    
    # Validate file size (50MB)
    MAX_SIZE = 50 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
    
    await file.seek(0)
    
    # Upload to Zipline
    try:
        file_result = await ZiplineService.upload_file(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    # Create job
    return await create_job_helper(
        user_id=user_id,
        feature_type="create-image",
        input_files=[{"url": file_result["url"], "type": "image", "name": file_result["name"]}],
        prompt=prompt,
        db=db,
        background_tasks=background_tasks
    )

# ========== CREATE VIDEO ==========
@router.post("/create-video")
@limiter.limit("10/minute")
async def create_video(
    request: Request,
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Tạo video từ prompt và file reference (optional)"""
    # Validate file type (có thể là image hoặc video)
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 
                     'video/mp4', 'video/quicktime', 'video/x-msvideo']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Validate file size (200MB)
    MAX_SIZE = 200 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 200MB limit")
    
    await file.seek(0)
    
    # Upload to Zipline
    try:
        file_result = await ZiplineService.upload_file(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    # Determine file type
    file_type = "video" if file.content_type.startswith("video/") else "image"
    
    # Create job
    return await create_job_helper(
        user_id=user_id,
        feature_type="create-video",
        input_files=[{"url": file_result["url"], "type": file_type, "name": file_result["name"]}],
        prompt=prompt,
        db=db,
        background_tasks=background_tasks
    )

# ========== UPSCALE IMAGE ==========
@router.post("/upscale-image")
@limiter.limit("10/minute")
async def upscale_image(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Làm nét ảnh"""
    # Validate file type
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP")
    
    # Validate file size (50MB)
    MAX_SIZE = 50 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
    
    await file.seek(0)
    
    # Upload to Zipline
    try:
        file_result = await ZiplineService.upload_file(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    # Create job
    return await create_job_helper(
        user_id=user_id,
        feature_type="upscale-image",
        input_files=[{"url": file_result["url"], "type": "image", "name": file_result["name"]}],
        db=db,
        background_tasks=background_tasks
    )

# ========== CHANGE OUTFIT ==========
@router.post("/change-outfit")
@limiter.limit("10/minute")
async def change_outfit(
    request: Request,
    image: UploadFile = File(...),
    outfit_image: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Thay trang phục"""
    # Validate file types
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid image type")
    if outfit_image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid outfit image type")
    
    # Validate file sizes (50MB each)
    MAX_SIZE = 50 * 1024 * 1024
    image_content = await image.read()
    outfit_content = await outfit_image.read()
    if len(image_content) > MAX_SIZE or len(outfit_content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
    
    await image.seek(0)
    await outfit_image.seek(0)
    
    # Upload to Zipline
    try:
        image_result = await ZiplineService.upload_file(image)
        outfit_result = await ZiplineService.upload_file(outfit_image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload files: {str(e)}")
    
    # Create job
    return await create_job_helper(
        user_id=user_id,
        feature_type="change-outfit",
        input_files=[
            {"url": image_result["url"], "type": "image", "name": image_result["name"]},
            {"url": outfit_result["url"], "type": "image", "name": outfit_result["name"]}
        ],
        db=db,
        background_tasks=background_tasks
    )

# ========== DANCE VIDEO BG ==========
@router.post("/dance-video-bg")
@limiter.limit("10/minute")
async def create_dance_video_bg(
    request: Request,
    image: UploadFile = File(...),
    video: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Nhảy với nền từ video"""
    allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    allowed_video_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    
    input_files = await validate_and_upload_files(
        [image, video],
        {"image": allowed_image_types, "video": allowed_video_types},
        {"image": 50 * 1024 * 1024, "video": 200 * 1024 * 1024},
        ["image", "video"]
    )
    
    return await create_job_helper(user_id, "dance-video-bg", input_files, db=db, background_tasks=background_tasks)

# ========== PRODUCT MODEL ==========
@router.post("/product-model")
@limiter.limit("10/minute")
async def create_product_model(
    request: Request,
    product_image: UploadFile = File(...),
    model_img: UploadFile = File(..., alias="model_image"),  # Renamed to avoid Pydantic conflict with "model_" namespace
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Người mẫu giới thiệu sản phẩm"""
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    input_files = await validate_and_upload_files(
        [product_image, model_img],
        {"product_image": allowed_types, "model_image": allowed_types},
        {"product_image": 50 * 1024 * 1024, "model_image": 50 * 1024 * 1024},
        ["product_image", "model_image"]
    )
    
    return await create_job_helper(user_id, "product-model", input_files, db=db, background_tasks=background_tasks)

# ========== SKIN EDIT ==========
@router.post("/skin-edit")
@limiter.limit("10/minute")
async def skin_edit(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Chỉnh sửa da"""
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    input_files = await validate_and_upload_files(
        [file],
        {"file": allowed_types},
        {"file": 50 * 1024 * 1024},
        ["file"]
    )
    
    return await create_job_helper(user_id, "skin-edit", input_files, db=db, background_tasks=background_tasks)

# ========== FACE SWAP ==========
@router.post("/face-swap")
@limiter.limit("10/minute")
async def face_swap(
    request: Request,
    source_image: UploadFile = File(...),
    target_image: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Face swap"""
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    input_files = await validate_and_upload_files(
        [source_image, target_image],
        {"source_image": allowed_types, "target_image": allowed_types},
        {"source_image": 50 * 1024 * 1024, "target_image": 50 * 1024 * 1024},
        ["source_image", "target_image"]
    )
    
    return await create_job_helper(user_id, "face-swap", input_files, db=db, background_tasks=background_tasks)

# ========== CHARACTER SWAP ==========
@router.post("/character-swap")
@limiter.limit("10/minute")
async def character_swap(
    request: Request,
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Character swap"""
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                     'video/mp4', 'video/quicktime', 'video/x-msvideo']
    
    # Determine max size based on file type
    file1_content = await file1.read()
    file2_content = await file2.read()
    max_size1 = 200 * 1024 * 1024 if file1.content_type.startswith("video/") else 50 * 1024 * 1024
    max_size2 = 200 * 1024 * 1024 if file2.content_type.startswith("video/") else 50 * 1024 * 1024
    
    await file1.seek(0)
    await file2.seek(0)
    
    input_files = await validate_and_upload_files(
        [file1, file2],
        {"file1": allowed_types, "file2": allowed_types},
        {"file1": max_size1, "file2": max_size2},
        ["file1", "file2"]
    )
    
    return await create_job_helper(user_id, "character-swap", input_files, db=db, background_tasks=background_tasks)

# ========== CHARACTER SWAP 2 ==========
@router.post("/character-swap-2")
@limiter.limit("10/minute")
async def character_swap_2(
    request: Request,
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Character swap version 2"""
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                     'video/mp4', 'video/quicktime', 'video/x-msvideo']
    
    file1_content = await file1.read()
    file2_content = await file2.read()
    max_size1 = 200 * 1024 * 1024 if file1.content_type.startswith("video/") else 50 * 1024 * 1024
    max_size2 = 200 * 1024 * 1024 if file2.content_type.startswith("video/") else 50 * 1024 * 1024
    
    await file1.seek(0)
    await file2.seek(0)
    
    input_files = await validate_and_upload_files(
        [file1, file2],
        {"file1": allowed_types, "file2": allowed_types},
        {"file1": max_size1, "file2": max_size2},
        ["file1", "file2"]
    )
    
    return await create_job_helper(user_id, "character-swap-2", input_files, db=db, background_tasks=background_tasks)

# ========== EDIT VIDEO ==========
@router.post("/edit-video")
@limiter.limit("10/minute")
async def edit_video(
    request: Request,
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Edit video"""
    allowed_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    
    input_files = await validate_and_upload_files(
        [file],
        {"file": allowed_types},
        {"file": 200 * 1024 * 1024},
        ["file"]
    )
    
    return await create_job_helper(user_id, "edit-video", input_files, prompt=prompt, db=db, background_tasks=background_tasks)

# ========== REPLACE AD ==========
@router.post("/replace-ad")
@limiter.limit("10/minute")
async def replace_ad(
    request: Request,
    video: UploadFile = File(...),
    character_image: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Thay nhân vật quảng cáo"""
    allowed_video_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    input_files = await validate_and_upload_files(
        [video, character_image],
        {"video": allowed_video_types, "character_image": allowed_image_types},
        {"video": 200 * 1024 * 1024, "character_image": 50 * 1024 * 1024},
        ["video", "character_image"]
    )
    
    return await create_job_helper(user_id, "replace-ad", input_files, db=db, background_tasks=background_tasks)

# ========== REPLACE AD 2 ==========
@router.post("/replace-ad-2")
@limiter.limit("10/minute")
async def replace_ad_2(
    request: Request,
    video: UploadFile = File(...),
    character_image: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Thay nhân vật quảng cáo version 2"""
    allowed_video_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
    allowed_image_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    input_files = await validate_and_upload_files(
        [video, character_image],
        {"video": allowed_video_types, "character_image": allowed_image_types},
        {"video": 200 * 1024 * 1024, "character_image": 50 * 1024 * 1024},
        ["video", "character_image"]
    )
    
    return await create_job_helper(user_id, "replace-ad-2", input_files, db=db, background_tasks=background_tasks)

# ========== PRODUCT INTRO AUDIO ==========
@router.post("/product-intro-audio")
@limiter.limit("10/minute")
async def product_intro_audio(
    request: Request,
    file: UploadFile = File(...),
    audio: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Giới thiệu sản phẩm theo âm thanh"""
    allowed_file_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                          'video/mp4', 'video/quicktime', 'video/x-msvideo']
    allowed_audio_types = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
    
    file_content = await file.read()
    max_file_size = 200 * 1024 * 1024 if file.content_type.startswith("video/") else 50 * 1024 * 1024
    await file.seek(0)
    
    input_files = await validate_and_upload_files(
        [file, audio],
        {"file": allowed_file_types, "audio": allowed_audio_types},
        {"file": max_file_size, "audio": 50 * 1024 * 1024},
        ["file", "audio"]
    )
    
    return await create_job_helper(user_id, "product-intro-audio", input_files, db=db, background_tasks=background_tasks)

# ========== LIP SYNC ==========
@router.post("/lip-sync")
@limiter.limit("10/minute")
async def lip_sync(
    request: Request,
    file: UploadFile = File(...),
    audio: UploadFile = File(...),
    user_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    """Lips sync"""
    allowed_file_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp',
                          'video/mp4', 'video/quicktime', 'video/x-msvideo']
    allowed_audio_types = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
    
    file_content = await file.read()
    max_file_size = 200 * 1024 * 1024 if file.content_type.startswith("video/") else 50 * 1024 * 1024
    await file.seek(0)
    
    input_files = await validate_and_upload_files(
        [file, audio],
        {"file": allowed_file_types, "audio": allowed_audio_types},
        {"file": max_file_size, "audio": 50 * 1024 * 1024},
        ["file", "audio"]
    )
    
    return await create_job_helper(user_id, "lip-sync", input_files, db=db, background_tasks=background_tasks)

