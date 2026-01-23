#!/usr/bin/env python3
"""Check all table schemas to match with models."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text, inspect

def check_table_schema(table_name):
    """Get full schema of a table."""
    inspector = inspect(engine)
    
    print(f"\n{'='*60}")
    print(f"Table: {table_name}")
    print(f"{'='*60}")
    
    # Get columns
    columns = inspector.get_columns(table_name)
    print("\nColumns:")
    for col in columns:
        nullable = "NULL" if col['nullable'] else "NOT NULL"
        default = f" DEFAULT {col['default']}" if col['default'] else ""
        print(f"  - {col['name']}: {col['type']} {nullable}{default}")
    
    # Get constraints
    constraints = inspector.get_unique_constraints(table_name)
    if constraints:
        print("\nUnique Constraints:")
        for constraint in constraints:
            print(f"  - {constraint['name']}: {constraint['column_names']}")
    
    # Get foreign keys
    foreign_keys = inspector.get_foreign_keys(table_name)
    if foreign_keys:
        print("\nForeign Keys:")
        for fk in foreign_keys:
            print(f"  - {fk['name']}: {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")

# Check all relevant tables
tables = ['users', 'payments', 'credit_transactions', 'credit_reservations', 'video_jobs']

for table in tables:
    try:
        check_table_schema(table)
    except Exception as e:
        print(f"\n❌ Error checking {table}: {e}")

