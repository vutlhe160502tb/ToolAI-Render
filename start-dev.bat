@echo off
echo Starting Frontend and Backend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak >nul
start "Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"
echo.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo.
echo Press any key to stop servers...
pause >nul
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Backend*" /T /F >nul 2>&1

