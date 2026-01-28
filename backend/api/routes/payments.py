from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from database import get_db
from services.payment_service import PaymentService, verify_webhook_signature
from models import PaymentStatus
from pydantic import BaseModel
from typing import Optional
import os
import logging
import requests

logger = logging.getLogger(__name__)

router = APIRouter()

# Request models
class CreateOrderRequest(BaseModel):
    package_id: int
    amount: float
    coins: float
    user_id: str

class WebhookRequest(BaseModel):
    # SePay format
    paymentCode: Optional[str] = None
    status: str
    amount: Optional[float] = None
    paidAt: Optional[str] = None
    productCode: Optional[str] = None
    customerCode: Optional[str] = None
    # Legacy format (for backward compatibility)
    transaction_id: Optional[str] = None
    transfer_content: Optional[str] = None
    timestamp: Optional[str] = None
    signature: Optional[str] = None

@router.post("/create-order")
async def create_payment_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Creating payment order: user_id={request.user_id}, package_id={request.package_id}, amount={request.amount}, coins={request.coins}")
        
        # Validate input
        if not request.user_id or request.user_id.strip() == "":
            logger.warning(f"Invalid user_id: {request.user_id}")
            raise HTTPException(status_code=400, detail="user_id is required")
        if request.package_id <= 0:
            logger.warning(f"Invalid package_id: {request.package_id}")
            raise HTTPException(status_code=400, detail="package_id must be positive")
        if request.amount <= 0:
            logger.warning(f"Invalid amount: {request.amount}")
            raise HTTPException(status_code=400, detail="amount must be positive")
        if request.coins <= 0:
            logger.warning(f"Invalid coins: {request.coins}")
            raise HTTPException(status_code=400, detail="coins must be positive")
        
        result = PaymentService.create_payment_order(
            user_id=request.user_id,
            package_id=request.package_id,
            amount=request.amount,
            credits=request.coins,
            db=db
        )
        logger.info(f"Payment order created successfully: transaction_id={result.get('transaction_id')}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error creating payment order: {error_msg}", exc_info=True)
        
        # Check if it's a SePay API error
        if "SePay API" in error_msg or "SePay" in error_msg:
            raise HTTPException(
                status_code=502, 
                detail=f"Lỗi kết nối SePay: {error_msg}. Vui lòng thử lại sau."
            )
        else:
            raise HTTPException(status_code=500, detail=f"Lỗi tạo đơn thanh toán: {error_msg}")

@router.post("/webhook")
async def payment_webhook(
    webhook_request: WebhookRequest,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for payment gateway to notify about payment status.
    Payment gateway will call this endpoint when a payment is completed/failed.
    
    Security:
    - Verifies HMAC-SHA256 signature from X-Signature header
    - Uses WEBHOOK_SECRET_KEY from environment variables
    - Rejects webhook if signature verification fails
    
    Flow:
    1. Get signature from X-Signature header (preferred) or request body (fallback)
    2. Verify signature using WEBHOOK_SECRET_KEY
    3. If valid, process webhook and update payment status
    4. If invalid, return 401 Unauthorized
    """
    # Get webhook secret from environment
    webhook_secret = os.getenv("WEBHOOK_SECRET_KEY")
    
    if not webhook_secret:
        logger.error("WEBHOOK_SECRET_KEY not configured in environment")
        raise HTTPException(
            status_code=500,
            detail="Webhook secret key not configured"
        )
    
    # Get signature from header (preferred) or request body (fallback for compatibility)
    signature = x_signature or webhook_request.signature
    
    # Determine if this is SePay webhook or legacy webhook
    is_sepay = webhook_request.paymentCode is not None
    
    # Verify signature if provided (skip for test/development if signature is None)
    if signature:
        # Convert request to dict for signature verification
        if is_sepay:
            payload_dict = {
                "paymentCode": webhook_request.paymentCode,
                "status": webhook_request.status,
                "amount": webhook_request.amount,
                "paidAt": webhook_request.paidAt,
                "productCode": webhook_request.productCode,
                "customerCode": webhook_request.customerCode
            }
        else:
            payload_dict = {
                "transaction_id": webhook_request.transaction_id,
                "amount": webhook_request.amount,
                "status": webhook_request.status,
                "transfer_content": webhook_request.transfer_content,
                "paid_at": webhook_request.paidAt or webhook_request.paid_at,
                "timestamp": webhook_request.timestamp
            }
        # Remove None values for cleaner signature calculation
        payload_dict = {k: v for k, v in payload_dict.items() if v is not None}
        
        if not verify_webhook_signature(payload_dict, signature, webhook_secret):
            identifier = webhook_request.paymentCode or webhook_request.transaction_id
            logger.error(f"Invalid webhook signature for {identifier}")
            raise HTTPException(
                status_code=401,
                detail="Invalid webhook signature"
            )
        identifier = webhook_request.paymentCode or webhook_request.transaction_id
        logger.info(f"Webhook signature verified for {identifier}")
    else:
        # Log warning if signature is missing (but allow for development/testing)
        env = os.getenv("ENV", "development").lower()
        if env == "production":
            logger.warning("Webhook signature missing in production environment")
            raise HTTPException(
                status_code=401,
                detail="Webhook signature required in production"
            )
        else:
            logger.warning("Webhook signature missing (allowed in development mode)")
    
    try:
        # Process SePay webhook format
        if is_sepay:
            result = PaymentService.process_webhook(
                payment_code=webhook_request.paymentCode,
                amount=webhook_request.amount,
                status=webhook_request.status,
                paid_at=webhook_request.paidAt,
                product_code=webhook_request.productCode,
                customer_code=webhook_request.customerCode,
                signature=signature,
                db=db
            )
        else:
            # Legacy webhook format
            result = PaymentService.process_webhook(
                transaction_id=webhook_request.transaction_id,
                amount=webhook_request.amount,
                status=webhook_request.status,
                transfer_content=webhook_request.transfer_content,
                paid_at=webhook_request.paidAt or webhook_request.paid_at,
                timestamp=webhook_request.timestamp,
                signature=signature,
                db=db
            )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{identifier}/status")
async def get_payment_status(
    identifier: str,
    db: Session = Depends(get_db)
):
    """
    Get payment status for polling.
    Frontend will call this endpoint every few seconds to check payment status.
    Supports both transaction_id and payment_code (SePay).
    """
    try:
        # Try to find by payment_code first (SePay), then transaction_id
        from models import Payment
        
        payment = db.query(Payment).filter(
            Payment.payment_code == identifier
        ).first()
        
        if not payment:
            payment = db.query(Payment).filter(
                Payment.transaction_id == identifier
            ).first()
        
        if not payment:
            raise ValueError(f"Payment not found for identifier: {identifier}")
        
        # If payment has payment_code, check SePay API for latest status
        if payment.payment_code:
            sepay_api_url = os.getenv("SEPAY_API_URL", "https://qr-moniter.up.railway.app")
            try:
                sepay_response = requests.get(
                    f"{sepay_api_url}/payments/{payment.payment_code}",
                    headers={"Accept": "application/json"},
                    timeout=5
                )
                if sepay_response.status_code == 200:
                    sepay_data = sepay_response.json()
                    # Update local status if SePay status changed
                    sepay_status = sepay_data.get("status", "").lower()
                    if sepay_status == "paid" and payment.status != PaymentStatus.COMPLETED:
                        # Trigger webhook processing if status changed to paid
                        PaymentService.process_webhook(
                            payment_code=payment.payment_code,
                            amount=sepay_data.get("amount", payment.amount),
                            status=sepay_status,
                            paid_at=sepay_data.get("paidAt"),
                            db=db
                        )
                        db.refresh(payment)
                    # Return SePay format for FE (paymentCode, status, amount, qrUrl, paidAt)
                    return {
                        "paymentCode": sepay_data.get("paymentCode") or payment.payment_code,
                        "status": sepay_data.get("status", "").lower(),
                        "amount": sepay_data.get("amount", payment.amount),
                        "qrUrl": sepay_data.get("qrUrl") or payment.qr_code_url,
                        "paidAt": sepay_data.get("paidAt"),
                    }
            except Exception as e:
                logger.warning(f"Failed to fetch SePay status: {str(e)}, using local status")
        
        result = PaymentService.get_payment_status(
            transaction_id=payment.transaction_id,
            db=db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_payment_history(
    user_id: str = Query(..., description="User ID"),
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db)
):
    """
    Get payment history for a user.
    Returns list of payments ordered by created_at DESC.
    """
    from models import Payment
    from sqlalchemy import desc
    
    try:
        payments = db.query(Payment).filter(
            Payment.user_id == user_id
        ).order_by(desc(Payment.created_at)).offset(offset).limit(limit).all()
        
        total = db.query(Payment).filter(Payment.user_id == user_id).count()
        
        return {
            "payments": [
                {
                    "id": payment.id,
                    "transaction_id": payment.transaction_id,
                    "payment_code": payment.payment_code,  # SePay payment code
                    "amount": float(payment.amount),
                    "coins": float(payment.coins),
                    "status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
                    "payment_method": payment.payment_method,
                    "qr_code_url": payment.qr_code_url,  # QR code URL for SePay
                    "created_at": payment.created_at.isoformat() if payment.created_at else None,
                    "completed_at": payment.completed_at.isoformat() if payment.completed_at else None,
                }
                for payment in payments
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error fetching payment history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

