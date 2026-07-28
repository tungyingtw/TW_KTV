@echo off
title KTV Server Launcher
cd /d "%~dp0"

echo ====================================================
echo  Starting KTV Server...
echo ====================================================
echo.

node scripts/launch_tunnel.js

pause
