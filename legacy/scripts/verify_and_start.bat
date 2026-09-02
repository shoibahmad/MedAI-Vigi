@echo off
echo ========================================
echo ADR Risk Predictor - Server Startup
echo ========================================
echo.

echo Verifying API keys...
python diagnose_api.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: API key verification failed!
    echo Please check your .env file
    pause
    exit /b 1
)

echo.
echo ========================================
echo Starting Flask Server...
echo ========================================
echo.
echo Choose server to start:
echo 1. Production Server (app.py)
echo 2. Debug Server (debug_server.py)
echo.
set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo Starting Production Server...
    python app.py
) else if "%choice%"=="2" (
    echo Starting Debug Server...
    python debug_server.py
) else (
    echo Invalid choice. Starting Production Server by default...
    python app.py
)
