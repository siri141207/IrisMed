@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo           IRISMED FIRST-TIME SETUP
echo ========================================
echo.

if not exist "backend\.venv\Scripts\python.exe" (
    echo Creating Python environment...
    py -m venv backend\.venv
    if errorlevel 1 goto :error
)

call backend\.venv\Scripts\activate.bat
python -m pip install -r backend\requirements.txt
if errorlevel 1 goto :error

cd frontend
call npm install
if errorlevel 1 goto :error
cd ..

echo.
echo Setup complete.
echo Run start_irismed.bat to launch IrisMed.
pause
exit /b 0

:error
echo.
echo Setup failed. Check the message above.
pause
exit /b 1
