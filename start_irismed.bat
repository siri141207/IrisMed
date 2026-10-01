@echo off
setlocal
cd /d "%~dp0"

echo Starting IrisMed backend...
start "IrisMed Backend" /D "%~dp0backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo Starting IrisMed frontend...
start "IrisMed Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
