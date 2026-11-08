@echo off
title Smart Agricultural Drainage System - Phase I (7th Sem MVP)
echo ==========================================================
echo  Smart Agricultural Drainage System - Phase I (7th Sem MVP)
echo  Project Owner: Rakesh Bangra (B.Tech CSE, UEM Jaipur)
echo ==========================================================

echo Starting FastAPI Backend...
start "FastAPI Backend (Port 8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo Starting Next.js Frontend...
start "Next.js Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers launched in dedicated windows.
echo Frontend: http://localhost:3000
echo Backend API Docs: http://127.0.0.1:8000/docs
echo.
pause

