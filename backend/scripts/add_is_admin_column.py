#!/usr/bin/env python3
"""
Add is_admin column to users table
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database import engine

def add_is_admin_column():
    """Add is_admin column to users table if it doesn't exist"""
    inspector = inspect(engine)
    
    try:
        # Get existing columns
        columns = [col['name'] for col in inspector.get_columns('users')]
        print(f"Existing columns in users: {columns}")
        
        if 'is_admin' in columns:
            print("[OK] Column 'is_admin' already exists. No action needed.")
            return True
        
        print("Column 'is_admin' is missing. Adding it...")
        
        with engine.connect() as conn:
            # Add is_admin column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN is_admin BOOLEAN DEFAULT FALSE
            """))
            conn.commit()
        
        print("[OK] Successfully added 'is_admin' column to users table!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Adding is_admin column to users table...")
    if add_is_admin_column():
        print("Done!")
    else:
        print("Failed!")
        sys.exit(1)

