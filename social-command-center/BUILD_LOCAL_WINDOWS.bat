@echo off
setlocal
cd /d "%~dp0"
title NUNES Social Command Center - Production Build
if not exist node_modules call npm install
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error
echo.
echo BUILD PASSED
echo Run: npm start
pause
exit /b 0
:error
echo.
echo BUILD FAILED - review the error above.
pause
exit /b 1
