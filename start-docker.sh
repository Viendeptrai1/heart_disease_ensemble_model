#!/bin/bash

# Heart Disease Prediction System - Docker Startup Script
# ========================================================

set -e

echo "=========================================="
echo "Starting Heart Disease Prediction System"
echo "via Docker Compose"
echo "=========================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose not found"
    echo "Please install docker-compose and try again"
    exit 1
fi

# Stop existing containers if any
echo "Stopping existing containers (if any)..."
docker-compose down 2>/dev/null || true

# Build and start services
echo ""
echo "Building and starting services..."
docker-compose up --build

echo ""
echo "=========================================="
echo "Services stopped"
echo "=========================================="


