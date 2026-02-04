"""add_phone_password_for_login

Revision ID: f1b2c3d4e5f6
Revises: d9a1b7c2f1aa
Create Date: 2026-02-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f1b2c3d4e5f6"
down_revision: Union[str, None] = "d9a1b7c2f1aa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(), nullable=True))
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=True)
    op.alter_column(
        "users",
        "email",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "email",
        existing_type=sa.String(),
        nullable=False,
    )
    op.drop_index(op.f("ix_users_phone"), table_name="users")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "phone")
