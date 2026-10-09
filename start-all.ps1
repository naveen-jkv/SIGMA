# AQUASENSE - All-In-One Server & Mobile Launcher
# Powershell Script

$Host.UI.RawUI.WindowTitle = "AQUASENSE - All-In-One Launcher"
Clear-Host

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   AQUASENSE - FULL SYSTEM LAUNCHER" -ForegroundColor Cyan
Write-Host "   AI-Powered Water-Borne Disease Outbreak Early Warning System" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect LAN IP Address
Write-Host "[*] Detecting Local Network (LAN) IPv4 Address..." -ForegroundColor Yellow
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and 
    $_.InterfaceAlias -notlike "*vEthernet*" -and 
    $_.InterfaceAlias -notlike "*Loopback*" 
} | Select-Object -ExpandProperty IPAddress -First 1)

if (-not $localIp) {
    $localIp = "127.0.0.1"
    Write-Host "[!] Could not detect LAN IP. Falling back to localhost ($localIp)." -ForegroundColor Red
} else {
    Write-Host "[+] Detected Local Machine IP: $localIp" -ForegroundColor Green
}

# 2. Update aquasense-mobile/.env
Write-Host "[*] Updating aquasense-mobile\.env with server IP..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot "aquasense-mobile\.env"
Set-Content -Path $envFile -Value "EXPO_PUBLIC_API_URL=http://${localIp}:5000/api`n"
Write-Host "[+] Saved EXPO_PUBLIC_API_URL=http://${localIp}:5000/api" -ForegroundColor Green

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  ONLINE SERVICES AND ENDPOINTS:" -ForegroundColor White
Write-Host "  - Backend API:          http://localhost:5000  (LAN: http://${localIp}:5000)" -ForegroundColor Gray
Write-Host "  - AI Risk Engine:       http://localhost:8000  (FastAPI Docs: /docs)" -ForegroundColor Gray
Write-Host "  - Web Dashboard:        http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "  EXPO GO CONNECTION:" -ForegroundColor Magenta
Write-Host "  - Expo Metro Bundler:   http://${localIp}:8081" -ForegroundColor Gray
Write-Host "  - Expo Go Manual URL:   exp://${localIp}:8081" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 3. Launch Backend, AI Analytics, and Web Frontend in a separate window
Write-Host "[*] Starting Backend, AI Engine, and Web Frontend in companion window..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm run fullstack"

# 4. Small delay
Start-Sleep -Seconds 3

# 5. Launch Expo in the current window with QR code for Expo Go
Write-Host ""
Write-Host "[*] Launching Expo for Mobile App in this window..." -ForegroundColor Yellow
Write-Host "[!] Scan the QR code below using Expo Go on Android or Camera app on iOS:" -ForegroundColor Magenta
Write-Host ""

Set-Location (Join-Path $PSScriptRoot "aquasense-mobile")
npx expo start
