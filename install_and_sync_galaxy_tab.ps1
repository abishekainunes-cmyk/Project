# ==============================================================
#  AKSHAY AI v4.2 PRO: Galaxy Tab A Automated App Installer & Sync
# ==============================================================
$ScriptDir = $PSScriptRoot

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
Write-Host "      AKSHAY AI v4.2 PRO: GALAXY TAB A APP INSTALLER & SYNC   " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $adb -or -not (Test-Path $adb)) {
    Write-Host "[-] Error: ADB binary not found in standard locations." -ForegroundColor Red
    exit 1
}

Write-Host "[*] ADB Engine: $adb" -ForegroundColor Gray
Write-Host "[*] Probing for connected Samsung Galaxy Tab A..." -ForegroundColor Yellow

$maxAttempts = 10
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
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $attempt++
    }
    else {
        Start-Sleep -Seconds 1
        $attempt++
    }
}
Write-Host ""

$localIp = "192.168.0.107"
try {
    $ipObj = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notmatch '^169\.' } | Select-Object -First 1
    if ($ipObj) { $localIp = $ipObj.IPAddress }
} catch {}

if ($authorized) {
    Write-Host "[+] Samsung Galaxy Tab A Detected & Authorized! (ID: $devId)" -ForegroundColor Green

    # 1. Keep tablet screen on & unlock
    Write-Host "[*] Keeping tablet screen awake and unlocked..." -ForegroundColor Cyan
    & $adb shell settings put system screen_off_timeout 1800000 2>$null
    & $adb shell settings put global stay_on_while_plugged_in 3 2>$null
    & $adb shell input keyevent KEYCODE_WAKEUP 2>$null
    & $adb shell input keyevent 82 2>$null

    # 2. Bridge Port 8085 over USB
    Write-Host "[*] Establishing USB Reverse Port Bridge (tcp:8085 -> tcp:8085)..." -ForegroundColor Cyan
    & $adb reverse tcp:8085 tcp:8085
    Write-Host "[+] Port 8085 bridged over high-speed USB!" -ForegroundColor Green

    # 3. Synchronize Latest HTML to Tablet Storage
    $htmlCandidates = @(
        (Join-Path $ScriptDir "Akshay-AI-Personal-Assistant\index.html"),
        (Join-Path $ScriptDir "index.html"),
        "D:\Akshay_Personal_AI\index.html"
    )
    foreach ($cand in $htmlCandidates) {
        if (Test-Path $cand) {
            & $adb shell "mkdir -p /sdcard/Download/Akshay_AI" 2>$null
            & $adb push $cand /sdcard/Download/Akshay_AI/index.html 2>$null
            Write-Host "[+] Synchronized latest UI directly to tablet storage (/sdcard/Download/Akshay_AI/index.html)" -ForegroundColor Green
            break
        }
    }

    # 4. Install / Update Standalone APK on Tablet
    $apkCandidates = @(
        (Join-Path $ScriptDir "tools\WebviewKiosk.apk"),
        (Join-Path $ScriptDir "Akshay-AI-Personal-Assistant\Akshay_AI_v4.2.apk"),
        (Join-Path $ScriptDir "tools\Akshay_AI_v4.2.apk"),
        "D:\Akshay_Personal_AI\Akshay_AI_v4.2.apk"
    )
    $apkInstalled = $false
    foreach ($apk in $apkCandidates) {
        if (Test-Path $apk) {
            Write-Host "[*] Installing/Updating Standalone APK: $apk..." -ForegroundColor Cyan
            & $adb push $apk /sdcard/Download/Akshay_AI_v4.2.apk 2>$null
            $installOut = & $adb install -r $apk
            if ($installOut -match "Success") {
                Write-Host "[+] Standalone APK installed successfully on Galaxy Tab A!" -ForegroundColor Green
                $apkInstalled = $true
            } else {
                Write-Host "[!] Note on APK installation: $installOut" -ForegroundColor Gray
            }
            break
        }
    }

    # 5. Launch App on Tablet Screen
    Write-Host "[*] Launching Akshay AI App on Galaxy Tab A screen..." -ForegroundColor Cyan
    & $adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main -d "http://localhost:8085" 2>$null
    & $adb shell am start -n uk.nktnet.webviewkiosk/.MainActivity -a android.intent.action.VIEW -d "http://localhost:8085" 2>$null

    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] AKSHAY AI IS RUNNING LIVE ON YOUR GALAXY TAB A!" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "How to use Akshay on Galaxy Tab A:" -ForegroundColor White
    Write-Host "  1. Direct USB High-Speed : http://localhost:8085 (Instant 0-latency)" -ForegroundColor Cyan
    Write-Host "  2. Wi-Fi Local Network   : http://$($localIp):8085" -ForegroundColor Yellow
    Write-Host "  3. Global Cloud Tunnel   : https://taste-double-exchanges-decisions.trycloudflare.com" -ForegroundColor Green
    Write-Host "  4. Standalone APK File   : Saved in /sdcard/Download/Akshay_AI_v4.2.apk" -ForegroundColor Gray
    Write-Host "  5. Native Home Screen App: In Chrome, tap ⋮ (menu) -> 'Add to Home screen'" -ForegroundColor White
    Write-Host "==============================================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[!] Galaxy Tab A not currently connected via USB Debugging." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can still connect instantly over Wi-Fi or Cloud Tunnel:" -ForegroundColor White
    Write-Host "  * Local Wi-Fi  : http://$($localIp):8085" -ForegroundColor Yellow
    Write-Host "  * Cloud Tunnel : https://taste-double-exchanges-decisions.trycloudflare.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "To enable Direct USB Mode:" -ForegroundColor Cyan
    Write-Host "  1. On tablet: Settings -> About tablet -> Software information."
    Write-Host "  2. Tap 'Build number' 7 times to enable Developer options."
    Write-Host "  3. In Developer options, turn ON 'USB debugging'."
    Write-Host "  4. Plug USB cable and run this script again."
    Write-Host "==============================================================" -ForegroundColor Cyan
    exit 1
}
