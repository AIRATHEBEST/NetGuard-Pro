@echo off
REM NetGuardPro Development Startup Script for Windows

echo.
echo ========================================
echo NetGuardPro - Development Server
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please download and install from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please download and install from: https://git-scm.com/
    pause
    exit /b 1
)

echo ✓ Node.js found: 
node --version

echo ✓ Git found: 
git --version

echo.
echo Installing pnpm globally...
npm install -g pnpm

echo.
echo Installing project dependencies...
call pnpm install

if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Pushing database migrations...
call pnpm db:push

if errorlevel 1 (
    echo WARNING: Database migration may have failed
    echo Make sure MySQL is running and .env.local is configured
    echo.
)

echo.
echo ========================================
echo Starting development server...
echo ========================================
echo.
echo Server will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call pnpm dev

pause
