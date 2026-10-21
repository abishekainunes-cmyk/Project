@echo off
title Autonomous System Temp Cleaner - Uninstall Daemon
color 0C

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "TASK_NAME=NUNES System Temp Cleaner - 4H Automation"
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

echo.
echo ========================================================
echo  Autonomous System Temp Cleaner Service Removed
echo ========================================================
echo.
echo The scheduled automation task has been unregistered.
echo.
pause
exit /b 0
