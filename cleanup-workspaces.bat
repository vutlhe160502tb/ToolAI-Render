@echo off
setlocal

echo [cleanup] Removing workspace caches and duplicate node_modules...

REM Frontend caches
if exist "frontend\.next" rmdir /s /q "frontend\.next"
if exist "frontend\.turbo" rmdir /s /q "frontend\.turbo"
if exist "frontend\.swc" rmdir /s /q "frontend\.swc"
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules"

REM Landing caches
if exist "landing\.next" rmdir /s /q "landing\.next"
if exist "landing\.turbo" rmdir /s /q "landing\.turbo"
if exist "landing\.swc" rmdir /s /q "landing\.swc"
if exist "landing\node_modules" rmdir /s /q "landing\node_modules"

echo [cleanup] Done.
echo [cleanup] Next step: run `npm install` at repo root.
endlocal

