"""add_sepay_fields_remove_unused_fields

Revision ID: e58e3724ed49
Revises: 
Create Date: 2026-01-28 11:21:08.681384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e58e3724ed49'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add SePay specific fields
    op.add_column('payments', sa.Column('expired_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('payments', sa.Column('product_code', sa.String(), nullable=True))
    op.add_column('payments', sa.Column('customer_code', sa.String(), nullable=True))
    
    # Remove unused fields (not used for SePay)
    op.drop_column('payments', 'gateway_transaction_id')
    op.drop_column('payments', 'gateway_response')
    op.drop_column('payments', 'qr_code_data')
    op.drop_column('payments', 'bank_name')
    op.drop_column('payments', 'account_holder')
    op.drop_column('payments', 'account_number')


def downgrade() -> None:
    # Restore removed fields
    op.add_column('payments', sa.Column('gateway_transaction_id', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('payments', sa.Column('gateway_response', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('payments', sa.Column('qr_code_data', sa.TEXT(), autoincrement=False, nullable=True))
    op.add_column('payments', sa.Column('bank_name', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('payments', sa.Column('account_holder', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column('payments', sa.Column('account_number', sa.VARCHAR(), autoincrement=False, nullable=True))
    
    # Remove SePay specific fields
    op.drop_column('payments', 'customer_code')
    op.drop_column('payments', 'product_code')
    op.drop_column('payments', 'expired_at')
