@echo off
title Install GreenPark School Auto-Start
cls
echo =======================================================
echo    GREEN PARK SCHOOL - ZERO-TOUCH AUTO-START SETUP
echo =======================================================
echo.

REM 1. Create Startup Shortcut
echo [1/3] Adding to Windows Startup folder...
powershell -Command  = New-Object -ComObject WScript.Shell; = .CreateShortcut("C:\Users\Logeshwaran\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\GreenParkSchoolPortal.lnk"); .TargetPath = "\scripts\run_silent.vbs"; .WorkingDirectory = ""; .IconLocation = "\frontend\public\school-logo.jpg"; .Save()
echo       Windows Startup shortcut created successfully.
echo.

REM 2. Create Desktop Shortcut
echo [2/3] Creating Desktop Shortcut...
powershell -Command  = New-Object -ComObject WScript.Shell; = [System.Environment]::GetFolderPath('Desktop'); = .CreateShortcut("\Open GreenPark Portal.lnk"); .TargetPath = "http://localhost:5173"; .IconLocation = "\frontend\public\school-logo.jpg"; .Save()
echo       Desktop shortcut created successfully.
echo.

REM 3. Configure Windows Firewall
echo [3/3] Configuring Windows Firewall for School LAN...
netsh advfirewall firewall add rule name=GreenPark School Web (5173) dir=in action=allow protocol=TCP localport=5173 >nul 2>&1
netsh advfirewall firewall add rule name=GreenPark School API (8000) dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
echo       Firewall rules configured for ports 5173 and 8000.
echo.

echo =======================================================
echo    INSTALLATION COMPLETE!
echo =======================================================
echo.
echo The school server will now automatically start every time
echo this PC powers on. Teachers can access the portal from
echo any device on the school network.
echo.
pause
