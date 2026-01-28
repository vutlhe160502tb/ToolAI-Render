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
import requests
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

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
        
        # Get SePay API URL from environment
        sepay_api_url = os.getenv("SEPAY_API_URL", "https://qr-moniter.up.railway.app")
        client_webhook_url = os.getenv("CLIENT_WEBHOOK_URL", "http://localhost:8000/api/payments/webhook")
        
        # Validate SePay API URL
        if not sepay_api_url or sepay_api_url.strip() == "":
            raise Exception("SEPAY_API_URL không được cấu hình trong environment variables")
        
        # Validate CLIENT_WEBHOOK_URL format
        if not client_webhook_url or client_webhook_url.strip() == "":
            raise Exception("CLIENT_WEBHOOK_URL không được cấu hình trong environment variables")
        
        # Validate URL format
        try:
            parsed_url = urlparse(client_webhook_url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("Invalid URL format")
            
            # Check if URL is localhost (not accessible from internet)
            env = os.getenv("ENV", "development").lower()
            is_localhost = parsed_url.hostname in ["localhost", "127.0.0.1"] or \
                          (parsed_url.hostname and (parsed_url.hostname.startswith("192.168.") or parsed_url.hostname.startswith("10.")))
            
            if is_localhost:
                if env == "production":
                    raise Exception(
                        f"CLIENT_WEBHOOK_URL không thể là localhost trong production. "
                        f"Hiện tại: {client_webhook_url}. "
                        f"Vui lòng sử dụng public URL (ví dụ: https://yourdomain.com/api/payments/webhook) hoặc ngrok tunnel."
                    )
                else:
                    # Development mode: warn but don't fail (SePay API will reject it though)
                    logger.warning(
                        f"CLIENT_WEBHOOK_URL đang sử dụng localhost: {client_webhook_url}. "
                        f"SePay API không thể gọi localhost từ internet. "
                        f"Vui lòng sử dụng ngrok hoặc public URL. "
                        f"Ví dụ: ngrok http 8000 -> https://abc123.ngrok.io/api/payments/webhook"
                    )
        except ValueError as e:
            raise Exception(f"CLIENT_WEBHOOK_URL không hợp lệ: {client_webhook_url}. Lỗi: {str(e)}")
        
        # Log webhook URL for debugging
        logger.info(f"Using SePay API: {sepay_api_url}, Webhook URL: {client_webhook_url}")
        
        # Prepare SePay API request
        product_code = f"PKG_{package_id}"
        customer_code = user_id
        
        # Call SePay API to create payment order (REQUIRED - no fallback)
        try:
            logger.info(f"Calling SePay API: {sepay_api_url}/payments with productCode={product_code}, amount={int(amount)}")
            
            sepay_response = requests.post(
                f"{sepay_api_url}/payments",
                json={
                    "productCode": product_code,
                    "customerCode": customer_code,
                    "amount": int(amount),  # SePay expects integer VNĐ
                    "clientWebhookUrl": client_webhook_url
                },
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            logger.info(f"SePay API response status: {sepay_response.status_code}")
            
            # Accept 2xx status codes (200, 201, etc.)
            if not (200 <= sepay_response.status_code < 300):
                error_text = sepay_response.text
                logger.error(f"SePay API failed: status={sepay_response.status_code}, response={error_text}")
                
                # Parse error message for better user feedback
                try:
                    error_data = sepay_response.json()
                    error_message = error_data.get("message", error_text)
                    if isinstance(error_message, list):
                        error_message = ", ".join(error_message)
                    
                    # Check if it's a webhook URL validation error
                    if "clientWebhookUrl" in error_text.lower() or "webhook" in error_text.lower():
                        raise Exception(
                            f"Lỗi cấu hình webhook URL: {error_message}. "
                            f"CLIENT_WEBHOOK_URL hiện tại: {client_webhook_url}. "
                            f"Vui lòng kiểm tra:\n"
                            f"1. URL phải là public accessible (không phải localhost)\n"
                            f"2. Sử dụng ngrok hoặc tunnel để expose localhost trong development\n"
                            f"3. URL phải có format hợp lệ (bắt đầu bằng http:// hoặc https://)"
                        )
                    else:
                        raise Exception(f"SePay API lỗi: {error_message}")
                except json.JSONDecodeError:
                    # If response is not JSON, use raw text
                    raise Exception(f"SePay API returned status {sepay_response.status_code}: {error_text}")
            
            # Parse response (could be 200, 201, etc.)
            try:
                sepay_data = sepay_response.json()
            except json.JSONDecodeError as e:
                logger.error(f"SePay API response is not valid JSON: {sepay_response.text}")
                raise Exception(f"SePay API response không phải JSON hợp lệ: {str(e)}")
            
            payment_code = sepay_data.get("paymentCode")
            qr_url = sepay_data.get("qrUrl")
            
            if not payment_code or not qr_url:
                logger.error(f"SePay API response missing required fields: {sepay_data}")
                raise Exception(f"SePay API response invalid: missing paymentCode or qrUrl")
            
            logger.info(f"SePay order created successfully: payment_code={payment_code}, qr_url={qr_url}")
            
            # Calculate expired_at (30 minutes from now)
            from datetime import timedelta
            expired_at = datetime.now(timezone.utc) + timedelta(minutes=30)
            
            # Create Payment record with SePay data
            payment = Payment(
                id=str(uuid.uuid4()),
                user_id=user_id,
                transaction_id=transaction_id,
                payment_code=payment_code,  # SePay payment code
                payment_method="SEPAY_QR",
                amount=amount,
                coins=credits,
                status=PaymentStatus.PENDING,
                qr_code_url=qr_url,  # SePay QR URL
                transfer_content=f"PKG_{package_id}",  # Product code as transfer content
                product_code=product_code,  # SePay product code
                customer_code=customer_code,  # SePay customer code
                expired_at=expired_at,  # QR code expiration (30 minutes)
                payment_metadata=json.dumps({
                    "sepay_payment_code": payment_code,
                    "product_code": product_code,
                    "customer_code": customer_code
                })
            )
        except requests.exceptions.RequestException as e:
            # Network/connection errors
            logger.error(f"SePay API connection error: {str(e)}")
            raise Exception(f"Không thể kết nối đến SePay API: {str(e)}")
        except Exception as e:
            # Other errors (invalid response, missing fields, etc.)
            logger.error(f"SePay API error: {str(e)}")
            raise Exception(f"Lỗi khi tạo payment order từ SePay: {str(e)}")
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        # Return response (compatible with both SePay and fallback)
        response = {
            "payment_id": payment.id,
            "transaction_id": transaction_id,
            "qr_code_url": payment.qr_code_url,
            "qr_content": payment.transfer_content or f"NAPCOIN{transaction_id}",
            "amount": amount,
            "credits": credits,
            "status": payment.status.value
        }
        
        # Add SePay specific fields if available
        if payment.payment_code:
            response["payment_code"] = payment.payment_code
            response["qrUrl"] = payment.qr_code_url  # SePay format
        if payment.expired_at:
            response["expired_at"] = payment.expired_at.isoformat()
        
        return response
    
    @staticmethod
    def process_webhook(
        transaction_id: str = None,
        payment_code: str = None,
        amount: float = None,
        status: str = None,
        transfer_content: str = None,
        paid_at: str = None,
        timestamp: str = None,
        signature: str = None,
        product_code: str = None,
        customer_code: str = None,
        db: Session = None
    ):
        # Log webhook received
        logger.info(f"Webhook received: transaction_id={transaction_id}, payment_code={payment_code}, amount={amount}, status={status}")
        
        try:
            # Find payment by payment_code (SePay) or transaction_id (fallback)
            payment = None
            if payment_code:
                payment = db.query(Payment).filter(
                    Payment.payment_code == payment_code
                ).first()
                if not payment:
                    logger.warning(f"Payment not found by payment_code: {payment_code}, trying transaction_id")
            
            # Fallback to transaction_id if payment_code not found
            if not payment and transaction_id:
                payment = db.query(Payment).filter(
                    Payment.transaction_id == transaction_id
                ).first()
            
            if not payment:
                error_msg = f"Payment not found: payment_code={payment_code}, transaction_id={transaction_id}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Check payment expiration using expired_at (SePay) or created_at + timeout (fallback)
            now = datetime.now(timezone.utc)
            if payment.expired_at:
                # Use expired_at from SePay
                if now > payment.expired_at:
                    logger.warning(f"Payment expired: payment_code={payment_code or transaction_id}, expired_at={payment.expired_at}")
                    raise ValueError(f"Payment expired at {payment.expired_at}")
            elif payment.created_at:
                # Fallback: check timeout from created_at
                timeout_minutes = int(os.getenv("PAYMENT_TIMEOUT_MINUTES", "30"))
                time_diff = now - payment.created_at
                if time_diff > timedelta(minutes=timeout_minutes):
                    logger.warning(f"Payment expired: transaction_id={transaction_id}, age={time_diff}")
                    raise ValueError(f"Payment expired (timeout: {timeout_minutes} minutes)")
            
            # Update product_code and customer_code if provided in webhook
            if product_code and not payment.product_code:
                payment.product_code = product_code
            if customer_code and not payment.customer_code:
                payment.customer_code = customer_code
            
            # Check idempotency - prevent double processing
            if payment.status == PaymentStatus.COMPLETED:
                logger.info(f"Payment already processed: transaction_id={transaction_id}")
                return {
                    "message": "Payment already processed",
                    "transaction_id": transaction_id,
                    "status": "already_completed"
                }
            
            # Validate amount (allow small difference for rounding)
            if amount is not None and abs(payment.amount - amount) > 0.01:
                logger.error(f"Amount mismatch: payment_code={payment_code or transaction_id}, expected={payment.amount}, received={amount}")
                raise ValueError(
                    f"Amount mismatch. Expected: {payment.amount}, Received: {amount}"
                )
            
            # Validate transfer_content/product_code (if provided)
            if transfer_content and payment.transfer_content:
                if transfer_content != payment.transfer_content:
                    logger.warning(f"Transfer content mismatch: payment_code={payment_code or transaction_id}, expected={payment.transfer_content}, received={transfer_content}")
                    # Don't fail, just log warning for SePay compatibility
            
            # SePay uses "paid" status, old system uses "SUCCESS", "COMPLETED", "PAID"
            is_paid = status and status.upper() in ["SUCCESS", "COMPLETED", "PAID"]
            
            # Process based on status
            if is_paid:
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
                
                logger.info(f"Payment processed successfully: payment_code={payment_code or transaction_id}, credits_added={payment.coins}")
                
                return {
                    "message": "Payment processed successfully",
                    "transaction_id": transaction_id,
                    "payment_code": payment_code,
                    "status": "completed",
                    "credits_added": payment.coins
                }
            elif status and status.upper() in ["EXPIRED", "CANCELLED"]:
                # Handle SePay expired/cancelled status
                if status.upper() == "EXPIRED":
                    payment.status = PaymentStatus.FAILED
                elif status.upper() == "CANCELLED":
                    payment.status = PaymentStatus.CANCELLED
                db.commit()
                
                logger.warning(f"Payment {status.lower()}: payment_code={payment_code or transaction_id}")
                
                return {
                    "message": f"Payment {status.lower()}",
                    "transaction_id": transaction_id,
                    "payment_code": payment_code,
                    "status": status.lower()
                }
            else:
                # Mark as failed for other statuses
                payment.status = PaymentStatus.FAILED
                db.commit()
                
                logger.warning(f"Payment failed: payment_code={payment_code or transaction_id}, status={status}")
                
                return {
                    "message": "Payment failed",
                    "transaction_id": transaction_id,
                    "payment_code": payment_code,
                    "status": "failed"
                }
        except ValueError as e:
            logger.error(f"Webhook validation error: payment_code={payment_code or transaction_id}, error={str(e)}")
            raise
        except Exception as e:
            logger.error(f"Webhook processing error: payment_code={payment_code or transaction_id}, error={str(e)}")
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
    
