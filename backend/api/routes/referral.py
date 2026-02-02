from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from services.referral_service import ReferralService

router = APIRouter()


class AttachReferralRequest(BaseModel):
    user_id: str
    referral_code: str


@router.get("/me")
async def get_my_referral(
    user_id: str = Query(..., description="User ID"),
    db: Session = Depends(get_db),
):
    try:
        return ReferralService.get_referral_summary(user_id=user_id, db=db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/attach")
async def attach_referrer(
    request: AttachReferralRequest,
    db: Session = Depends(get_db),
):
    try:
        return ReferralService.attach_referrer(
            user_id=request.user_id,
            referral_code=request.referral_code,
            db=db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

