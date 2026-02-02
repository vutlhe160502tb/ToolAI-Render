from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from database import get_db
from models import User
from pydantic import BaseModel
import uuid
import os

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

class GoogleAuthRequest(BaseModel):
    token: str
    email: str
    name: str
    avatar_url: str = None

@router.post("/google")
@limiter.limit("5/minute")  # Max 5 login attempts per minute
async def google_auth(
    request: Request,  # Add Request parameter for rate limiting
    auth_request: GoogleAuthRequest, 
    db: Session = Depends(get_db)
):
    # Verify Google token
    try:
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        if not GOOGLE_CLIENT_ID:
            # In development, skip verification if not configured
            if os.getenv("ENV", "development").lower() == "development":
                pass  # Skip verification in dev
            else:
                raise HTTPException(status_code=500, detail="Google client ID not configured")
        else:
            # Verify token
            from google.oauth2 import id_token
            from google.auth.transport import requests as google_requests
            
            idinfo = id_token.verify_oauth2_token(
                auth_request.token, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            # Verify email matches
            if idinfo.get('email') != auth_request.email:
                raise HTTPException(status_code=401, detail="Email mismatch")
    except ValueError as e:
        # Invalid token
        if os.getenv("ENV", "development").lower() == "production":
            raise HTTPException(status_code=401, detail="Invalid Google token")
        # In development, allow without verification
        pass
    except Exception as e:
        # Other errors
        if os.getenv("ENV", "development").lower() == "production":
            raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
        # In development, allow without verification
        pass
    
    # Create/update user
    user = db.query(User).filter(User.email == auth_request.email).first()
    
    if user:
        user.name = auth_request.name
        if auth_request.avatar_url:
            user.picture = auth_request.avatar_url
    else:
        user = User(
            id=str(uuid.uuid4()),
            email=auth_request.email,
            name=auth_request.name,
            picture=auth_request.avatar_url,
            credits=0.0
        )
        db.add(user)
    
    db.commit()
    db.refresh(user)

    # Ensure user has a referral_code for sharing
    try:
        from services.referral_service import ReferralService

        ReferralService.ensure_referral_code(user, db)
    except Exception:
        # Don't block login if referral code generation fails
        pass
    
    return {
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "credits": user.credits,
        "is_admin": user.is_admin if hasattr(user, 'is_admin') else False
    }

