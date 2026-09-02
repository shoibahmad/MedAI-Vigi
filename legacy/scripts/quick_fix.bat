@echo off
echo ========================================
echo Quick Fix: Kill Old Servers and Restart
echo ========================================
echo.

echo Step 1: Killing old Flask servers on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Step 2: Waiting for ports to clear...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Verifying API keys...
python diagnose_api.py

echo.
echo ========================================
echo Ready to start server!
echo ========================================
echo.
echo Run one of these commands:
echo   python app.py           (Production)
echo   python debug_server.py  (Debug)
echo.
pause
