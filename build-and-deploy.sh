#!/bin/bash

# Build and Deploy Script for Pixelparken
# This script builds the frontend and deploys everything to Google App Engine

set -e  # Exit on error

echo "🎨 Pixelparken Build & Deploy Script"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Build frontend
echo -e "\n${BLUE}[1/5]${NC} Building frontend..."
npm run build

# Step 2: Copy frontend build to backend
echo -e "\n${BLUE}[2/5]${NC} Copying frontend to backend/dist/public..."
rm -rf backend/dist/public
mkdir -p backend/dist/public
cp -r dist/* backend/dist/public/

# Step 3: Build backend
echo -e "\n${BLUE}[3/5]${NC} Building backend..."
cd backend
npm run build
cd ..

# Step 4: Copy app.yaml to backend/dist
echo -e "\n${BLUE}[4/5]${NC} Copying App Engine config..."
cp backend/app.yaml backend/dist/

# Step 5: Deploy to App Engine
echo -e "\n${BLUE}[5/5]${NC} Deploying to Google App Engine..."
cd backend/dist
gcloud app deploy --quiet

echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo "Your app should now be live at: https://pixelparken.appspot.com"
