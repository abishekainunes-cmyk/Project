@echo off
setlocal EnableExtensions
title Autonomous System Temp Cleaner - 4 Hour Background Daemon Setup
color 0A

:: =========================================================
:: AUTONOMOUS SYSTEM TEMP CLEANER - SERVICE INSTALLER
:: Installs a hidden Windows Scheduled Task that:
::   - Runs silently every 4 hours
::   - Runs at Windows system startup
::   - Runs as SYSTEM with highest privileges
::   - Self-recovers missed schedules after laptop sleep
:: =========================================================

set "SOURCE=%~dp0NUNES_CACHE_CLEANER.bat"
set "INSTALL_DIR=%ProgramData%\Nunes\CacheCleaner"
set "INSTALL_FILE=%INSTALL_DIR%\NUNES_CACHE_CLEANER.bat"
set "TASK_NAME=NUNES System Temp Cleaner - 4H Automation"

if not exist "%SOURCE%" (
    echo [ERROR] Cannot find NUNES_CACHE_CLEANER.bat in %~dp0
    pause
    exit /b 1
)

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges to register Scheduled Task...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cls
echo ========================================================
echo   AUTONOMOUS SYSTEM TEMP CLEANER - 4H SERVICE SETUP
echo ========================================================
echo.
echo Installing daemon to: %INSTALL_DIR%
echo Target Task Name   : %TASK_NAME%
echo Execution Frequency: Every 4 Hours + Startup
echo Security Context   : NT AUTHORITY\SYSTEM (Highest)
echo.

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" >nul 2>&1
copy /Y "%SOURCE%" "%INSTALL_FILE%" >nul

:: Register scheduled task via PowerShell
set "PS_CMD=$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c \"\"%INSTALL_FILE%\"\" /AUTO'; $t1 = New-ScheduledTaskTrigger -AtStartup; $t2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddHours(4) -RepetitionInterval (New-TimeSpan -Hours 4) -RepetitionDuration (New-TimeSpan -Days 3650); $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest; $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -Hidden -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 1); Register-ScheduledTask -TaskName '%TASK_NAME%' -Action $action -Trigger @($t1, $t2) -Principal $principal -Settings $settings -Description 'Autonomous System Temp Cleaner sweeps temporary caches every 4 hours.' -Force | Out-Null; Start-ScheduledTask -TaskName '%TASK_NAME%'"

powershell -NoProfile -Command "%PS_CMD%"

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! 4-Hour Background Service Installed & Started.
    echo ========================================================
    echo.
    echo The cleaner will now run autonomously every 4 hours.
    echo No further manual intervention or UAC prompt is required.
    echo.
) else (
    echo.
    echo [ERROR] Failed to register Windows Scheduled Task.
    echo.
)

pause
exit /b %errorlevel%
