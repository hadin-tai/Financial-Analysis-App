#!/bin/bash

echo "================================================================"
echo "   InsightEdge - Complete System Startup Script"
echo "================================================================"
echo ""

# Function to check if MongoDB is running
check_mongodb() {
    echo "[1/4] Checking MongoDB..."
    if mongosh --eval "db.runCommand({ping: 1})" >/dev/null 2>&1; then
        echo "✓ MongoDB is running"
    else
        echo "WARNING: MongoDB connection failed. Please start MongoDB first."
    fi
    echo ""
}

# Function to start Node.js Backend
start_backend() {
    echo "[2/4] Starting Node.js Backend (Port 5000)..."
    cd Backend
    npm run dev &
    echo $! > ../backend.pid
    cd ..
    sleep 3
    echo "✓ Node.js Backend started"
    echo ""
}

# Function to start FastAPI ML Backend
start_ml_backend() {
    echo "[3/4] Starting FastAPI ML Backend (Port 8000)..."
    cd "ML Model Backend"
    source venv/bin/activate 2>/dev/null || python3 -m venv venv && source venv/bin/activate
    pip install -r requirements.txt >/dev/null 2>&1
    uvicorn main:app --reload --port 8000 &
    echo $! > ../ml_backend.pid
    cd ..
    sleep 3
    echo "✓ FastAPI ML Backend started"
    echo ""
}

# Function to start React Frontend
start_frontend() {
    echo "[4/4] Starting React Frontend (Port 5173)..."
    cd frontend
    npm run dev &
    echo $! > ../frontend.pid
    cd ..
    echo "✓ React Frontend started"
    echo ""
}

# Main execution
check_mongodb
start_backend
start_ml_backend
start_frontend

echo "================================================================"
echo "   All services started!"
echo "================================================================"
echo ""
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:5000"
echo "ML Backend: http://localhost:8000"
echo "ML Docs:   http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
wait
