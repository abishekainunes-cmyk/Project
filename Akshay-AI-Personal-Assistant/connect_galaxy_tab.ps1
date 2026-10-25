# Galaxy Tab A Auto-Connector & Port Forwarder
$adb = Join-Path $PSScriptRoot "..\tools\platform-tools\adb.exe"

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "       AKSHAY: Galaxy Tab A Auto-Deployment Bridge            " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $adb)) {
    Write-Host "[-] Error: ADB binary not found at: $adb" -ForegroundColor Red
    exit 1
}

Write-Host "[*] Checking for connected Galaxy Tab A via ADB..." -ForegroundColor Yellow
$output = & $adb devices -l

$deviceLine = $output | Where-Object { $_ -match "\bdevice\b" -and $_ -notmatch "List of devices" }
$unauthorizedLine = $output | Where-Object { $_ -match "\bunauthorized\b" }

if ($deviceLine) {
    $devId = ($deviceLine -split '\s+')[0]
    Write-Host "[+] Galaxy Tab A detected and authorized! (Device ID: $devId)" -ForegroundColor Green
    Write-Host "[*] Forwarding local port 8085 over USB cable to tablet..." -ForegroundColor Cyan
    & $adb reverse tcp:8085 tcp:8085
    Write-Host "[+] Port forwarded! 'http://localhost:8085' is now bridged through USB!" -ForegroundColor Green
    Write-Host "[*] Launching Akshay directly on your Galaxy Tab A screen..." -ForegroundColor Cyan
    & $adb shell am start -a android.intent.action.VIEW -d "http://localhost:8085"
    Write-Host ""
    Write-Host "[SUCCESS] Akshay is now open on your Galaxy Tab A!" -ForegroundColor Green
    Write-Host "Tap 'Install App' or 'Add to Home Screen' in the browser." -ForegroundColor Yellow
    Write-Host "==============================================================" -ForegroundColor Cyan
    exit 0
}
elseif ($unauthorizedLine) {
    Write-Host "[!] Tablet detected, but UNTRUSTED:" -ForegroundColor Yellow
    Write-Host "Look at your Galaxy Tab A screen and tap: 'Always allow from this computer' -> [Allow]" -ForegroundColor Red
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "[!] Galaxy Tab A is currently connected in standard MTP (File Transfer) mode." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "--------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "HOW TO RUN AKSHAY ON YOUR GALAXY TAB RIGHT NOW:" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "WAY 1 (INSTANT VIA WI-FI - NO SETTINGS NEEDED):" -ForegroundColor Green
    Write-Host "  1. On your Galaxy Tab A, open Samsung Internet or Chrome."
    Write-Host "  2. Type this exact URL into the tablet address bar:"
    Write-Host "     http://192.168.0.105:8085" -ForegroundColor Yellow
    Write-Host "     (NOTE: Do not type 'localhost' on the tablet! Type 192.168.0.105:8085)" -ForegroundColor Red
    Write-Host ""
    Write-Host "WAY 2 (VIA DIRECT USB CABLE):" -ForegroundColor Green
    Write-Host "  1. On your Galaxy Tab A: Settings -> About Tablet -> Software Info -> Tap 'Build Number' 7 times."
    Write-Host "  2. Back in Settings -> Developer Options -> Turn ON 'USB Debugging'."
    Write-Host "  3. Re-run this script! It will auto-forward and launch the app on your tablet screen."
    Write-Host "==============================================================" -ForegroundColor Cyan
}
