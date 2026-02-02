import uuid
from sqlalchemy.orm import Session

from models import User, CreditTransaction


class CreditService:
    @staticmethod
    def add_credits(
        db: Session,
        user_id: str,
        coins: float,
        payment_transaction_id: str | None = None,
    ) -> float:
        """
        Add credits to a user and create a CreditTransaction record.
        Returns the new user credits.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        user.credits = float(user.credits or 0.0) + float(coins or 0.0)

        tx = CreditTransaction(
            id=str(uuid.uuid4()),
            user_id=user.id,
            payment_transaction_id=payment_transaction_id,
            type="ADDITION",
            amount=float(coins or 0.0),
        )
        db.add(tx)

        db.commit()
        db.refresh(user)
        return float(user.credits or 0.0)

