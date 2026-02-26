#!/bin/bash
set -e  # Exit on error

echo "======================================"
echo "Building Inspiration Analyzer"
echo "======================================"
echo "Current directory: $(pwd)"
echo ""

echo "Step 1: Installing Node dependencies..."
if command -v npm &> /dev/null; then
    npm install --legacy-peer-deps
else
    echo "ERROR: npm not found!"
    exit 1
fi

echo ""
echo "Step 2: Building React frontend..."
if [ -f "package.json" ]; then
    npm run build
    if [ -d "dist" ]; then
        echo "✓ Frontend built successfully"
        ls -la dist/
    else
        echo "ERROR: dist folder not created!"
        exit 1
    fi
else
    echo "ERROR: package.json not found!"
    exit 1
fi

echo ""
echo "Step 3: Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    echo "ERROR: requirements.txt not found!"
    exit 1
fi

echo ""
echo "Step 4: Starting Flask server..."
echo "======================================"
python app.py

