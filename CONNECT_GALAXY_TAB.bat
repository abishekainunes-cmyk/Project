@echo off
title Akshay AI - Galaxy Tab A Connector
echo ==============================================================
echo       AKSHAY: Galaxy Tab A Auto-Deployment Bridge
echo ==============================================================
echo.

set SCRIPT_DIR=%~dp0

if exist "%SCRIPT_DIR%Akshay-AI-Personal-Assistant\connect_galaxy_tab.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%Akshay-AI-Personal-Assistant\connect_galaxy_tab.ps1"
) else if exist "D:\Akshay_Personal_AI\connect_galaxy_tab.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "D:\Akshay_Personal_AI\connect_galaxy_tab.ps1"
) else if exist "D:\connect_galaxy_tab.ps1" (
    powershell -NoProfile -ExecutionPolicy Bypass -File "D:\connect_galaxy_tab.ps1"
) else (
    echo [ERROR] Could not locate connect_galaxy_tab.ps1!
)

echo.
pause
