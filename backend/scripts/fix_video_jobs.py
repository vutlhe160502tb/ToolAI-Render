#!/usr/bin/env python3
"""
Fix video_jobs table - Add missing columns if needed.

This script checks if required columns exist in video_jobs table
and adds them if missing.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database import engine

def fix_video_jobs_table():
    """Add missing columns to video_jobs if they don't exist."""
    inspector = inspect(engine)
    
    try:
        # Get existing columns
        columns = [col['name'] for col in inspector.get_columns('video_jobs')]
        print(f"Existing columns in video_jobs: {columns}")
        
        columns_to_add = {
            'input_file_url': 'VARCHAR NULL',
            'prompt': 'TEXT NULL',
            'admin_status': 'VARCHAR NULL',
            'admin_notes': 'TEXT NULL',
            'completed_at': 'TIMESTAMP WITH TIME ZONE NULL'
        }
        
        with engine.connect() as conn:
            for col_name, col_type in columns_to_add.items():
                if col_name in columns:
                    print(f"Column '{col_name}' already exists. Skipping...")
                else:
                    print(f"Column '{col_name}' is missing. Adding it...")
                    conn.execute(text(f"""
                        ALTER TABLE video_jobs 
                        ADD COLUMN {col_name} {col_type}
                    """))
                    conn.commit()
                    print(f"Successfully added '{col_name}' column!")
        
        print("\nSuccessfully fixed video_jobs table!")
        return True
        
    except Exception as e:
        print(f"Error fixing video_jobs table: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Fixing video_jobs table...")
    if fix_video_jobs_table():
        print("Done!")
    else:
        print("Failed!")
        sys.exit(1)

