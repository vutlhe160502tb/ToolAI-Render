from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import VideoJob, JobStatus, User
from api.utils.credits import complete_reservation
from services.zipline_service import ZiplineService
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class CompleteJobRequest(BaseModel):
    result_url: str
    admin_notes: Optional[str] = None

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

