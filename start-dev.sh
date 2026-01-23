#!/bin/bash

echo "Starting Frontend and Backend..."

# Start frontend in background
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait a bit
sleep 2

# Start backend in background
cd ../backend && python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

echo ""
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop servers..."

# Wait for Ctrl+C
trap "kill $FRONTEND_PID $BACKEND_PID; exit" INT

# Keep script running
wait

