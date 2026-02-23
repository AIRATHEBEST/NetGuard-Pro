#!/bin/bash

# NetGuardPro Development Startup Script for Mac/Linux

echo ""
echo "========================================"
echo "NetGuardPro - Development Server"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please download and install from: https://nodejs.org/"
    exit 1
fi

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "ERROR: Git is not installed!"
    echo "Please download and install from: https://git-scm.com/"
    exit 1
fi

echo "✓ Node.js found:"
node --version

echo "✓ Git found:"
git --version

echo ""
echo "Installing pnpm globally..."
npm install -g pnpm

echo ""
echo "Installing project dependencies..."
pnpm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies!"
    exit 1
fi

echo ""
echo "Pushing database migrations..."
pnpm db:push

if [ $? -ne 0 ]; then
    echo "WARNING: Database migration may have failed"
    echo "Make sure MySQL is running and .env.local is configured"
    echo ""
fi

echo ""
echo "========================================"
echo "Starting development server..."
echo "========================================"
echo ""
echo "Server will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

pnpm dev
