#!/bin/bash

# Start Backend Script
# =====================

set -e

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
if ! python -c "import uvicorn" 2>/dev/null; then
    echo "Installing backend dependencies..."
    pip install -q -r backend/requirements.txt
fi

# Start backend
echo "Starting backend server on http://localhost:8000..."
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000


