from fastapi import APIRouter, Depends, HTTPException, Request, Header
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from services.payment_service import PaymentService


router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class CreateOrderRequest(BaseModel):
    user_id: str | None = None
    coins: float
    amount_vnd: float


@router.post("/create-order")
@limiter.limit("10/minute")
def create_order(
    request: Request,
    body: CreateOrderRequest,
    db: Session = Depends(get_db),
):
    try:
        data = PaymentService.create_payment_order(
            db=db,
            user_id=body.user_id,
            coins=body.coins,
            amount_vnd=body.amount_vnd,
        )
        # Aliases to match flow documentation wording
        data["qr_content"] = data.get("transfer_content")
        data["amount"] = data.get("amount_vnd")
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{transaction_id}/status")
@limiter.limit("60/minute")
def payment_status(
    request: Request,
    transaction_id: str,
    db: Session = Depends(get_db),
):
    try:
        data = PaymentService.get_payment_status(db=db, transaction_id=transaction_id)
        status = (data.get("status") or "").strip().lower()
        # Return keys similar to the doc
        return {
            "transaction_id": data.get("transaction_id"),
            "status": status,
            "amount": data.get("amount_vnd"),
            "coins": data.get("coins"),
            "credits": data.get("user_credits"),
            "user_id": data.get("user_id"),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
@limiter.limit("120/minute")
async def payment_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret"),
):
    try:
        payload = await request.json()
        result = PaymentService.process_webhook(db=db, payload=payload, signature=x_webhook_secret)
        return result
    except ValueError as e:
        msg = str(e)
        if "not found" in msg.lower():
            raise HTTPException(status_code=404, detail=msg)
        if "signature" in msg.lower():
            raise HTTPException(status_code=401, detail=msg)
        raise HTTPException(status_code=400, detail=msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

