#!/bin/bash

# Heart Disease Prediction System - Installation Script
# ======================================================

set -e

echo "=========================================="
echo "Installing Heart Disease Prediction System"
echo "=========================================="

# Check Python version
echo "Checking Python version..."
python3 --version

# Check Node.js version
echo "Checking Node.js version..."
node --version

# Create virtual environment
echo ""
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "=========================================="
echo "✅ Installation complete!"
echo "=========================================="
echo ""
echo "To start the application:"
echo "  ./start.sh              # Development mode"
echo "  ./start-docker.sh       # Docker mode"
echo ""
echo "To activate the virtual environment manually:"
echo "  source venv/bin/activate"
echo ""
echo "=========================================="



