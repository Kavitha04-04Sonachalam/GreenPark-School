@echo off
title Uninstall GreenPark School Auto-Start
cls
echo =======================================================
echo    REMOVING GREEN PARK SCHOOL AUTO-START
echo =======================================================
echo.

if exist %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\GreenParkSchoolPortal.lnk (
    del %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\GreenParkSchoolPortal.lnk
    echo Removed Windows Startup shortcut.
)

powershell -Command  = [System.Environment]::GetFolderPath('Desktop'); if (Test-Path "\Open GreenPark Portal.lnk") { Remove-Item "\Open GreenPark Portal.lnk" -Force; Write-Host 'Removed Desktop shortcut.' }

echo.
echo Auto-start has been removed.
echo.
pause
