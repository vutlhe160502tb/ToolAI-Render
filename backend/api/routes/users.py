from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User
from pydantic import BaseModel

router = APIRouter()

@router.get("/{user_id}/credits")
async def get_user_credits(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get user credits balance.
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user.id,
            "credits": float(user.credits) if user.credits else 0.0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/by-email/{email}")
async def get_user_by_email(
    email: str,
    db: Session = Depends(get_db)
):
    """
    Get user by email (for fallback when user_id not in session).
    """
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user.id,
            "email": user.email,
            "name": user.name,
            "credits": float(user.credits) if user.credits else 0.0
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/transactions")
async def get_credit_transactions(
    user_id: str,
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db)
):
    """
    Get credit transaction history for a user.
    Returns list of credit transactions ordered by created_at DESC.
    """
    from models import CreditTransaction
    from sqlalchemy import desc
    
    try:
        transactions = db.query(CreditTransaction).filter(
            CreditTransaction.user_id == user_id
        ).order_by(desc(CreditTransaction.created_at)).offset(offset).limit(limit).all()
        
        total = db.query(CreditTransaction).filter(CreditTransaction.user_id == user_id).count()
        
        return {
            "transactions": [
                {
                    "id": transaction.id,
                    "transaction_type": transaction.transaction_type,
                    "amount": float(transaction.amount),
                    "balance_before": float(transaction.balance_before) if transaction.balance_before else 0.0,
                    "balance_after": float(transaction.balance_after) if transaction.balance_after else 0.0,
                    "description": transaction.description,
                    "reference_id": transaction.reference_id,
                    "created_at": transaction.created_at.isoformat() if transaction.created_at else None,
                }
                for transaction in transactions
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

