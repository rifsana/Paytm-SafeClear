# Paytm SafeClear — Start Script (Windows PowerShell)
# Track 2: AI-Powered Financial Journeys

Write-Host "Starting Paytm SafeClear..." -ForegroundColor Cyan

# Start Backend
Write-Host "Starting FastAPI Backend on http://localhost:8000" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; if (Test-Path '.venv\Scripts\activate') { .\.venv\Scripts\activate }; python -m uvicorn main:app --host 0.0.0.0 --port 8000"

# Wait a moment for backend to boot
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Vite Frontend on http://localhost:5173" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Both servers starting!" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter to open the app in browser..."
$null = Read-Host
Start-Process "http://localhost:5173"
