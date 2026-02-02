from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from api.routes import auth, upload, users, payments
from database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

# Create limiter for rate limiting
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="RenderTool API", version="1.0.0")

# Add rate limiting state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])

@app.get("/health")
def health():
    return {"status": "ok"}

