@echo off
REM Run this file from: C:\din.docs\v2\PdfGen
setlocal enabledelayedexpansion

echo.
echo Starting Nuitka build with correct dependencies...

REM --- Settings ---
set APP_NAME=PdfGen
set SCRIPT_PATH=.\PdfGen.py
set OUT_DIR=..\srv

REM --- Clean previous build ---
if exist "%OUT_DIR%\%APP_NAME%.exe" (
  echo Cleaning previous build from %OUT_DIR%...
  del /Q "%OUT_DIR%\*.exe" 2>nul
  del /Q "%OUT_DIR%\*.dll" 2>nul
  del /Q "%OUT_DIR%\*.pyd" 2>nul
)

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"

nuitka --standalone ^
  --windows-console-mode=disable ^
  --disable-console ^
  --assume-yes-for-downloads ^
  --remove-output ^
  --follow-imports ^
  --no-prefer-source-code ^
  --windows-company-name="din-onlime.co.il" ^
  --windows-product-name="Din.Docs" ^
  --windows-file-version="1.0.0" ^
  --windows-product-version="1.0.0" ^
  --windows-file-description="Din.Docs - Legal Documents Generator" ^
  --output-dir="%OUT_DIR%" ^
  --output-filename="%APP_NAME%.exe" ^
  --windows-icon-from-ico=".\favicon.ico" ^
  --include-data-dir=".\fonts"="fonts" ^
  --include-data-dir=".\assets"="assets" ^
  "%SCRIPT_PATH%"

if errorlevel 1 (
  echo [ERROR] Nuitka build failed.
  pause
  exit /b 1
)

REM --- Verify build success ---
if exist "%OUT_DIR%\%APP_NAME%.exe" (
  echo [SUCCESS] Build completed successfully!
  echo Output directory: %OUT_DIR%
  echo Executable: %APP_NAME%.exe
) else (
  echo [ERROR] Build failed - executable not found in %OUT_DIR%
  pause
  exit /b 1
)

echo.
echo Output: "%OUT_DIR%\%APP_NAME%.exe"
echo.
pause