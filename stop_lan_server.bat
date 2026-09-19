@echo off
title Stop GreenPark School LAN Server
cls
echo =======================================================
echo     STOPPING GREEN PARK SCHOOL LOCAL SERVER
echo =======================================================
echo.

echo Stopping Python Backend (port 8000)...
for /f tokens=5 %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Stopping Frontend Web Server (port 5173)...
for /f tokens=5 %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All GreenPark Server processes have been cleanly stopped.
echo.
timeout /t 3 >nul
