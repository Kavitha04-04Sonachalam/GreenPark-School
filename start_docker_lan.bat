@echo off
title Green Park School - Docker LAN Stack
cls
echo =======================================================
echo     GREEN PARK SCHOOL - DOCKER CONTAINER STACK
echo =======================================================
echo.

REM 1. Get local LAN IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IP Address"') do (
    set IP=%%a
    goto :found_ip
)
:found_ip
set IP=%IP: =%

echo [1/2] Server Host Detected:
echo       LAN IP Address: %IP%
echo.

REM 2. Launch Docker Compose Stack
echo [2/2] Starting Docker Stack (Postgres + Backend + Frontend)...
cd /d "%~dp0"
docker compose up -d

echo.
echo =======================================================
echo    GREEN PARK SCHOOL DOCKER STACK IS LIVE!
echo =======================================================
echo.
echo    Portal Web URL (Wi-Fi / LAN):
echo    http://%IP%:5175
echo.
echo    Backend API & Docs:
echo    http://%IP%:8000/docs
echo.
echo    Local Database:
echo    localhost:5434 (greenpark_db)
echo.
echo =======================================================
echo To stop the stack, run: docker compose down
pause
