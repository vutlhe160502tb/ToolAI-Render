#!/usr/bin/env python3
"""
Fix credit_transactions table - Add missing 'type' column if needed.

This script checks if the 'type' column exists in credit_transactions table
and adds it if missing. This is needed because the model has 'type' field
but database might have been created before this field was added.
"""

from sqlalchemy import text, inspect
from database import engine
from models import TransactionType
import sys

def fix_credit_transactions_table():
    """Add 'type' column to credit_transactions if it doesn't exist."""
    inspector = inspect(engine)
    
    # Get existing columns
    columns = [col['name'] for col in inspector.get_columns('credit_transactions')]
    print(f"📋 Existing columns in credit_transactions: {columns}")
    
    if 'type' in columns:
        print("✅ Column 'type' already exists. No action needed.")
        return True
    
    print("⚠️  Column 'type' is missing. Adding it...")
    
    try:
        with engine.connect() as conn:
            # Check if enum type exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'transactiontype'
                )
            """))
            enum_exists = result.scalar()
            
            if not enum_exists:
                print("📝 Creating TransactionType enum...")
                # Create enum type
                conn.execute(text("""
                    CREATE TYPE transactiontype AS ENUM ('addition', 'deduction')
                """))
                conn.commit()
            
            # Add column with default value
            print("📝 Adding 'type' column...")
            conn.execute(text("""
                ALTER TABLE credit_transactions 
                ADD COLUMN type transactiontype DEFAULT 'addition' NOT NULL
            """))
            conn.commit()
            
            print("✅ Successfully added 'type' column!")
            return True
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\nTrying alternative approach (recreate table)...")
        
        # Alternative: Drop and recreate (WARNING: This will lose data!)
        try:
            response = input("\n⚠️  This will DROP the table and recreate it. All data will be lost!\nType 'yes' to continue: ")
            if response.lower() != 'yes':
                print("❌ Cancelled.")
                return False
            
            with engine.connect() as conn:
                conn.execute(text("DROP TABLE IF EXISTS credit_transactions CASCADE"))
                conn.commit()
            
            # Recreate using SQLAlchemy
            from models import CreditTransaction, Base
            Base.metadata.create_all(bind=engine, tables=[CreditTransaction.__table__])
            print("✅ Table recreated successfully!")
            return True
            
        except Exception as e2:
            print(f"❌ Error recreating table: {str(e2)}")
            return False

if __name__ == "__main__":
    print("🔧 Fixing credit_transactions table...\n")
    success = fix_credit_transactions_table()
    sys.exit(0 if success else 1)

