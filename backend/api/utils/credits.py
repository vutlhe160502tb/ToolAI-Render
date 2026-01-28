from sqlalchemy.orm import Session
from models import User, CreditReservation, ReservationStatus, CreditTransaction
from services.cost_estimation_service import CostEstimationService
import uuid
from datetime import datetime, timedelta

async def check_and_reserve_credits(
    user_id: str,
    feature_type: str,
    db: Session,
    quality: str = "720P"
) -> str:
    # Estimate cost based on feature type and quality
    cost = CostEstimationService.estimate_cost(feature_type, quality)
    
    # Check user balance
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    # Check if user has enough credits
    if user.credits < cost:
        raise ValueError(f"Insufficient credits. Required: {cost}, Available: {user.credits}")
    
    # Deduct credits immediately
    balance_before = float(user.credits) if user.credits else 0.0
    user.credits -= cost
    balance_after = float(user.credits)
    
    # Create CreditTransaction for deduction
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        transaction_type="DEDUCTION",
        amount=-cost,  # Negative amount for deduction
        balance_before=balance_before,
        balance_after=balance_after,
        description=f"Video generation - {feature_type} ({quality})",
        reference_id=None
    )
    db.add(transaction)
    
    # Create reservation for tracking (but amount is already deducted)
    reservation_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    
    reservation = CreditReservation(
        id=reservation_id,
        user_id=user_id,
        amount=cost,
        status=ReservationStatus.PENDING,
        expires_at=expires_at
    )
    db.add(reservation)
    db.commit()
    
    # Log for debugging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Credits deducted - User: {user_id}, Feature: {feature_type}, Quality: {quality}, Cost: {cost}, Balance Before: {balance_before}, Balance After: {balance_after}")
    
    return reservation_id

async def complete_reservation(
    reservation_id: str,
    db: Session
):
    """
    Mark reservation as completed. Credits were already deducted when job was created.
    """
    reservation = db.query(CreditReservation).filter(
        CreditReservation.id == reservation_id
    ).first()
    
    if not reservation:
        return
    
    if reservation.status == ReservationStatus.COMPLETED:
        return
    
    # Update reservation status to completed (credits already deducted)
    reservation.status = ReservationStatus.COMPLETED
    reservation.completed_at = datetime.utcnow()
    
    db.commit()

async def release_reservation(
    reservation_id: str,
    db: Session,
    reason: str = "Job failed or cancelled"
):
    """
    Refund credits when job fails or is cancelled.
    Credits were deducted when job was created, so we need to refund them.
    """
    reservation = db.query(CreditReservation).filter(
        CreditReservation.id == reservation_id
    ).first()
    
    if not reservation:
        return
    
    # If already completed, don't refund
    if reservation.status == ReservationStatus.COMPLETED:
        return
    
    # Refund credits to user
    user = db.query(User).filter(User.id == reservation.user_id).first()
    if not user:
        return
    
    balance_before = float(user.credits) if user.credits else 0.0
    user.credits += reservation.amount  # Refund the amount
    balance_after = float(user.credits)
    
    # Create CreditTransaction for refund
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        transaction_type="REFUND",
        amount=reservation.amount,  # Positive amount for refund
        balance_before=balance_before,
        balance_after=balance_after,
        description=f"Job failed/cancelled - {reason} - Reservation {reservation_id}",
        reference_id=reservation_id
    )
    db.add(transaction)
    
    # Update reservation status to CANCELLED
    reservation.status = ReservationStatus.CANCELLED
    reservation.completed_at = datetime.utcnow()
    
    db.commit()

