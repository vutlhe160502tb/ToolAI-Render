#!/bin/bash

echo "========================================"
echo "Cleaning up entire project..."
echo "========================================"
echo ""

echo "[1/3] Cleaning frontend..."
cd frontend
if [ -f "cleanup.sh" ]; then
    bash cleanup.sh
else
    echo "- Frontend cleanup script not found"
fi
cd ..

echo ""
echo "[2/3] Cleaning backend..."
cd backend
if [ -d "__pycache__" ]; then
    find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null
    echo "✓ Removed __pycache__/"
fi
if [ -n "$(find . -name '*.pyc' 2>/dev/null)" ]; then
    find . -name "*.pyc" -delete
    echo "✓ Removed .pyc files"
fi
if [ -d ".pytest_cache" ]; then
    rm -rf .pytest_cache
    echo "✓ Removed .pytest_cache/"
fi
cd ..

echo ""
echo "[3/3] Checking for other cache files..."
find . -name ".DS_Store" -delete 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✓ Cleaned .DS_Store files"
fi

echo ""
echo "========================================"
echo "Project cleanup completed!"
echo "========================================"
echo ""
echo "Note: node_modules/ and .next/ were cleaned."
echo "Run 'npm install' in frontend/ to reinstall dependencies."
echo ""

