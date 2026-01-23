from sqlalchemy.orm import Session
from models import User, CreditTransaction
import uuid

class CreditService:
    @staticmethod
    def add_credits(
        user_id: str,
        amount: float,
        description: str,
        db: Session
    ):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        
        # Get balance before update
        balance_before = float(user.credits) if user.credits else 0.0
        
        # Update user credits
        user.credits += amount
        balance_after = float(user.credits)
        
        # Create transaction with balance tracking
        transaction = CreditTransaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            transaction_type="PAYMENT",  # Database enum: PAYMENT, RESERVATION, DEDUCTION, REFUND, RELEASE
            amount=amount,
            balance_before=balance_before,  # Required by database
            balance_after=balance_after,  # Required by database
            description=description
        )
        db.add(transaction)
        db.commit()
        
        return user.credits

