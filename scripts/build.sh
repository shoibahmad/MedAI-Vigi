#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting build process..."

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Generate synthetic data if it doesn't exist
echo "🔬 Generating synthetic data..."
python scripts/data_generator.py

# Train the model if it doesn't exist
echo "🧠 Training ML model..."
python scripts/model_trainer.py

# Build the React SPA that Flask serves from client/dist
echo "🎨 Building frontend..."
cd client
npm ci
npm run build
cd ..

echo "✅ Build completed successfully!"