#!/bin/bash

# Heart Disease Prediction System - Development Startup Script
# =============================================================

set -e

echo "=========================================="
echo "Starting Heart Disease Prediction System"
echo "=========================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -q -r backend/requirements.txt

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend in background
echo "Starting backend server on http://localhost:8000..."
cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on http://localhost:5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✅ System started successfully!"
echo "=========================================="
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait


