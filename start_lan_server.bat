@echo off
title Green Park School - LAN Server
cls
echo =======================================================
echo     GREEN PARK SCHOOL - LOCAL LAN SERVER
echo =======================================================
echo.

REM 1. Verify Native PostgreSQL Service
echo [1/3] Checking Native PostgreSQL Service...
sc query postgresql-x64-17 | findstr "RUNNING" >nul
if %errorlevel% neq 0 (
    echo       Starting PostgreSQL Windows Service...
    net start postgresql-x64-17 >nul 2>&1
)
echo       PostgreSQL Database is RUNNING on port 5432.
echo.

REM 2. Get local LAN IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IP Address"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
set IP=%IP: =%

echo [2/3] Server Host Detected:
echo       LAN IP Address: %IP%
echo.

REM 3. Launch Backend & Frontend
echo [3/3] Starting Backend and Frontend Services...
cd /d "%~dp0"

start "GreenPark Backend (API)" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
start "GreenPark Frontend (Web)" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================
echo    SERVER IS NOW LIVE ON YOUR LOCAL NETWORK!
echo =======================================================
echo.
echo    Teachers and Staff can open from any device on Wi-Fi:
echo    http://%IP%:5173
echo.
echo    API Documentation:
echo    http://%IP%:8000/docs
echo.
echo =======================================================
echo Keep this window open. Press any key to exit launcher.
pause >nul
