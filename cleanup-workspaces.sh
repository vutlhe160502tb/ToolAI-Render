#!/usr/bin/env bash
set -euo pipefail

echo "[cleanup] Removing workspace caches and duplicate node_modules..."

rm -rf "frontend/.next" "frontend/.turbo" "frontend/.swc" "frontend/node_modules"
rm -rf "landing/.next" "landing/.turbo" "landing/.swc" "landing/node_modules"

echo "[cleanup] Done."
echo "[cleanup] Next step: run 'npm install' at repo root."

