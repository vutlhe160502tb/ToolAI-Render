"""add_referral_tables

Revision ID: d9a1b7c2f1aa
Revises: e58e3724ed49
Create Date: 2026-01-30

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = "d9a1b7c2f1aa"
down_revision: Union[str, None] = "e58e3724ed49"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    def table_exists(name: str) -> bool:
        return name in insp.get_table_names()

    def column_exists(table: str, column: str) -> bool:
        try:
            cols = insp.get_columns(table)
        except Exception:
            return False
        return any(c.get("name") == column for c in cols)

    def index_exists(table: str, index_name: str) -> bool:
        try:
            idxs = insp.get_indexes(table)
        except Exception:
            return False
        return any(i.get("name") == index_name for i in idxs)

    def fk_exists(table: str, fk_name: str) -> bool:
        try:
            fks = insp.get_foreign_keys(table)
        except Exception:
            return False
        return any(fk.get("name") == fk_name for fk in fks)

    # Users: referral_code, referrer_id
    if not column_exists("users", "referral_code"):
        op.add_column("users", sa.Column("referral_code", sa.String(), nullable=True))
    if not column_exists("users", "referrer_id"):
        op.add_column("users", sa.Column("referrer_id", sa.String(), nullable=True))

    if not index_exists("users", "ix_users_referral_code"):
        op.create_index("ix_users_referral_code", "users", ["referral_code"], unique=True)
    if not index_exists("users", "ix_users_referrer_id"):
        op.create_index("ix_users_referrer_id", "users", ["referrer_id"], unique=False)
    if not fk_exists("users", "fk_users_referrer_id_users"):
        op.create_foreign_key(
            "fk_users_referrer_id_users",
            "users",
            "users",
            ["referrer_id"],
            ["id"],
        )

    # referral_conversions
    # NOTE: In existing DB, this table already exists with columns:
    # referrer_user_id, referred_user_id, first_payment_id, qualified_at, created_at
    # Make migration safe/idempotent: only create if missing, and only create indexes if columns exist.
    if not table_exists("referral_conversions"):
        op.create_table(
            "referral_conversions",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("referrer_user_id", sa.String(), nullable=False),
            sa.Column("referred_user_id", sa.String(), nullable=False),
            sa.Column("first_payment_id", sa.String(), nullable=True),
            sa.Column("qualified_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(
                ["referrer_user_id"], ["users.id"], name="referral_conversions_referrer_user_id_fkey"
            ),
            sa.ForeignKeyConstraint(
                ["referred_user_id"], ["users.id"], name="referral_conversions_referred_user_id_fkey"
            ),
            sa.ForeignKeyConstraint(
                ["first_payment_id"], ["payments.id"], name="referral_conversions_first_payment_id_fkey"
            ),
            sa.UniqueConstraint(
                "referred_user_id", name="uq_referral_conversions_referred_user_id"
            ),
        )
    if table_exists("referral_conversions"):
        if column_exists("referral_conversions", "referrer_user_id") and not index_exists(
            "referral_conversions", "ix_referral_conversions_referrer_user_id"
        ):
            op.create_index(
                "ix_referral_conversions_referrer_user_id",
                "referral_conversions",
                ["referrer_user_id"],
                unique=False,
            )
        if column_exists("referral_conversions", "referred_user_id") and not index_exists(
            "referral_conversions", "ix_referral_conversions_referred_user_id"
        ):
            op.create_index(
                "ix_referral_conversions_referred_user_id",
                "referral_conversions",
                ["referred_user_id"],
                unique=True,
            )

    # referral_rewards
    # NOTE: In existing DB, this table already exists with columns:
    # referrer_user_id, milestone, amount, awarded_at, created_at
    if not table_exists("referral_rewards"):
        op.create_table(
            "referral_rewards",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("referrer_user_id", sa.String(), nullable=False),
            sa.Column("milestone", sa.Integer(), nullable=False),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("awarded_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
            sa.ForeignKeyConstraint(
                ["referrer_user_id"], ["users.id"], name="referral_rewards_referrer_user_id_fkey"
            ),
            sa.UniqueConstraint(
                "referrer_user_id", "milestone", name="uq_referral_rewards_referrer_milestone"
            ),
        )
    if table_exists("referral_rewards"):
        if column_exists("referral_rewards", "referrer_user_id") and not index_exists(
            "referral_rewards", "ix_referral_rewards_referrer_user_id"
        ):
            op.create_index(
                "ix_referral_rewards_referrer_user_id",
                "referral_rewards",
                ["referrer_user_id"],
                unique=False,
            )


def downgrade() -> None:
    op.drop_index("ix_referral_rewards_referrer_id", table_name="referral_rewards")
    op.drop_table("referral_rewards")

    op.drop_index("ix_referral_conversions_referred_user_id", table_name="referral_conversions")
    op.drop_index("ix_referral_conversions_referrer_id", table_name="referral_conversions")
    op.drop_table("referral_conversions")

    op.drop_constraint("fk_users_referrer_id_users", "users", type_="foreignkey")
    op.drop_index("ix_users_referrer_id", table_name="users")
    op.drop_index("ix_users_referral_code", table_name="users")
    op.drop_column("users", "referrer_id")
    op.drop_column("users", "referral_code")

