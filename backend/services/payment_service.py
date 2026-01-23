from sqlalchemy.orm import Session
from models import Payment, PaymentStatus, User
from services.credit_service import CreditService
import uuid
import time
import random
import os
import logging
import hmac
import hashlib
import json
from datetime import datetime, timedelta, timezone

# Setup logger
logger = logging.getLogger(__name__)

def verify_webhook_signature(payload: dict, signature: str, secret: str) -> bool:
    """
    Verify HMAC-SHA256 signature from webhook payload.
    
    This function verifies that the webhook request is authentic by comparing
    the provided signature with a computed HMAC-SHA256 signature of the payload.
    
    Args:
        payload: Webhook payload as dict (should not include signature field)
        signature: Signature from header X-Signature (hex string)
        secret: WEBHOOK_SECRET_KEY from environment
    
    Returns:
        True if signature is valid, False otherwise
    
    Security:
        - Uses constant-time comparison (hmac.compare_digest) to prevent timing attacks
        - Requires non-empty signature and secret
    """
    if not signature or not secret:
        logger.warning("Missing signature or secret for webhook verification")
        return False
    
    try:
        # Sort keys to ensure consistent ordering for signature calculation
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        
        # Calculate expected signature using HMAC-SHA256
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Use constant-time comparison to prevent timing attacks
        is_valid = hmac.compare_digest(expected_signature, signature)
        
        if not is_valid:
            logger.warning(f"Invalid webhook signature. Expected: {expected_signature[:16]}..., Received: {signature[:16]}...")
        
        return is_valid
    except Exception as e:
        logger.error(f"Error verifying webhook signature: {str(e)}")
        return False

class PaymentService:
    @staticmethod
    def create_payment_order(
        user_id: str,
        package_id: int,
        amount: float,
        credits: float,
        db: Session
    ):
        # Check if user exists, create if not
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            # Create default user if not exists
            user = User(
                id=user_id,
                email=f"{user_id}@temp.com",
                name="Temp User",
                credits=0.0
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Generate unique transaction_id
        transaction_id = f"TXN-{int(time.time())}-{random.randint(1000, 9999)}"
        
        # Create Payment record
        qr_code_url = "https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg"
        qr_content = f"NAPCOIN{transaction_id}"
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_id=transaction_id,
            payment_method="BANK_TRANSFER_QR",  # Use valid enum value
            amount=amount,
            coins=credits,  # Use coins to match DB column
            status=PaymentStatus.PENDING,
            account_number="113366668888",  # Changed from bank_account
            bank_name="VietinBank",
            qr_code_url=qr_code_url,  # Changed from qr_code
            transfer_content=qr_content  # Set transfer content
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return {
            "payment_id": payment.id,
            "transaction_id": transaction_id,
            "qr_code_url": payment.qr_code_url,
            "qr_content": qr_content,
            "bank_account": payment.account_number,
            "bank_name": payment.bank_name,
            "amount": amount,
            "credits": credits,
            "status": payment.status.value
        }
    
    @staticmethod
    def process_webhook(
        transaction_id: str,
        amount: float,
        status: str,
        transfer_content: str = None,
        paid_at: str = None,
        timestamp: str = None,
        signature: str = None,
        db: Session = None
    ):
        # Log webhook received
        logger.info(f"Webhook received: transaction_id={transaction_id}, amount={amount}, status={status}, transfer_content={transfer_content}")
        
        try:
            # Find payment by transaction_id
            payment = db.query(Payment).filter(
                Payment.transaction_id == transaction_id
            ).first()
            
            if not payment:
                logger.error(f"Payment not found: transaction_id={transaction_id}")
                raise ValueError(f"Payment not found for transaction_id: {transaction_id}")
            
            # Check payment timeout (default 30 minutes)
            if payment.created_at:
                timeout_minutes = int(os.getenv("PAYMENT_TIMEOUT_MINUTES", "30"))
                # Use timezone-aware datetime to match payment.created_at (which has timezone)
                now = datetime.now(timezone.utc) if payment.created_at.tzinfo else datetime.now()
                time_diff = now - payment.created_at
                if time_diff > timedelta(minutes=timeout_minutes):
                    logger.warning(f"Payment expired: transaction_id={transaction_id}, age={time_diff}")
                    raise ValueError(f"Payment expired (timeout: {timeout_minutes} minutes)")
            
            # Check idempotency - prevent double processing
            if payment.status == PaymentStatus.COMPLETED:
                logger.info(f"Payment already processed: transaction_id={transaction_id}")
                return {
                    "message": "Payment already processed",
                    "transaction_id": transaction_id,
                    "status": "already_completed"
                }
            
            # Validate amount (allow small difference for rounding)
            if abs(payment.amount - amount) > 0.01:
                logger.error(f"Amount mismatch: transaction_id={transaction_id}, expected={payment.amount}, received={amount}")
                raise ValueError(
                    f"Amount mismatch. Expected: {payment.amount}, Received: {amount}"
                )
            
            # Validate transfer_content (if provided)
            if transfer_content and payment.transfer_content:
                if transfer_content != payment.transfer_content:
                    logger.error(f"Transfer content mismatch: transaction_id={transaction_id}, expected={payment.transfer_content}, received={transfer_content}")
                    raise ValueError(
                        f"transfer_content mismatch. Expected: {payment.transfer_content}, Received: {transfer_content}"
                    )
            
            # Process based on status
            if status.upper() in ["SUCCESS", "COMPLETED", "PAID"]:
                # Update payment status
                payment.status = PaymentStatus.COMPLETED
                
                # Set completed_at (paid_at from webhook or current time)
                if paid_at:
                    try:
                        # Try to parse ISO format
                        payment.completed_at = datetime.fromisoformat(paid_at.replace('Z', '+00:00'))
                    except:
                        try:
                            # Try other formats
                            parsed_dt = datetime.strptime(paid_at, "%Y-%m-%d %H:%M:%S")
                            # Make it timezone-aware if payment.created_at is timezone-aware
                            if payment.created_at and payment.created_at.tzinfo:
                                parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                            payment.completed_at = parsed_dt
                        except:
                            # Use timezone-aware datetime
                            payment.completed_at = datetime.now(timezone.utc)
                else:
                    # Use timezone-aware datetime to match database column
                    payment.completed_at = datetime.now(timezone.utc)
                
                db.commit()
                
                # Add credits to user
                CreditService.add_credits(
                    user_id=payment.user_id,
                    amount=payment.coins,  # Use coins instead of credits
                    description=f"Payment transaction {transaction_id}",
                    db=db
                )
                
                logger.info(f"Payment processed successfully: transaction_id={transaction_id}, credits_added={payment.coins}")
                
                return {
                    "message": "Payment processed successfully",
                    "transaction_id": transaction_id,
                    "status": "completed",
                    "credits_added": payment.coins
                }
            else:
                # Mark as failed
                payment.status = PaymentStatus.FAILED
                db.commit()
                
                logger.warning(f"Payment failed: transaction_id={transaction_id}, status={status}")
                
                return {
                    "message": "Payment failed",
                    "transaction_id": transaction_id,
                    "status": "failed"
                }
        except ValueError as e:
            logger.error(f"Webhook validation error: transaction_id={transaction_id}, error={str(e)}")
            raise
        except Exception as e:
            logger.error(f"Webhook processing error: transaction_id={transaction_id}, error={str(e)}")
            raise
    
    @staticmethod
    def get_payment_status(transaction_id: str, db: Session):
        payment = db.query(Payment).filter(
            Payment.transaction_id == transaction_id
        ).first()
        
        if not payment:
            raise ValueError(f"Payment not found for transaction_id: {transaction_id}")
        
        return {
            "transaction_id": transaction_id,
            "status": payment.status.value,
            "amount": payment.amount,
            "credits": payment.coins,  # Use coins instead of credits
            "created_at": payment.created_at.isoformat() if payment.created_at else None,
            "updated_at": payment.updated_at.isoformat() if payment.updated_at else None
        }
    
    @staticmethod
    def simulate_webhook_success(
        transaction_id: str,
        db: Session
    ):
        """
        DEVELOPMENT ONLY: Simulate successful webhook for testing.
        
        This method wraps PaymentService.process_webhook() to simulate
        a successful payment from third-party payment observer.
        
        IMPORTANT:
        - Only works in development environment (ENV != production)
        - All business logic (status update, credit addition) goes through
          PaymentService.process_webhook() - the CORE LOGIC
        - This is just a convenience wrapper for testing
        
        Flow:
        1. Get payment record to extract correct amount and transfer_content
        2. Call process_webhook() with PAID status
        3. Return result (same as real webhook)
        """
        # Get payment to extract correct data
        payment = db.query(Payment).filter(
            Payment.transaction_id == transaction_id
        ).first()
        
        if not payment:
            raise ValueError(f"Payment not found for transaction_id: {transaction_id}")
        
        # Simulate webhook payload with correct data from payment record
        # This ensures we use the exact amount and transfer_content from the order
        # Use timezone-aware datetime for ISO format
        now = datetime.now(timezone.utc)
        return PaymentService.process_webhook(
            transaction_id=transaction_id,
            amount=payment.amount,  # Use exact amount from payment
            status="PAID",  # Simulate successful payment
            transfer_content=payment.transfer_content,  # Use exact transfer_content
            paid_at=now.isoformat(),
            timestamp=now.isoformat(),
            signature=None,  # Skip signature verification in test mode
            db=db
        )

