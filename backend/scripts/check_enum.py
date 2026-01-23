#!/usr/bin/env python3
"""Check transactiontype enum values in database."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check if enum exists
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT 1 FROM pg_type WHERE typname = 'transactiontype'
        )
    """))
    enum_exists = result.scalar()
    print(f"Enum 'transactiontype' exists: {enum_exists}")
    
    if enum_exists:
        # Get enum values
        result = conn.execute(text("""
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transactiontype')
            ORDER BY enumsortorder
        """))
        values = [r[0] for r in result]
        print(f"Enum values: {values}")
    
    # Check column type
    result = conn.execute(text("""
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'credit_transactions' 
        AND column_name = 'transaction_type'
    """))
    cols = [dict(r._mapping) for r in result]
    print(f"Column info: {cols}")

