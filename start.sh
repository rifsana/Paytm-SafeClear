#!/bin/bash
# Paytm ClearMoment — Start Script (macOS / Linux)
# Track 2: AI-Powered Financial Journeys

set -e
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Paytm ClearMoment..."

# Check / create backend virtual environment
if [ ! -d "$ROOT_DIR/backend/.venv" ]; then
    echo "📦 Creating backend virtual environment..."
    python3 -m venv "$ROOT_DIR/backend/.venv"
    "$ROOT_DIR/backend/.venv/bin/pip" install -r "$ROOT_DIR/backend/requirements.txt"
fi

# Check frontend node_modules
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd "$ROOT_DIR/frontend" && npm install
fi

# Start Backend
echo "⚙️ Starting FastAPI Backend on http://localhost:8000"
(cd "$ROOT_DIR/backend" && .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

# Start Frontend
echo "🖥️ Starting Vite Frontend on http://localhost:5173"
(cd "$ROOT_DIR/frontend" && npx vite --host 0.0.0.0 --port 5173) &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are running!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""

cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
