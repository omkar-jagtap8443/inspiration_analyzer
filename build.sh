#!/bin/bash
set -e

echo "Installing Node dependencies..."
npm install

echo "Building React frontend..."
npm run build

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Starting Flask server..."
python app.py
