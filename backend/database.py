from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Suppress SQLAlchemy engine logs
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/ai_dancing"
)

# Railway/cloud Postgres often close idle connections; avoid "SSL SYSCALL error: EOF detected"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,   # check connection alive before use, discard stale
    pool_recycle=300,    # recycle connections before server idle timeout (e.g. 5 min)
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

