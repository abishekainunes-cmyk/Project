@echo off
title AKSHAY AI - Autonomous Personal Assistant
echo ==============================================================
echo       AKSHAY: Autonomous Personal AI & FinOS Engine
echo       Running locally - 100%% Private and Offline Capable
echo ==============================================================
echo.

cd /d "%~dp0"

:: Start the Python server in the background
start /B "" python server.py

:: Wait 1 second for socket initialization
timeout /t 1 /nobreak >nul

:: Launch Edge or Chrome in standalone App Mode (Windowed HUD)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:8085
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=http://localhost:8085
) else (
    start http://localhost:8085
)

echo.
echo [*] Akshay HUD launched successfully in App Mode.
echo [*] You can close this terminal window at any time.
echo.
pause
