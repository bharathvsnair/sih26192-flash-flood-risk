@echo off
title SIH26192 Flash Flood Prediction System

cd /d "%~dp0"

echo ==========================================
echo   SIH26192 Flash Flood Prediction System
echo ==========================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    py -m venv .venv
)

echo.
echo Installing/checking dependencies...
".venv\Scripts\python.exe" -m pip install -r requirements.txt

echo.
echo Starting the application...
start "" http://127.0.0.1:5500

echo Starting frontend at http://127.0.0.1:5500 ...
start "SIH26192 Frontend" /b ".venv\Scripts\python.exe" -m http.server 5500 --directory frontend

".venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

pause