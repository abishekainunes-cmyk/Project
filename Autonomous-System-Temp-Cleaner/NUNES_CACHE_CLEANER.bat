@echo off
title NUNES CACHE CLEANER V2
color 0A

:: =========================================================
:: NUNES CACHE CLEANER V2
:: Clears:
::   1. Current user's TEMP folder
::   2. Windows TEMP folder
::
:: Does NOT clear:
::   - Downloads
::   - Documents
::   - Browser passwords
::   - Browser cookies
::   - Personal files
:: =========================================================


:: ---------------------------------------------------------
:: CHECK FOR ADMIN RIGHTS
:: ---------------------------------------------------------

net session >nul 2>&1

if %errorlevel% neq 0 (
    echo.
    echo Requesting Administrator permission...
    echo.

    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)


cls

echo ========================================================
echo.
echo              NUNES CACHE CLEANER V2
echo.
echo ========================================================
echo.
echo Computer : %COMPUTERNAME%
echo User     : %USERNAME%
echo.
echo This will clean:
echo.
echo   [1] %TEMP%
echo   [2] C:\Windows\Temp
echo.
echo Personal files will NOT be deleted.
echo.
echo ========================================================
echo.

choice /C YN /N /M "Start cleanup? [Y/N]: "

if errorlevel 2 goto CANCEL


echo.
echo ========================================================
echo [1/2] Cleaning User TEMP...
echo ========================================================
echo.

if exist "%TEMP%" (

    del /f /s /q "%TEMP%\*" >nul 2>&1

    for /d %%D in ("%TEMP%\*") do (
        rd /s /q "%%D" >nul 2>&1
    )

)

echo User TEMP cleanup completed.
echo.


echo ========================================================
echo [2/2] Cleaning Windows TEMP...
echo ========================================================
echo.

if exist "C:\Windows\Temp" (

    del /f /s /q "C:\Windows\Temp\*" >nul 2>&1

    for /d %%D in ("C:\Windows\Temp\*") do (
        rd /s /q "%%D" >nul 2>&1
    )

)

echo Windows TEMP cleanup completed.
echo.


echo ========================================================
echo.
echo              CLEANUP COMPLETED
echo.
echo ========================================================
echo.
echo Some files may remain because Windows or programs
echo are currently using them. This is normal.
echo.
echo Computer : %COMPUTERNAME%
echo User     : %USERNAME%
echo.
echo ========================================================
echo.

pause
exit /b


:CANCEL

echo.
echo Cleanup cancelled.
echo.

pause
exit /b