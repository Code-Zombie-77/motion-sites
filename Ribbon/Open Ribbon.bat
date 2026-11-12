@echo off
REM Opens the Mind-Merit ribbon page in Chrome via a small local server (needed so the videos can be used as WebGL textures).
cd /d "%~dp0"
start "Ribbon server" /min python -m http.server 8765 --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/index.html"
echo Ribbon laeuft auf http://127.0.0.1:8765  -  dieses Fenster offen lassen. Zum Beenden das "Ribbon server" Fenster schliessen.
