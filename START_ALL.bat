@echo off
echo ================================================================
echo    InsightEdge - Complete System Startup Script
echo ================================================================
echo.

REM Check if MongoDB is running
echo [1/4] Checking MongoDB...
mongosh --eval "db.runCommand({ping: 1})" >nul 2>&1
if errorlevel 1 (
    echo WARNING: MongoDB connection failed. Please start MongoDB first.
    echo.
) else (
    echo ✓ MongoDB is running
    echo.
)

REM Start Node.js Backend
echo [2/4] Starting Node.js Backend (Port 5000)...
cd /d "%~dp0Backend"
start "Node.js Backend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
echo ✓ Node.js Backend started
echo.

REM Start FastAPI ML Backend
echo [3/4] Starting FastAPI ML Backend (Port 8000)...
cd /d "%~dp0ML Model Backend"
start "FastAPI ML Backend" cmd /k "uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
echo ✓ FastAPI ML Backend started
echo.

REM Start React Frontend
echo [4/4] Starting React Frontend (Port 5173)...
cd /d "%~dp0frontend"
start "React Frontend" cmd /k "npm run dev"
echo ✓ React Frontend started
echo.

echo ================================================================
echo    All services started!
echo ================================================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:5000
echo ML Backend: http://localhost:8000
echo ML Docs:   http://localhost:8000/docs
echo.
echo Press any key to exit...
pause >nul
