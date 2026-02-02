from __future__ import annotations

import secrets
import string
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import Payment, PaymentStatus, ReferralConversion, ReferralReward, User
from services.credit_service import CreditService


class ReferralService:
    """
    Referral logic:
    - Each user has a referral_code to share.
    - A referred user is counted ONLY when they have a successful payment AND coins were credited.
    - Milestone rewards for referrer:
        5 paid friends  -> +10 coin
        10 paid friends -> +20 coin
        50 paid friends -> +70 coin
    """

    # reward_coins is TOTAL reward at that milestone (not cumulative sum).
    # Example: if user already received 10 coin at 5 referrals, then at 10 referrals
    # they will receive an additional +10 coin to reach total 20 coin.
    MILESTONES: list[tuple[int, float]] = [(5, 10.0), (10, 20.0), (50, 70.0)]
    REFERRAL_CODE_LENGTH = 8
    REFERRAL_CODE_ALPHABET = string.ascii_uppercase + string.digits

    @staticmethod
    def _generate_code() -> str:
        return "".join(
            secrets.choice(ReferralService.REFERRAL_CODE_ALPHABET)
            for _ in range(ReferralService.REFERRAL_CODE_LENGTH)
        )

    @staticmethod
    def ensure_referral_code(user: User, db: Session) -> str:
        """
        Ensure user has referral_code. Generate if missing.
        """
        if user.referral_code:
            return user.referral_code

        # Try a few times to avoid rare collisions
        for _ in range(20):
            code = ReferralService._generate_code()
            exists = db.query(User).filter(User.referral_code == code).first()
            if not exists:
                user.referral_code = code
                db.commit()
                db.refresh(user)
                return user.referral_code

        # Fallback: use uuid4-derived code (still short-ish)
        code = uuid.uuid4().hex[: ReferralService.REFERRAL_CODE_LENGTH].upper()
        user.referral_code = code
        db.commit()
        db.refresh(user)
        return user.referral_code

    @staticmethod
    def attach_referrer(user_id: str, referral_code: str, db: Session) -> dict:
        """
        Attach referrer to user (one-time).
        Safety:
        - Only if user has no referrer yet
        - Only if user has no completed payments yet
        - Cannot refer self
        """
        referral_code = (referral_code or "").strip().upper()
        if not referral_code:
            raise ValueError("referral_code is required")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # If already attached, return idempotently
        if user.referrer_id:
            return {
                "attached": False,
                "reason": "already_attached",
                "referrer_id": user.referrer_id,
            }

        referrer = db.query(User).filter(User.referral_code == referral_code).first()
        if not referrer:
            raise ValueError("Invalid referral code")

        if referrer.id == user.id:
            raise ValueError("Cannot use your own referral code")

        completed_payments = (
            db.query(Payment)
            .filter(Payment.user_id == user.id)
            .filter(Payment.status == PaymentStatus.COMPLETED)
            .count()
        )
        if completed_payments > 0:
            return {
                "attached": False,
                "reason": "user_already_paid",
            }

        user.referrer_id = referrer.id
        db.commit()
        db.refresh(user)

        return {
            "attached": True,
            "referrer_id": referrer.id,
            "referral_code": referral_code,
        }

    @staticmethod
    def on_referred_user_paid(user_id: str, payment_id: str, db: Session) -> None:
        """
        Called after coins have been credited for a successful payment.
        Creates a one-time conversion record and grants milestone rewards.
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.referrer_id:
            return

        # Only count each referred user once
        existing = (
            db.query(ReferralConversion)
            .filter(ReferralConversion.referred_user_id == user.id)
            .first()
        )
        if existing:
            return

        # Ensure payment is completed (best-effort validation)
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if payment and payment.status != PaymentStatus.COMPLETED:
            return

        qualified_at = payment.completed_at if payment else None
        if not qualified_at:
            qualified_at = datetime.now(timezone.utc)

        conversion = ReferralConversion(
            id=str(uuid.uuid4()),
            referrer_user_id=user.referrer_id,
            referred_user_id=user.id,
            first_payment_id=payment_id,
            qualified_at=qualified_at,
        )
        db.add(conversion)
        db.flush()

        # Count conversions for this referrer (in current transaction)
        count = (
            db.query(ReferralConversion)
            .filter(ReferralConversion.referrer_user_id == user.referrer_id)
            .count()
        )

        # Grant missing milestone rewards
        existing_rewards = (
            db.query(ReferralReward)
            .filter(ReferralReward.referrer_user_id == user.referrer_id)
            .all()
        )
        # We treat reward_coins as TOTAL at milestone; only top-up the delta.
        max_granted_total = max([r.amount for r in existing_rewards], default=0.0)

        for milestone, reward_coins in ReferralService.MILESTONES:
            if count < milestone:
                continue

            already = (
                db.query(ReferralReward)
                .filter(ReferralReward.referrer_user_id == user.referrer_id)
                .filter(ReferralReward.milestone == milestone)
                .first()
            )
            if already:
                continue

            reward = ReferralReward(
                id=str(uuid.uuid4()),
                referrer_user_id=user.referrer_id,
                milestone=milestone,
                amount=reward_coins,
                awarded_at=datetime.now(timezone.utc),
            )
            db.add(reward)
            db.flush()

            delta = float(reward_coins) - float(max_granted_total)
            if delta > 0:
                # IMPORTANT: keep transaction_type within existing DB enum (PAYMENT)
                CreditService.add_credits(
                    user_id=user.referrer_id,
                    amount=delta,
                    description=f"[REFERRAL] Milestone {milestone} paid friends (+{int(delta)} coin)",
                    transaction_type="PAYMENT",
                    reference_id=reward.id,
                    db=db,
                    commit=False,
                )
                max_granted_total = float(reward_coins)

        db.commit()

    @staticmethod
    def get_referral_summary(user_id: str, db: Session) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        code = ReferralService.ensure_referral_code(user, db)

        referred_paid_count = (
            db.query(ReferralConversion)
            .filter(ReferralConversion.referrer_user_id == user.id)
            .count()
        )

        granted = (
            db.query(ReferralReward)
            .filter(ReferralReward.referrer_user_id == user.id)
            .all()
        )
        granted_milestones = sorted([r.milestone for r in granted])

        milestones = []
        for m, reward in ReferralService.MILESTONES:
            milestones.append(
                {
                    "milestone": m,
                    "reward_coins": reward,
                    "reached": referred_paid_count >= m,
                    "granted": m in granted_milestones,
                }
            )

        next_milestone = None
        for m, reward in ReferralService.MILESTONES:
            if referred_paid_count < m:
                next_milestone = {"milestone": m, "reward_coins": reward}
                break

        try:
            import os

            frontend_url = (
                os.getenv("FRONTEND_URL")
                or os.getenv("CLIENT_URL")
                or "http://localhost:3000"
            )
        except Exception:
            frontend_url = "http://localhost:3000"

        referral_link = f"{frontend_url.rstrip('/')}/login?ref={code}"

        return {
            "user_id": user.id,
            "referral_code": code,
            "referral_link": referral_link,
            "referred_paid_count": referred_paid_count,
            "milestones": milestones,
            "granted_milestones": granted_milestones,
            "next_milestone": next_milestone,
        }

