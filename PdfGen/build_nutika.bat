@echo off
REM Run this file from: C:\din.docs\v2\PdfGen
setlocal enabledelayedexpansion

echo.
echo Starting Nuitka build with correct dependencies...
echo.
echo *** IMPORTANT ***
echo If Windows Defender shows warnings during build, you can safely ignore them.
echo Nuitka creates new executable files which may trigger false positives.
echo Consider adding an exclusion for this directory in Windows Defender.
echo.

REM --- Settings ---
set APP_NAME=PdfGen
set SCRIPT_PATH=.\PdfGen.py
set OUT_DIR=..\srv

REM --- Create srv directory if it doesn't exist ---
if not exist "%OUT_DIR%" (
  echo Creating srv directory...
  mkdir "%OUT_DIR%"
)

REM --- Clean previous executable if exists ---
if exist "%OUT_DIR%\%APP_NAME%.exe" (
  echo Removing existing PdfGen.exe...
  del "%OUT_DIR%\%APP_NAME%.exe"
)

nuitka --standalone ^
  --mingw64 ^
  --lto=yes ^
  --windows-console-mode=disable ^
  --assume-yes-for-downloads ^
  --remove-output ^
  --follow-imports ^
  --no-prefer-source-code ^
  --windows-company-name="din-online.co.il" ^
  --windows-product-name="Din.Docs" ^
  --windows-file-version="1.0.0.0" ^
  --windows-product-version="1.0.0.0" ^
  --windows-file-description="Din.Docs - Legal Documents Generator" ^
  --windows-icon-from-ico=".\favicon.ico" ^
  --include-data-dir=".\fonts"="fonts" ^
  --include-data-dir=".\assets"="assets" ^
  --output-filename="%APP_NAME%" ^
  "%SCRIPT_PATH%"

echo Build completed!

if errorlevel 1 (
  echo [ERROR] Nuitka build failed.
  exit /b 1
) else (
  echo [SUCCESS] Nuitka build completed successfully.
)

echo.
echo Final output directory: "%OUT_DIR%\"
echo Main executable: "%OUT_DIR%\%APP_NAME%.exe"
echo.
