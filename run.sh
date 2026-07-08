#!/usr/bin/env bash
set -e

echo "Installing server dependencies..."
cd server && npm install --no-audit --no-fund

echo "Installing client dependencies..."
cd ../client && npm install --no-audit --no-fund

echo "Building client..."
npm run build

echo "Starting server..."
cd ../server && node index.js
