#!/bin/bash

echo "========================================"
echo "Cleaning up frontend project..."
echo "========================================"
echo ""

echo "[1/4] Removing .next build cache..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "✓ Removed .next/"
else
    echo "- .next/ not found"
fi

echo ""
echo "[2/4] Removing .turbo cache..."
if [ -d ".turbo" ]; then
    rm -rf .turbo
    echo "✓ Removed .turbo/"
else
    echo "- .turbo/ not found"
fi

echo ""
echo "[3/4] Removing .swc cache..."
if [ -d ".swc" ]; then
    rm -rf .swc
    echo "✓ Removed .swc/"
else
    echo "- .swc/ not found"
fi

echo ""
echo "[4/4] Removing TypeScript build info files..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null
echo "✓ Cleaned TypeScript build info files"

echo ""
echo "========================================"
echo "Cleanup completed!"
echo "========================================"
echo ""
echo "Note: node_modules/ was NOT removed."
echo "If you want to remove it, run: rm -rf node_modules"
echo "Then reinstall with: npm install"
echo ""

