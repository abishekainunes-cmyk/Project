@echo off
setlocal
cd /d "%~dp0"
title NUNES Social Command Center - Local
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)
if not exist .env.local copy /Y .env.example .env.local >nul
start "" http://localhost:3000
call npm run dev
exit /b %errorlevel%
:error
echo.
echo Setup failed. Make sure Node.js 22 or newer is installed and internet access is available for npm install.
pause
exit /b 1
