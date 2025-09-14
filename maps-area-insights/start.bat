@echo off
echo Starting Maps Area Insights Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version: 
node --version
echo.

REM Start backend server
echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend development server
echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "cd /d frontend && npm start"

echo.
echo ================================================
echo Maps Area Insights Application Started!
echo ================================================
echo.
echo Backend Server: http://localhost:3001
echo Frontend App:   http://localhost:3000
echo.
echo The application will open automatically in your browser.
echo.
echo To stop the servers, close the terminal windows or press Ctrl+C
echo.
pause
