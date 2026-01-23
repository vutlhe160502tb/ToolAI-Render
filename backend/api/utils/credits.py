from sqlalchemy.orm import Session
from models import User, CreditReservation, ReservationStatus, CreditTransaction
from services.cost_estimation_service import CostEstimationService
import uuid
from datetime import datetime, timedelta

async def check_and_reserve_credits(
    user_id: str,
    feature_type: str,
    db: Session
) -> str:
    # Estimate cost
    cost = CostEstimationService.estimate_cost(feature_type)
    
    # Check user balance
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    # Check available balance (credits - pending reservations)
    pending_reservations = db.query(CreditReservation).filter(
        CreditReservation.user_id == user_id,
        CreditReservation.status == ReservationStatus.PENDING
    ).all()
    
    reserved_amount = sum(r.amount for r in pending_reservations)
    available_balance = user.credits - reserved_amount
    
    if available_balance < cost:
        raise ValueError(f"Insufficient credits. Required: {cost}, Available: {available_balance}")
    
    # Create reservation
    reservation_id = str(uuid.uuid4())
    # Set expires_at to 30 minutes from now
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
    
    return reservation_id

async def complete_reservation(
    reservation_id: str,
    db: Session
):
    reservation = db.query(CreditReservation).filter(
        CreditReservation.id == reservation_id
    ).first()
    
    if not reservation:
        return
    
    if reservation.status == ReservationStatus.COMPLETED:
        return
    
    # Deduct credits
    user = db.query(User).filter(User.id == reservation.user_id).first()
    if not user:
        return
    
    # Get balance before deduction
    balance_before = float(user.credits) if user.credits else 0.0
    
    # Deduct credits
    user.credits -= reservation.amount
    balance_after = float(user.credits)
    
    # Create CreditTransaction for deduction
    transaction = CreditTransaction(
        id=str(uuid.uuid4()),
        user_id=user.id,
        transaction_type="DEDUCTION",  # Database enum: DEDUCTION
        amount=-reservation.amount,  # Negative amount for deduction
        balance_before=balance_before,
        balance_after=balance_after,
        description=f"Video generation completed - Reservation {reservation_id}",
        reference_id=reservation_id
    )
    db.add(transaction)
    
    # Update reservation
    reservation.status = ReservationStatus.COMPLETED
    reservation.completed_at = datetime.utcnow()
    
    db.commit()

async def release_reservation(
    reservation_id: str,
    db: Session,
    reason: str = "Job failed or cancelled"
):
    """
    Release a credit reservation without deducting credits.
    Used when job fails or is cancelled.
    """
    reservation = db.query(CreditReservation).filter(
        CreditReservation.id == reservation_id
    ).first()
    
    if not reservation:
        return
    
    # If already completed, don't release
    if reservation.status == ReservationStatus.COMPLETED:
        return
    
    # Update reservation status to CANCELLED
    reservation.status = ReservationStatus.CANCELLED
    reservation.completed_at = datetime.utcnow()
    
    # Optionally create a transaction record for tracking
    user = db.query(User).filter(User.id == reservation.user_id).first()
    if user:
        balance = float(user.credits) if user.credits else 0.0
        transaction = CreditTransaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            transaction_type="RELEASE",  # Database enum: RELEASE
            amount=0.0,  # No amount change, just release
            balance_before=balance,
            balance_after=balance,
            description=f"Reservation released - {reason} - Reservation {reservation_id}",
            reference_id=reservation_id
        )
        db.add(transaction)
    
    db.commit()

