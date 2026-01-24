@echo off
echo ========================================
echo Cleaning up frontend project...
echo ========================================

echo.
echo [1/4] Removing .next build cache...
if exist .next (
    rmdir /s /q .next
    echo ✓ Removed .next/
) else (
    echo - .next/ not found
)

echo.
echo [2/4] Removing .turbo cache...
if exist .turbo (
    rmdir /s /q .turbo
    echo ✓ Removed .turbo/
) else (
    echo - .turbo/ not found
)

echo.
echo [3/4] Removing .swc cache...
if exist .swc (
    rmdir /s /q .swc
    echo ✓ Removed .swc/
) else (
    echo - .swc/ not found
)

echo.
echo [4/4] Removing TypeScript build info files...
for /r %%f in (*.tsbuildinfo) do del /q "%%f" 2>nul
echo ✓ Cleaned TypeScript build info files

echo.
echo ========================================
echo Cleanup completed!
echo ========================================
echo.
echo Note: node_modules/ was NOT removed.
echo If you want to remove it, run: rmdir /s /q node_modules
echo Then reinstall with: npm install
echo.

