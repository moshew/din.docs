@echo off
REM Build PdfGen.exe using PyInstaller with relative paths
REM Run this file from: C:\din.docs\v2\PdfGen
setlocal enabledelayedexpansion

REM --- Settings (edit if needed) ---
set APP_NAME=PdfGen
set SCRIPT_PATH=.\PdfGen.py
set ICON_PATH=.\favicon.ico
set FONTS_DATA=.\fonts;fonts/
set ASSETS_DATA=.\assets;assets/
set OUT_DIR=..\srv
set WORK_DIR=.\build

REM --- Ensure output dir ---
if not exist "%OUT_DIR%" (
  mkdir "%OUT_DIR%"
)

REM --- Run PyInstaller ---
echo Running PyInstaller...
pyinstaller --noconfirm --windowed --name "%APP_NAME%" --icon "%ICON_PATH%" ^
  --distpath "%OUT_DIR%" --workpath "%WORK_DIR%" ^
  --add-data "%FONTS_DATA%" ^
  --add-data "%ASSETS_DATA%" ^
  "%SCRIPT_PATH%"
if errorlevel 1 (
  echo [ERROR] PyInstaller build failed.
  exit /b 1
)

REM --- Flatten OUT_DIR (remove the extra subfolder) ---
set APP_DIR=%OUT_DIR%\%APP_NAME%
if exist "%APP_DIR%" (
  echo Flattening output: moving contents of "%APP_DIR%" into "%OUT_DIR%" ...
  xcopy "%APP_DIR%\*" "%OUT_DIR%\" /E /I /H /Y >nul
  if errorlevel 1 (
    echo [ERROR] Failed copying files from "%APP_DIR%" to "%OUT_DIR%".
    exit /b 1
  )
  rmdir /S /Q "%APP_DIR%"
)

REM --- Delete build/ directory ---
if exist "%WORK_DIR%" (
  echo Removing build directory...
  rmdir /S /Q "%WORK_DIR%"
)

REM --- Delete .spec file ---
if exist "%APP_NAME%.spec" (
    echo Removing spec file...
    del "%APP_NAME%.spec"
)

echo.
echo [OK] Build completed.
echo Output folder (flattened): "%OUT_DIR%"
echo.