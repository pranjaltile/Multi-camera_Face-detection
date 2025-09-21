#!/bin/bash
echo "🚀 Setting up Skylark development environment..."

# Update system
sudo apt-get update

# Install OpenCV dependencies
echo "📦 Installing OpenCV..."
sudo apt-get install -y \
    libopencv-dev \
    pkg-config \
    libgtk-3-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev

# Install Node.js dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Setting up Go worker..."
cd worker
go mod init skylark-worker
go get gocv.io/x/gocv

echo "📥 Downloading face detection model..."
mkdir -p models
curl -L -o models/haarcascade_frontalface_alt.xml \
  "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_alt.xml"

cd ..
echo "✅ Setup complete! Ready to code!"