#!/bin/bash

echo "Starting Maps Area Insights Application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo ""

# Function to start backend
start_backend() {
    echo "Starting Backend Server..."
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend  
start_frontend() {
    echo "Starting Frontend Development Server..."
    sleep 3  # Wait for backend to start
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start servers
start_backend
start_frontend

echo ""
echo "================================================"
echo "Maps Area Insights Application Started!"
echo "================================================"
echo ""
echo "Backend Server: http://localhost:3001"
echo "Frontend App:   http://localhost:3000"
echo ""
echo "The application will open automatically in your browser."
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
wait
