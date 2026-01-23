#!/usr/bin/env python3
"""
Set user as admin by email
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from models import User
from sqlalchemy.orm import sessionmaker

def set_admin(email: str, is_admin: bool = True):
    """Set user as admin by email"""
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"[ERROR] User with email {email} not found")
            print("Creating user...")
            import uuid
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                name="Admin",
                credits=0.0,
                is_admin=is_admin
            )
            db.add(user)
            print(f"[OK] Created user: {email}")
        else:
            user.is_admin = is_admin
            print(f"[OK] Updated user: {email}")
        
        db.commit()
        print(f"[OK] User {email} is now {'admin' if is_admin else 'regular user'}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Set user as admin")
    parser.add_argument("email", type=str, help="User email")
    parser.add_argument("--remove", action="store_true", help="Remove admin status")
    
    args = parser.parse_args()
    
    is_admin = not args.remove
    success = set_admin(args.email, is_admin)
    
    if not success:
        sys.exit(1)

