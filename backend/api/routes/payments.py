from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from database import get_db
from services.payment_service import PaymentService, verify_webhook_signature
from pydantic import BaseModel
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Request models
class CreateOrderRequest(BaseModel):
    package_id: int
    amount: float
    coins: float
    user_id: str

class WebhookRequest(BaseModel):
    transaction_id: str
    amount: float
    status: str
    transfer_content: Optional[str] = None
    paid_at: Optional[str] = None
    timestamp: Optional[str] = None
    signature: Optional[str] = None

class TestWebhookRequest(BaseModel):
    transaction_id: str

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
        logger.error(f"Error creating payment order: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

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
    
    # Verify signature if provided (skip for test/development if signature is None)
    if signature:
        # Convert request to dict for signature verification (exclude signature field)
        payload_dict = {
            "transaction_id": webhook_request.transaction_id,
            "amount": webhook_request.amount,
            "status": webhook_request.status,
            "transfer_content": webhook_request.transfer_content,
            "paid_at": webhook_request.paid_at,
            "timestamp": webhook_request.timestamp
        }
        # Remove None values for cleaner signature calculation
        payload_dict = {k: v for k, v in payload_dict.items() if v is not None}
        
        if not verify_webhook_signature(payload_dict, signature, webhook_secret):
            logger.error(f"Invalid webhook signature for transaction_id={webhook_request.transaction_id}")
            raise HTTPException(
                status_code=401,
                detail="Invalid webhook signature"
            )
        logger.info(f"Webhook signature verified for transaction_id={webhook_request.transaction_id}")
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
        result = PaymentService.process_webhook(
            transaction_id=webhook_request.transaction_id,
            amount=webhook_request.amount,
            status=webhook_request.status,
            transfer_content=webhook_request.transfer_content,
            paid_at=webhook_request.paid_at,
            timestamp=webhook_request.timestamp,
            signature=signature,  # Pass signature for logging
            db=db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{transaction_id}/status")
async def get_payment_status(
    transaction_id: str,
    db: Session = Depends(get_db)
):
    """
    Get payment status for polling.
    Frontend will call this endpoint every few seconds to check payment status.
    """
    try:
        result = PaymentService.get_payment_status(
            transaction_id=transaction_id,
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
                    "amount": float(payment.amount),
                    "coins": float(payment.coins),
                    "status": payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
                    "payment_method": payment.payment_method,
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

@router.post("/test-webhook")
async def test_webhook(
    request: TestWebhookRequest,
    db: Session = Depends(get_db)
):
    """
    DEVELOPMENT ONLY: Test endpoint to simulate webhook from third-party payment observer.
    
    This endpoint simulates a successful payment webhook for testing purposes.
    It calls PaymentService.simulate_webhook_success() which internally uses
    PaymentService.process_webhook() - the CORE LOGIC for all payment processing.
    
    Security:
    - Only available in development environment (ENV != production)
    - All business logic (status update, credit addition) goes through
      PaymentService.process_webhook() - no bypassing
    
    Usage:
    - Frontend test button: POST with body {"transaction_id": "TXN-..."}
    - Scripts/CI: POST with body {"transaction_id": "TXN-..."}
    - Real production webhooks go to /webhook endpoint
    
    Flow:
    1. Check environment (must be development)
    2. Get transaction_id from request body
    3. Call PaymentService.simulate_webhook_success()
    4. Return result (same format as real webhook)
    
    IMPORTANT:
    - All credit addition logic goes through PaymentService.process_webhook()
    - This is just a convenience wrapper for testing
    - No business logic is bypassed
    """
    # Security check: Only allow in development
    env = os.getenv("ENV", "development").lower()
    if env == "production":
        raise HTTPException(
            status_code=403,
            detail="Test webhook endpoint is disabled in production environment"
        )
    
    try:
        # All logic goes through PaymentService.simulate_webhook_success()
        # which internally calls PaymentService.process_webhook() - CORE LOGIC
        result = PaymentService.simulate_webhook_success(
            transaction_id=request.transaction_id,
            db=db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

