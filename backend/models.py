from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class TransactionType(str, enum.Enum):
    ADDITION = "addition"
    DEDUCTION = "deduction"

class ReservationStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    picture = Column(String, nullable=True)  # Changed from avatar_url to match DB
    google_id = Column(String, nullable=True)  # Added to match DB
    credits = Column(Float, default=0.0)
    is_admin = Column(Boolean, default=False)  # Admin flag
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    payments = relationship("Payment", back_populates="user")
    credit_transactions = relationship("CreditTransaction", back_populates="user")
    credit_reservations = relationship("CreditReservation", back_populates="user")
    video_jobs = relationship("VideoJob", back_populates="user")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    transaction_id = Column(String, unique=True, index=True)
    payment_method = Column(String, nullable=True)
    amount = Column(Float)
    coins = Column(Float)  # Changed from credits to match DB
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    qr_code_url = Column(Text, nullable=True)  # SePay QR URL
    transfer_content = Column(String, nullable=True)
    payment_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    payment_code = Column(String, nullable=True)  # SePay payment code
    # SePay specific fields
    expired_at = Column(DateTime(timezone=True), nullable=True)  # QR code expiration time (30 minutes)
    product_code = Column(String, nullable=True)  # SePay product code (e.g., PKG_1)
    customer_code = Column(String, nullable=True)  # SePay customer code (user_id)

    user = relationship("User", back_populates="payments")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    transaction_type = Column(String)  # Database enum: PAYMENT, RESERVATION, DEDUCTION, REFUND, RELEASE
    amount = Column(Float)
    balance_before = Column(Float)  # Required by database
    balance_after = Column(Float)  # Required by database
    status = Column(String, nullable=True)  # Optional
    reference_id = Column(String, nullable=True)  # Optional
    description = Column(String, nullable=True)
    transaction_metadata = Column(String, nullable=True)  # Optional
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    user = relationship("User", back_populates="credit_transactions")

class CreditReservation(Base):
    __tablename__ = "credit_reservations"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    job_id = Column(String, nullable=True)
    amount = Column(Float)
    status = Column(SQLEnum(ReservationStatus), default=ReservationStatus.PENDING)
    expires_at = Column(DateTime(timezone=True))  # NOT NULL - thời gian hết hạn reservation
    reference_id = Column(String, nullable=True)
    reservation_metadata = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="credit_reservations")

class VideoJob(Base):
    __tablename__ = "video_jobs"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    feature_type = Column(String)  # dance-image-bg, dance-video-bg, etc.
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING)
    progress = Column(Integer, default=0)
    result_url = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    reservation_id = Column(String, ForeignKey("credit_reservations.id"), nullable=True)
    input_file_url = Column(String, nullable=True)  # Zipline URL của file gốc user upload
    prompt = Column(Text, nullable=True)  # Prompt text (cho create-image)
    admin_status = Column(String, nullable=True)  # "pending", "processing", "completed"
    admin_notes = Column(Text, nullable=True)  # Admin ghi chú
    completed_at = Column(DateTime(timezone=True), nullable=True)  # Khi admin xong
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="video_jobs")
    reservation = relationship("CreditReservation", foreign_keys=[reservation_id])

