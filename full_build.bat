@echo off
REM Full Build Script for Din.Docs
REM This script performs a complete build process including cleanup, PdfGen build, web build, packaging, and installer creation

setlocal enabledelayedexpansion

echo ===============================================
echo           Din.Docs Full Build Process
echo ===============================================
echo.

REM Check for auto-sign parameter
set AUTO_SIGN=false
if /i "%1"=="--sign" set AUTO_SIGN=true
if /i "%1"=="-s" set AUTO_SIGN=true

if "!AUTO_SIGN!"=="true" (
    echo Auto-signing enabled via command line parameter
    set SIGN_CHOICE=y
) else (
    echo Code signing not requested - use --sign or -s parameter to enable
    set SIGN_CHOICE=n
)
echo.

REM --- Step 1: Clean up previous builds ---
echo [1/6] Cleaning up previous builds...
echo.

if exist "dist" (
    echo Removing dist directory...
    rmdir /S /Q "dist"
)

if exist "dist_electron" (
    echo Removing dist_electron directory...
    rmdir /S /Q "dist_electron"
)

if exist "dist_installer" (
    echo Removing dist_installer directory...
    rmdir /S /Q "dist_installer"
)

echo Cleanup completed.
echo.

REM --- Step 2: Build PdfGen ---
echo [2/6] Building PdfGen...
echo.

cd PdfGen
if errorlevel 1 (
    echo [ERROR] Failed to change directory to PdfGen.
    exit /b 1
)

if /i "!SIGN_CHOICE!"=="y" (
    call build_pdfgen.bat --sign
) else (
    call build_pdfgen.bat
)
if errorlevel 1 (
    echo [ERROR] PdfGen build failed.
    cd ..
    exit /b 1
)

cd ..
echo PdfGen build completed.
echo.

REM --- Step 3: Build web application ---
echo [3/6] Building web application...
echo.

call npm run build
if errorlevel 1 (
    echo [ERROR] Web application build failed.
    exit /b 1
)

echo Web application build completed.
echo.

REM --- Step 4: Package Electron application ---
echo [4/6] Packaging Electron application...
echo.

call npm run package
if errorlevel 1 (
    echo [ERROR] Electron packaging failed.
    exit /b 1
)

echo Electron packaging completed.
echo.

REM --- Step 5: Build installer ---
echo [5/6] Building installer...
echo.

cd setup
if errorlevel 1 (
    echo [ERROR] Failed to change directory to setup.
    exit /b 1
)

if /i "!SIGN_CHOICE!"=="y" (
    call build-installer.bat --sign
) else (
    call build-installer.bat
)
if errorlevel 1 (
    echo [ERROR] Installer build failed.
    cd ..
    exit /b 1
)

cd ..
echo Installer build completed.
echo.

echo.

REM --- Step 6: Final summary ---
echo [6/6] Build process completed successfully!
echo.
echo ===============================================
echo              Build Summary
echo ===============================================
echo.
echo ✓ PdfGen.exe built and placed in srv/
echo ✓ Web application built in dist/
echo ✓ Electron app packaged in dist_electron/
echo ✓ Installer created in dist_installer/
echo.
if /i "!SIGN_CHOICE!"=="y" (
    echo Code Signing Status:
    echo [OK] PdfGen.exe - Signed during build
    echo [OK] Din.Docs.exe - Signed before installer packaging
    echo [OK] Setup installer - Signed after creation
    echo.
    echo All executables are digitally signed and ready for distribution!
) else (
    echo Code Signing Status: SKIPPED
    echo To sign later, run: sign\sign_all.bat
    echo To auto-sign during build, use: full_build.bat --sign
    echo.
    echo The complete Din.Docs application is ready for distribution!
    echo Note: For production deployment, consider signing the executables.
)
echo.