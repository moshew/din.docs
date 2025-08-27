@echo off
REM Build Script for Din.Docs Installer
REM This script compiles the Inno Setup installer

echo ===============================================
echo           Din.Docs Installer Builder
echo ===============================================
echo.

REM Set Inno Setup path
set INNO_PATH="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"

REM Check if Inno Setup is installed
if not exist %INNO_PATH% (
    echo ERROR: Inno Setup Compiler not found at %INNO_PATH%!
    echo.
    echo Please install Inno Setup from: https://jrsoftware.org/isinfo.php
    echo Or modify this script to point to the correct installation directory.
    echo.
    echo Common installation paths:
    echo   "C:\Program Files ^(x86^)\Inno Setup 6\ISCC.exe"
    echo   "C:\Program Files\Inno Setup 6\ISCC.exe"
    echo.
    pause
    exit /b 1
)

REM Check if the dist_electron directory exists
if not exist "..\dist_electron\win-unpacked\" (
    echo ERROR: Application files not found!
    echo.
    echo Please make sure you have built the Electron application first:
    echo   npm run build
    echo   npm run package
    echo.
    echo The application files should be in: ..\dist_electron\win-unpacked
    echo.
    pause
    exit /b 1
)

REM Create output directory if it doesn't exist
if not exist "..\dist_installer\" (
    echo Creating output directory...
    mkdir "..\dist_installer"
)

echo Building installer...
echo.

REM Compile the installer
%INNO_PATH% "DinDocs-Setup.iss"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to build installer!
    echo Check the output above for error details.
    echo.
) else (
    echo.
    echo ===============================================
    echo        Installer built successfully!
    echo ===============================================
    echo.
    echo Output file: ..\dist_installer\Din.Docs-Setup-1.0.0.exe
    echo.
    echo You can now distribute this installer file.
    echo.
)

pause