from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import VideoJob, JobStatus, User
from api.utils.credits import complete_reservation, release_reservation
from services.zipline_service import ZiplineService
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()

class CompleteJobRequest(BaseModel):
    result_url: str
    admin_notes: Optional[str] = None


class FailJobRequest(BaseModel):
    reason: Optional[str] = None


class DeleteJobsRequest(BaseModel):
    job_ids: List[str]
    user_id: str

@router.get("/")
async def get_jobs(
    user_id: Optional[str] = Query(None, description="User ID (optional, if not provided returns all jobs for admin)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    admin: Optional[bool] = Query(False, description="Admin mode - get all jobs"),
    db: Session = Depends(get_db)
):
    """
    Get jobs - if user_id provided, returns user's jobs; if admin=True, returns all jobs
    """
    if admin:
        # Admin mode: get all jobs
        query = db.query(VideoJob)
    elif user_id:
        # User mode: get user's jobs only
        query = db.query(VideoJob).filter(VideoJob.user_id == user_id)
    else:
        raise HTTPException(status_code=400, detail="Either user_id or admin=true must be provided")
    
    if status and status != 'all':
        try:
            status_enum = JobStatus(status)
            query = query.filter(VideoJob.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status")
    
    jobs = query.order_by(VideoJob.created_at.desc()).all()
    
    return {
        "jobs": [
            {
                "id": job.id,
                "user_id": job.user_id,
                "feature_type": job.feature_type,
                "status": job.status.value,
                "progress": job.progress,
                "result_url": job.result_url,
                "input_file_url": job.input_file_url,
                "prompt": job.prompt,
                "admin_status": job.admin_status,
                "admin_notes": job.admin_notes,
                "created_at": job.created_at.isoformat() if job.created_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            }
            for job in jobs
        ]
    }

@router.post("/{job_id}/complete")
async def complete_job(
    job_id: str,
    request: CompleteJobRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint để admin cập nhật kết quả job (dùng result_url)
    """
    job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status == JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job already completed")
    
    # Cập nhật job
    job.status = JobStatus.COMPLETED
    job.progress = 100
    job.result_url = request.result_url
    job.admin_status = "completed"
    job.admin_notes = request.admin_notes
    job.completed_at = datetime.utcnow()
    db.commit()
    
    # Complete reservation (trừ credits)
    if job.reservation_id:
        await complete_reservation(job.reservation_id, db)
    
    return {
        "job_id": job.id,
        "status": job.status.value,
        "progress": job.progress,
        "result_url": job.result_url,
        "message": "Job completed successfully"
    }


@router.post("/delete")
async def delete_jobs(
    request: DeleteJobsRequest,
    db: Session = Depends(get_db)
):
    """
    Xóa hẳn các job khỏi database. Chỉ xóa job thuộc user_id trong request.
    """
    if not request.job_ids:
        return {"deleted_count": 0, "message": "No jobs to delete"}

    deleted = 0
    for job_id in request.job_ids:
        job = db.query(VideoJob).filter(
            VideoJob.id == job_id,
            VideoJob.user_id == request.user_id
        ).first()
        if job:
            db.delete(job)
            deleted += 1

    db.commit()
    return {
        "deleted_count": deleted,
        "message": f"Deleted {deleted} job(s)"
    }


@router.post("/{job_id}/fail")
async def fail_job(
    job_id: str,
    request: Optional[FailJobRequest] = Body(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint để admin đánh dấu job lỗi (ảnh/video lỗi, không gửi được cho user).
    Hoàn trả credit cho user.
    """
    job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job already completed")
    if job.status == JobStatus.FAILED:
        return {"job_id": job.id, "status": "FAILED", "message": "Job already marked as failed"}

    reason = (request.reason if request else None) or "Job failed (image/video error)"
    job.status = JobStatus.FAILED
    job.error_message = reason
    job.admin_status = "failed"
    job.admin_notes = reason
    db.commit()

    if job.reservation_id:
        await release_reservation(job.reservation_id, db, reason=reason)

    return {
        "job_id": job.id,
        "status": job.status.value,
        "message": "Job marked as failed, credits refunded"
    }


@router.post("/{job_id}/complete-with-file")
async def complete_job_with_file(
    job_id: str,
    file: UploadFile = File(...),
    admin_notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint để admin upload file kết quả và complete job
    """
    job = db.query(VideoJob).filter(VideoJob.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status == JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job already completed")
    
    # Upload file lên Zipline
    try:
        upload_result = await ZiplineService.upload_file(file)
        result_url = upload_result["url"]
    except Exception as e:
        # Hoàn trả credit vì upload thất bại, job không có kết quả
        if job.reservation_id:
            await release_reservation(
                job.reservation_id, db,
                reason=f"Upload failed: {str(e)}"
            )
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    # Cập nhật job
    job.status = JobStatus.COMPLETED
    job.progress = 100
    job.result_url = result_url
    job.admin_status = "completed"
    job.admin_notes = admin_notes
    job.completed_at = datetime.utcnow()
    db.commit()
    
    # Complete reservation (trừ credits)
    if job.reservation_id:
        await complete_reservation(job.reservation_id, db)
    
    return {
        "job_id": job.id,
        "status": job.status.value,
        "progress": job.progress,
        "result_url": job.result_url,
        "message": "Job completed successfully"
    }

