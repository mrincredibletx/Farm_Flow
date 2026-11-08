Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Smart Agricultural Drainage System - Phase I (7th Sem MVP)" -ForegroundColor Cyan
Write-Host " Project Owner: Rakesh Bangra (B.Tech CSE, UEM Jaipur)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# Check Python and Node
Write-Host "`n[1/3] Checking environment..." -ForegroundColor Yellow
python --version
node --version

# Start FastAPI Backend in new window
Write-Host "`n[2/3] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

# Start Next.js Frontend in current or new window
Write-Host "`n[3/3] Starting Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nSystem online!" -ForegroundColor Green
Write-Host "Backend API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend App:     http://localhost:3000" -ForegroundColor Cyan

