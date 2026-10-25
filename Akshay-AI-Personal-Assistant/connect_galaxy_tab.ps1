# Galaxy Tab A Auto-Connector & Port Forwarder (Robust Multi-Path)
$ScriptDir = $PSScriptRoot

# Locate adb.exe dynamically across possible deployment locations
$adbCandidates = @(
    (Join-Path $ScriptDir "tools\platform-tools\adb.exe"),
    (Join-Path $ScriptDir "..\tools\platform-tools\adb.exe"),
    "D:\Akshay_Personal_AI\tools\platform-tools\adb.exe",
    "C:\Users\abish\Documents\antigravity\quick-curie\tools\platform-tools\adb.exe"
)

$adb = $null
foreach ($cand in $adbCandidates) {
    if (Test-Path $cand) {
        $adb = $cand
        break
    }
}

if (-not $adb) {
    $sysAdb = (Get-Command adb.exe -ErrorAction SilentlyContinue).Source
    if ($sysAdb) { $adb = $sysAdb }
}

Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "       AKSHAY: Galaxy Tab A Auto-Deployment Bridge            " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $adb -or -not (Test-Path $adb)) {
    Write-Host "[-] Error: ADB binary not found in standard locations." -ForegroundColor Red
    Write-Host "Please verify tools\platform-tools\adb.exe exists." -ForegroundColor Yellow
    exit 1
}

Write-Host "[*] ADB Engine: $adb" -ForegroundColor Gray
Write-Host "[*] Probing for connected Galaxy Tab A via ADB..." -ForegroundColor Yellow

$maxAttempts = 15
$attempt = 0
$authorized = $false
$deviceFound = $false
$devId = ""

while ($attempt -lt $maxAttempts) {
    $output = & $adb devices -l
    $deviceLine = $output | Where-Object { $_ -match "\bdevice\b" -and $_ -notmatch "List of devices" }
    $unauthorizedLine = $output | Where-Object { $_ -match "\bunauthorized\b" }

    if ($deviceLine) {
        $deviceFound = $true
        $authorized = $true
        $devId = ($deviceLine -split '\s+')[0]
        break
    }
    elseif ($unauthorizedLine) {
        $deviceFound = $true
        if ($attempt -eq 0) {
            Write-Host ""
            Write-Host "==============================================================" -ForegroundColor Yellow
            Write-Host "[!] GALAXY TAB A DETECTED - WAITING FOR USB AUTHORIZATION" -ForegroundColor Red
            Write-Host "==============================================================" -ForegroundColor Yellow
            Write-Host "LOOK AT YOUR GALAXY TAB A SCREEN RIGHT NOW!" -ForegroundColor White
            Write-Host "A prompt is showing: 'Allow USB debugging?'" -ForegroundColor Cyan
            Write-Host "  1. Check the box: [x] Always allow from this computer" -ForegroundColor Green
            Write-Host "  2. Tap: [OK] or [Allow]" -ForegroundColor Green
            Write-Host "--------------------------------------------------------------" -ForegroundColor Yellow
            Write-Host -NoNewline "[*] Waiting for you to tap Allow on tablet screen" -ForegroundColor Yellow
        }
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $attempt++
    }
    else {
        break
    }
}
Write-Host ""

if ($authorized) {
    Write-Host "[+] Galaxy Tab A authorized successfully! (Device ID: $devId)" -ForegroundColor Green
    Write-Host "[*] Establishing USB Reverse Port Bridge (tcp:8085 -> tcp:8085)..." -ForegroundColor Cyan
    & $adb reverse tcp:8085 tcp:8085
    Write-Host "[+] Port 8085 bridged over USB! 'http://localhost:8085' is now active on tablet!" -ForegroundColor Green

    # Verify server is listening
    $serverRunning = $false
    try {
        $tcp = Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue
        if ($tcp) { $serverRunning = $true }
    } catch {}

    if (-not $serverRunning) {
        Write-Host "[*] Akshay Server not detected on port 8085. Launching server..." -ForegroundColor Cyan
        $pyCandidates = @(
            (Join-Path $ScriptDir "server.py"),
            "D:\Akshay_Personal_AI\server.py",
            "C:\Users\abish\Documents\antigravity\quick-curie\Akshay-AI-Personal-Assistant\server.py"
        )
        $serverScript = $null
        foreach ($cand in $pyCandidates) {
            if (Test-Path $cand) {
                $serverScript = $cand
                break
            }
        }
        if ($serverScript) {
            Start-Process python -ArgumentList "`"$serverScript`"" -WindowStyle Minimized
            Start-Sleep -Seconds 2
        }
    }

    # Dynamically detect current local IPv4
    $localIp = "192.168.0.107"
    try {
        $ipObj = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1
        if ($ipObj) { $localIp = $ipObj.IPAddress }
    } catch {}

    # Push latest UI directly to tablet storage
    $htmlCandidates = @(
        (Join-Path $ScriptDir "index.html"),
        "D:\Akshay_Personal_AI\index.html",
        "C:\Users\abish\Documents\antigravity\quick-curie\Akshay-AI-Personal-Assistant\index.html"
    )
    foreach ($cand in $htmlCandidates) {
        if (Test-Path $cand) {
            & $adb shell "mkdir -p /sdcard/Download/Akshay_AI" 2>$null
            & $adb push $cand /sdcard/Download/Akshay_AI/index.html 2>$null
            Write-Host "[+] Synchronized latest UI directly to tablet storage (/sdcard/Download/Akshay_AI/index.html)" -ForegroundColor Green
            break
        }
    }

    Write-Host "[*] Opening Akshay directly on your Galaxy Tab A screen..." -ForegroundColor Cyan
    & $adb shell am start -a android.intent.action.VIEW -d "http://localhost:8085"
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Akshay is now live and running on your Galaxy Tab A!" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "Connection Options for Galaxy Tab A:" -ForegroundColor White
    Write-Host "  1. Direct USB Cable   : http://localhost:8085" -ForegroundColor Cyan
    Write-Host "  2. Wi-Fi Local Network: http://$($localIp):8085" -ForegroundColor Yellow
    Write-Host "  3. Global Cloud Tunnel: https://taste-double-exchanges-decisions.trycloudflare.com" -ForegroundColor Green
    Write-Host "  4. 100% Offline File  : file:///sdcard/Download/Akshay_AI/index.html" -ForegroundColor Gray
    Write-Host "==============================================================" -ForegroundColor Green
    exit 0
}
elseif ($deviceFound -and -not $authorized) {
    $localIp = "192.168.0.107"
    try {
        $ipObj = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1
        if ($ipObj) { $localIp = $ipObj.IPAddress }
    } catch {}

    Write-Host ""
    Write-Host "[!] Galaxy Tab A was detected but not authorized in time." -ForegroundColor Yellow
    Write-Host "Unlock your tablet, accept the 'Allow USB debugging' popup, and run this file again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative Options (No USB Debugging needed):" -ForegroundColor White
    Write-Host "  * Wi-Fi Address : http://$($localIp):8085" -ForegroundColor Yellow
    Write-Host "  * Cloud Tunnel  : https://taste-double-exchanges-decisions.trycloudflare.com" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Cyan
    exit 1
}
else {
    $localIp = "192.168.0.107"
    try {
        $ipObj = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1
        if ($ipObj) { $localIp = $ipObj.IPAddress }
    } catch {}

    Write-Host "[!] No Galaxy Tab A detected in USB Debugging mode." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "--------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "HOW TO RUN AKSHAY ON YOUR GALAXY TAB A:" -ForegroundColor Cyan
    Write-Host "--------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "METHOD 1: INSTANT WI-FI (NO CABLE REQUIRED):" -ForegroundColor Green
    Write-Host "  1. On your Galaxy Tab A, open Chrome or Samsung Internet."
    Write-Host "  2. Type this into the address bar:"
    Write-Host "     http://$($localIp):8085" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "METHOD 2: CLOUD TUNNEL (WORKS OVER ANY WI-FI OR MOBILE DATA):" -ForegroundColor Green
    Write-Host "  Type: https://taste-double-exchanges-decisions.trycloudflare.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "METHOD 3: DIRECT USB HIGH-SPEED CABLE:" -ForegroundColor Green
    Write-Host "  1. On your Galaxy Tab A: Settings -> About tablet -> Software information."
    Write-Host "  2. Tap 'Build number' 7 times until Developer options is enabled."
    Write-Host "  3. Go to: Settings -> Developer options -> Turn ON 'USB debugging'."
    Write-Host "  4. Plug USB cable in and run this script again."
    Write-Host "==============================================================" -ForegroundColor Cyan
    exit 1
}
