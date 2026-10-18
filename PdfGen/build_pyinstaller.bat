@echo off
REM Build PdfGen.exe using PyInstaller inside a clean virtual environment
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
set VENV_DIR=.\build_venv

REM --- Ensure output dir ---
if not exist "%OUT_DIR%" (
  mkdir "%OUT_DIR%"
)

REM --- Create clean virtual environment ---
echo.
echo Creating clean virtual environment at %VENV_DIR%...
if exist "%VENV_DIR%" (
  echo Removing existing venv...
  rmdir /S /Q "%VENV_DIR%"
)
python -m venv "%VENV_DIR%"
if errorlevel 1 (
  echo [ERROR] Failed to create virtual environment. Is Python installed?
  exit /b 1
)

REM --- Install dependencies into venv ---
echo.
echo Installing dependencies...
"%VENV_DIR%\Scripts\python" -m pip install --upgrade pip --quiet
"%VENV_DIR%\Scripts\pip" install -r requirements.txt pyinstaller --quiet
if errorlevel 1 (
  echo [ERROR] Failed to install dependencies.
  exit /b 1
)
echo [OK] Dependencies installed.

REM --- Run PyInstaller from within venv ---
echo.
echo Running PyInstaller...
"%VENV_DIR%\Scripts\pyinstaller" --noconfirm --windowed --name "%APP_NAME%" --icon "%ICON_PATH%" ^
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

REM --- Delete venv ---
if exist "%VENV_DIR%" (
  echo Removing build venv...
  rmdir /S /Q "%VENV_DIR%"
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
