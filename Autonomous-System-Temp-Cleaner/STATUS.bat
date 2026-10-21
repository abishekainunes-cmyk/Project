@echo off
title Autonomous System Temp Cleaner - Service Status
color 0B

set "TASK_NAME=NUNES System Temp Cleaner - 4H Automation"
echo ========================================================
echo   AUTONOMOUS SYSTEM TEMP CLEANER - SERVICE STATUS
echo ========================================================
echo.

schtasks /query /tn "%TASK_NAME%" /fo LIST /v 2>nul
if %errorlevel% neq 0 (
    echo [STATUS] Daemon is NOT installed or running.
    echo To install, right-click INSTALL_4H_SERVICE.bat and run as Administrator.
) else (
    echo.
    echo [STATUS] Daemon is actively registered in Windows Task Scheduler.
)

echo.
echo ========================================================
pause
exit /b 0
