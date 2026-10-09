@echo off
setlocal enabledelayedexpansion
title AQUASENSE - All-In-One Launcher
cls

echo ======================================================================
echo    AQUASENSE - FULL SYSTEM LAUNCHER
echo    AI-Powered Water-Borne Disease Outbreak Early Warning System
echo ======================================================================
echo.

:: 1. Detect LAN IP Address using PowerShell
echo [*] Detecting Local Network (LAN) IPv4 Address...
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notlike '*vEthernet*' -and $_.InterfaceAlias -notlike '*Loopback*' } | Select-Object -ExpandProperty IPAddress -First 1)"') do set LOCAL_IP=%%i

if "%LOCAL_IP%"=="" (
    set LOCAL_IP=127.0.0.1
    echo [!] Could not detect LAN IP. Falling back to localhost (%LOCAL_IP%).
) else (
    echo [+] Detected Local Machine IP: %LOCAL_IP%
)

:: 2. Auto-configure Mobile .env with the detected IP
echo [*] Updating aquasense-mobile\.env with server IP...
(
    echo EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:5000/api
) > aquasense-mobile\.env
echo [+] Saved EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:5000/api

echo.
echo ======================================================================
echo   ONLINE SERVICES AND ENDPOINTS:
echo   - Backend API:          http://localhost:5000  (LAN: http://%LOCAL_IP%:5000)
echo   - AI Risk Engine:       http://localhost:8000  (FastAPI Docs: /docs)
echo   - Web Dashboard:        http://localhost:3000
echo.
echo   EXPO GO CONNECTION:
echo   - Expo Metro Bundler:   http://%LOCAL_IP%:8081
echo   - Expo Go Manual URL:   exp://%LOCAL_IP%:8081
echo ======================================================================
echo.

:: 3. Launch Backend, AI Engine, and Web Dashboard in a separate window
echo [*] Starting Backend, AI Analytics Engine, and Web Frontend...
start "AQUASENSE Servers (Backend + AI + Web)" cmd /k "title AQUASENSE Servers && npm run fullstack"

:: 4. Small delay to allow backend to initialize
timeout /t 3 /nobreak > nul

:: 5. Launch Expo in the current window with QR code for Expo Go
echo.
echo [*] Launching Expo for Mobile App in this window...
echo [!] Scan the QR code below using Expo Go on Android or Camera app on iOS:
echo.

cd aquasense-mobile
npx expo start
