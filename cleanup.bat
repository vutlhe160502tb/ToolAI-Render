@echo off
echo ========================================
echo Cleaning up entire project...
echo ========================================

echo.
echo [1/3] Cleaning frontend...
cd frontend
if exist cleanup.bat (
    call cleanup.bat
) else (
    echo - Frontend cleanup script not found
)
cd ..

echo.
echo [2/3] Cleaning backend...
cd backend
if exist __pycache__ (
    echo Removing Python cache...
    for /d /r %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
    echo ✓ Removed __pycache__/
)
if exist *.pyc (
    del /q *.pyc
    echo ✓ Removed .pyc files
)
if exist .pytest_cache (
    rmdir /s /q .pytest_cache
    echo ✓ Removed .pytest_cache/
)
cd ..

echo.
echo [3/3] Checking for other cache files...
if exist .DS_Store (
    del /q .DS_Store
    echo ✓ Removed .DS_Store
)

echo.
echo ========================================
echo Project cleanup completed!
echo ========================================
echo.
echo Note: node_modules/ and .next/ were cleaned.
echo Run 'npm install' in frontend/ to reinstall dependencies.
echo.

