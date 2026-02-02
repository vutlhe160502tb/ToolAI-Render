from sqlalchemy import Column, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    picture = Column(String, nullable=True)  # avatar_url saved here
    google_id = Column(String, nullable=True)
    credits = Column(Float, default=0.0)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Payment(Base):
    __tablename__ = "payments"

    # Internal id
    id = Column(String, primary_key=True)

    # Owner
    user_id = Column(String, index=True, nullable=True)

    # External/public identifier used by frontend + webhook
    transaction_id = Column(String, unique=True, index=True, nullable=False)

    # PENDING | COMPLETED | FAILED
    status = Column(String, index=True, default="PENDING")

    # BANK_TRANSFER_QR
    payment_method = Column(String, default="BANK_TRANSFER_QR")

    # Credits/coins to add when payment completed
    coins = Column(Float, default=0.0)
    amount_vnd = Column(Float, default=0.0)

    # Bank transfer info
    bank_name = Column(String, default="VietinBank")
    account_number = Column(String, default="113366668888")
    transfer_content = Column(String, nullable=False)
    qr_code_url = Column(String, nullable=True)

    # Webhook debugging / idempotency inspection
    raw_webhook = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(String, primary_key=True)
    user_id = Column(String, index=True, nullable=False)

    # Link to a payment transaction_id (optional)
    payment_transaction_id = Column(String, index=True, nullable=True)

    # ADDITION | DEDUCTION
    type = Column(String, index=True, nullable=False)

    amount = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

