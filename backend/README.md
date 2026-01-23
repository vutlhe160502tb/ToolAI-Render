# AI Dancing Backend

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Setup database:
```bash
# Create PostgreSQL database
createdb ai_dancing

# Run migrations (if using Alembic)
alembic upgrade head
```

3. Create `.env` file from `.env.example`

4. Run server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `GET /` - Root
- `GET /health` - Health check
- `POST /api/auth/google` - Google OAuth
- `POST /api/videos/dance-image-bg` - Create dance video job
- `GET /api/videos/{job_id}/progress` - Get job progress
- `GET /api/jobs` - Get user jobs

