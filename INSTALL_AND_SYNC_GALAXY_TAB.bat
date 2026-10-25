@echo off
title Akshay AI - Galaxy Tab A Installer ^& Sync
echo ==============================================================
echo       AKSHAY AI v4.2 PRO: GALAXY TAB A APP INSTALLER ^& SYNC
echo ==============================================================
echo.

set SCRIPT_DIR=%~dp0

if exist "%SCRIPT_DIR%install_and_sync_galaxy_tab.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install_and_sync_galaxy_tab.ps1"
) else if exist "D:\Akshay_Personal_AI\install_and_sync_galaxy_tab.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Akshay_Personal_AI\install_and_sync_galaxy_tab.ps1"
) else (
    echo [ERROR] Could not locate install_and_sync_galaxy_tab.ps1!
)

echo.
pause
