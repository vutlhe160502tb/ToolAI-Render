#!/usr/bin/env python3
"""
Fix credit_reservations table - Add missing 'completed_at' column if needed.

This script checks if the 'completed_at' column exists in credit_reservations table
and adds it if missing.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database import engine

def fix_credit_reservations_table():
    """Add 'completed_at' column to credit_reservations if it doesn't exist."""
    inspector = inspect(engine)
    
    try:
        # Get existing columns
        columns = [col['name'] for col in inspector.get_columns('credit_reservations')]
        print(f"Existing columns in credit_reservations: {columns}")
        
        if 'completed_at' in columns:
            print("Column 'completed_at' already exists. No action needed.")
            return True
        
        print("Column 'completed_at' is missing. Adding it...")
        
        with engine.connect() as conn:
            # Add completed_at column
            conn.execute(text("""
                ALTER TABLE credit_reservations 
                ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE NULL
            """))
            conn.commit()
        
        print("Successfully added 'completed_at' column to credit_reservations table!")
        return True
        
    except Exception as e:
        print(f"Error fixing credit_reservations table: {str(e)}")
        return False

if __name__ == "__main__":
    print("Fixing credit_reservations table...")
    success = fix_credit_reservations_table()
    sys.exit(0 if success else 1)

