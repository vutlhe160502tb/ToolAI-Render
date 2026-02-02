from pathlib import Path
import os
import sys
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from api.routes import auth, videos, jobs, payments, users, telegram, referral
from database import engine, Base, DATABASE_URL as _db_url

# Suppress KeyboardInterrupt traceback on shutdown
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)
sys.tracebacklimit = 0  # Disable traceback for clean shutdown

# Run Alembic migrations so DB schema is up to date (e.g. Railway deploy)
_backend_dir = Path(__file__).resolve().parent
_alembic_ini = _backend_dir / "alembic.ini"
if _alembic_ini.exists() and _db_url:
    try:
        from alembic import command
        from alembic.config import Config
        _cfg = Config(str(_alembic_ini))
        _cfg.set_main_option("script_location", str(_backend_dir / "alembic"))
        _cfg.set_main_option("sqlalchemy.url", _db_url)
        command.upgrade(_cfg, "head")
    except Exception as e:
        logging.warning("Alembic upgrade at startup skipped: %s", e)

# Create tables (for new envs; migrations handle existing DBs)
Base.metadata.create_all(bind=engine)

# Create limiter for rate limiting
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="AI Dancing API", version="1.0.0")

# Add rate limiting state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["telegram"])
app.include_router(referral.router, prefix="/api/referral", tags=["referral"])

@app.get("/")
def root():
    return {"message": "AI Dancing API"}

@app.get("/health")
def health():
    return {"status": "ok"}

