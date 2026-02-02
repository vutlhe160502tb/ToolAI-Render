import json
import os
import random
import time
import uuid
from urllib.parse import quote

from sqlalchemy.orm import Session

from models import Payment, User
from services.credit_service import CreditService


class PaymentService:
    # Hardcoded packages to match the documentation (can be moved to DB/config later)
    PACKAGES = [
        {"coins": 20.0, "amount_vnd": 52000.0},
        {"coins": 60.0, "amount_vnd": 130000.0},
        {"coins": 130.0, "amount_vnd": 260000.0},
        {"coins": 270.0, "amount_vnd": 520000.0},
        {"coins": 700.0, "amount_vnd": 1300000.0},
        {"coins": 1500.0, "amount_vnd": 2600000.0},
    ]

    BANK_NAME = os.getenv("PAYMENT_BANK_NAME", "VietinBank")
    BANK_ID = os.getenv("PAYMENT_BANK_ID", "970415")  # VietinBank (VietQR bank code)
    ACCOUNT_NUMBER = os.getenv("PAYMENT_ACCOUNT_NUMBER", "113366668888")
    ACCOUNT_NAME = os.getenv("PAYMENT_ACCOUNT_NAME", "RENDERTOOL")

    WEBHOOK_SECRET = os.getenv("PAYMENT_WEBHOOK_SECRET", "")

    @staticmethod
    def _generate_transaction_id() -> str:
        return f"TXN-{int(time.time())}-{random.randint(100000, 999999)}"

    @staticmethod
    def _transfer_content(transaction_id: str) -> str:
        return f"NAPCOIN{transaction_id}"

    @staticmethod
    def _build_vietqr_url(amount_vnd: float, transfer_content: str) -> str:
        # Using VietQR image generator. Example:
        # https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NUMBER}-compact2.png?amount=...&addInfo=...&accountName=...
        amount = int(round(float(amount_vnd)))
        add_info = quote(transfer_content)
        account_name = quote(PaymentService.ACCOUNT_NAME)
        return (
            f"https://img.vietqr.io/image/{PaymentService.BANK_ID}-{PaymentService.ACCOUNT_NUMBER}-compact2.png"
            f"?amount={amount}&addInfo={add_info}&accountName={account_name}"
        )

    @staticmethod
    def _validate_package(coins: float, amount_vnd: float) -> bool:
        c = float(coins)
        a = float(amount_vnd)
        for p in PaymentService.PACKAGES:
            if abs(p["coins"] - c) < 1e-9 and abs(p["amount_vnd"] - a) < 0.01:
                return True
        return False

    @staticmethod
    def create_payment_order(
        db: Session,
        user_id: str | None,
        coins: float,
        amount_vnd: float,
    ) -> dict:
        """
        Create a payment order (PENDING) and return QR/bank info.
        If user_id is missing or invalid, create a temp user (matches doc behaviour).
        """
        if not PaymentService._validate_package(coins, amount_vnd):
            raise ValueError("Invalid package")

        user = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()

        if not user:
            # Create a temp user if not found
            temp_id = str(uuid.uuid4())
            user = User(
                id=temp_id,
                email=f"temp_{temp_id}@temp.local",
                name="Temp User",
                picture=None,
                credits=0.0,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        transaction_id = PaymentService._generate_transaction_id()
        transfer_content = PaymentService._transfer_content(transaction_id)
        qr_code_url = PaymentService._build_vietqr_url(amount_vnd, transfer_content)

        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=user.id,
            transaction_id=transaction_id,
            status="PENDING",
            payment_method="BANK_TRANSFER_QR",
            coins=float(coins),
            amount_vnd=float(amount_vnd),
            bank_name=PaymentService.BANK_NAME,
            account_number=PaymentService.ACCOUNT_NUMBER,
            transfer_content=transfer_content,
            qr_code_url=qr_code_url,
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)

        return {
            "transaction_id": payment.transaction_id,
            "status": payment.status,
            "payment_method": payment.payment_method,
            "coins": payment.coins,
            "amount_vnd": payment.amount_vnd,
            "qr_code_url": payment.qr_code_url,
            "bank_name": payment.bank_name,
            "account_number": payment.account_number,
            "transfer_content": payment.transfer_content,
        }

    @staticmethod
    def get_payment_status(db: Session, transaction_id: str) -> dict:
        payment = db.query(Payment).filter(Payment.transaction_id == transaction_id).first()
        if not payment:
            raise ValueError("Payment not found")

        user_credits = None
        if payment.user_id:
            user = db.query(User).filter(User.id == payment.user_id).first()
            if user:
                user_credits = float(user.credits or 0.0)

        return {
            "transaction_id": payment.transaction_id,
            "status": payment.status,
            "coins": payment.coins,
            "amount_vnd": payment.amount_vnd,
            "user_id": payment.user_id,
            "user_credits": user_credits,
        }

    @staticmethod
    def _is_success_status(status: str) -> bool:
        s = (status or "").strip().lower()
        return s in {"success", "completed", "paid"}

    @staticmethod
    def process_webhook(db: Session, payload: dict, signature: str | None = None) -> dict:
        """
        Expected minimal payload:
          { "transaction_id": "...", "status": "...", "amount": 12345 }
        Additional fields are ignored.
        """
        if PaymentService.WEBHOOK_SECRET:
            if not signature or signature != PaymentService.WEBHOOK_SECRET:
                raise ValueError("Invalid webhook signature")

        txid = payload.get("transaction_id") or payload.get("transactionId") or payload.get("txn_id")
        if not txid:
            raise ValueError("Missing transaction_id")

        payment = db.query(Payment).filter(Payment.transaction_id == txid).first()
        if not payment:
            raise ValueError("Payment not found")

        # Idempotency: already completed
        if (payment.status or "").upper() == "COMPLETED":
            return {"ok": True, "status": "COMPLETED", "transaction_id": payment.transaction_id}

        incoming_status = str(payload.get("status") or "")
        incoming_amount = payload.get("amount") or payload.get("amount_vnd") or payload.get("amountVnd")
        if incoming_amount is not None:
            try:
                incoming_amount = float(incoming_amount)
            except Exception:
                incoming_amount = None

        # Save raw payload for debugging
        try:
            payment.raw_webhook = json.dumps(payload, ensure_ascii=False)
        except Exception:
            payment.raw_webhook = str(payload)

        # Amount validation (±0.01)
        if incoming_amount is not None and abs(float(payment.amount_vnd or 0.0) - float(incoming_amount)) > 0.01:
            payment.status = "FAILED"
            db.commit()
            return {"ok": False, "status": "FAILED", "reason": "Amount mismatch"}

        if PaymentService._is_success_status(incoming_status):
            payment.status = "COMPLETED"
            db.commit()

            # Add credits
            new_credits = CreditService.add_credits(
                db=db,
                user_id=payment.user_id,
                coins=float(payment.coins or 0.0),
                payment_transaction_id=payment.transaction_id,
            )
            return {
                "ok": True,
                "status": "COMPLETED",
                "transaction_id": payment.transaction_id,
                "user_id": payment.user_id,
                "user_credits": new_credits,
            }

        # Otherwise mark failed
        payment.status = "FAILED"
        db.commit()
        return {"ok": True, "status": "FAILED", "transaction_id": payment.transaction_id}

