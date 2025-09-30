@echo off
REM Build Script for Din.Docs Installer
REM This script compiles the Inno Setup installer

setlocal enabledelayedexpansion

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

REM Check for auto-sign parameter
set AUTO_SIGN=false
if /i "%1"=="--sign" set AUTO_SIGN=true
if /i "%1"=="-s" set AUTO_SIGN=true

REM Sign the main executable before building installer (if signing enabled)
if "!AUTO_SIGN!"=="true" (
    echo *** CODE SIGNING: Din.Docs.exe ***
    echo.
    if exist "..\dist_electron\win-unpacked\Din.Docs.exe" (
        if exist "..\sign\sign_file.bat" (
            echo Signing Din.Docs.exe before building installer...
            call "..\sign\sign_file.bat" "..\dist_electron\win-unpacked\Din.Docs.exe"
            if errorlevel 1 (
                echo WARNING: Failed to sign Din.Docs.exe
                echo The installer will be built anyway, but the main executable won't be signed
                echo.
            ) else (
                echo [OK] Din.Docs.exe signed successfully!
                echo.
            )
        ) else (
            echo WARNING: Code signing script not found at ..\sign\sign_file.bat
            echo.
        )
    ) else (
        echo WARNING: Din.Docs.exe not found at ..\dist_electron\win-unpacked\Din.Docs.exe
        echo.
    )
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
    
    REM Code signing logic for installer
    if "!AUTO_SIGN!"=="true" (
        echo.
        echo *** CODE SIGNING: Installer ***
        echo.
        if exist "..\sign\sign_file.bat" (
            echo Signing installer...
            call "..\sign\sign_file.bat" "..\dist_installer\Din.Docs-Setup-1.0.0.exe"
            echo.
            echo [OK] Code signing process completed
        ) else (
            echo WARNING: Code signing script not found
        )
        echo.
    ) else (
        echo.
        echo Code signing not requested - use --sign parameter to enable
        echo.
    )
    
    echo You can now distribute this installer file.
    echo.
)