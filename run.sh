#!/usr/bin/env bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "Starting SIH26192 Flash Flood Risk Prototype..."

# Activate virtual environment
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found."
    echo "Create it first with:"
    echo "python3 -m venv .venv"
    exit 1
fi

source .venv/bin/activate

# Start backend
echo "Starting FastAPI backend..."
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd frontend
python3 -m http.server 5500 &
FRONTEND_PID=$!

cd "$PROJECT_DIR"

# Give servers a moment to start
sleep 2

echo ""
echo "============================================"
echo " SIH26192 is running!"
echo "============================================"
echo " Dashboard : http://127.0.0.1:5500"
echo " API Docs  : http://127.0.0.1:8000/docs"
echo "============================================"
echo ""

# Open browser automatically on Linux
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://127.0.0.1:5500 >/dev/null 2>&1 &
fi

# Keep both processes alive
trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' EXIT

wait

