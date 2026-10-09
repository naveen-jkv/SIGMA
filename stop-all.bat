@echo off
title AQUASENSE - Stop All Services
echo ========================================================
echo   Stopping AQUASENSE Servers (Node, Python, Vite, Metro)
echo ========================================================
echo.

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000,8000,3000,8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo [+] All AQUASENSE server processes on ports 5000, 8000, 3000, and 8081 stopped.
pause
