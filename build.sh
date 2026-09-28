#!/usr/bin/env bash
# exit on error
set -o errexit

echo "=== BUILDING FRONTEND ==="
cd frontend
npm install
npm run build
cd ..

echo "=== BUILDING BACKEND ==="
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
fi
