from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from database import get_db
from models import User
from services.zipline_service import ZiplineService

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/avatar")
@limiter.limit("20/minute")
async def upload_user_avatar(
    request: Request,
    user_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload avatar lên Zipline và lưu URL vào DB (users.picture)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        result = await ZiplineService.upload_file(file)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Configuration error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    user.picture = result["url"]
    db.commit()
    db.refresh(user)

    return {
        "user_id": user.id,
        "picture": user.picture,
        "name": user.name,
        "email": user.email,
    }

