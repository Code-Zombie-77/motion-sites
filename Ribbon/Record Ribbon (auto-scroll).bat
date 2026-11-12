@echo off
REM Recording mode: page scrolls by itself (2 s hold, 20 s scroll, then the grid). Press F11 for fullscreen, start your screen recorder, then press R in the page to restart the run.
cd /d "%~dp0"
start "Ribbon server" /min python -m http.server 8765 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html?auto=20"
echo Aufnahme-Modus: F11 = Vollbild, Recorder starten, dann R druecken (startet den Lauf neu).
