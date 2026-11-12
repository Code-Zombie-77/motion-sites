@echo off
title Build new AI Studio sites
cd /d "%~dp0"
node "_launcher\build-new.mjs" %*
echo.
echo Done. Press any key to close.
pause >nul
