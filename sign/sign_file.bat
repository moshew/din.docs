@echo off
REM File Signing Script for Din.Docs using SSL.com CodeSignTool
REM This script signs executables using SSL.com's cloud-based signing service

setlocal enabledelayedexpansion

echo ===============================================
echo           Din.Docs File Signing
echo ===============================================
echo.

REM Load configuration from environment file
set "CONFIG_FILE=%~dp0codesign-config.env"
if exist "%CONFIG_FILE%" (
    echo Loading configuration from: %CONFIG_FILE%
    echo.
    for /f "usebackq tokens=1,2 delims==" %%a in ("%CONFIG_FILE%") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
) else (
    echo WARNING: Configuration file not found: %CONFIG_FILE%
    echo Please copy codesign-config.example to codesign-config.env and configure your credentials.
    echo.
)

REM Set variables for easier reference
set "USERNAME=%CODESIGN_USERNAME%"
set "PASSWORD=%CODESIGN_PASSWORD%"
set "TOTP_SECRET=%CODESIGN_TOTP_SECRET%"

REM Check if parameters are provided
if "%USERNAME%"=="" (
    echo ERROR: Please configure your SSL.com credentials.
    echo.
    echo Please create a file called 'codesign-config.env' in this directory with:
    echo   CODESIGN_USERNAME=your_username
    echo   CODESIGN_PASSWORD=your_password
    echo   CODESIGN_TOTP_SECRET=your_totp_secret
    echo   CODE_SIGN_TOOL_PATH=C:\CodeSignTool
    echo.
    echo You can copy 'codesign-config.example' as a starting point.
    echo.
    pause
    exit /b 1
)

REM Check if CodeSignTool is installed
if "%CODE_SIGN_TOOL_PATH%"=="" set "CODE_SIGN_TOOL_PATH=C:\CodeSignTool"
if not exist "%CODE_SIGN_TOOL_PATH%\CodeSignTool.bat" (
    echo ERROR: SSL.com CodeSignTool not found!
    echo.
    echo Please install SSL.com CodeSignTool and make sure it's in the correct path:
    echo Expected path: %CODE_SIGN_TOOL_PATH%\CodeSignTool.bat
    echo.
    echo You can configure the path in codesign-config.env file.
    echo.
    pause
    exit /b 1
)

REM File to sign (passed as parameter or default)
set "FILE_TO_SIGN=%1"
if "%FILE_TO_SIGN%"=="" set "FILE_TO_SIGN=dist_installer\Din.Docs-Setup-1.0.0.exe"

REM Check if file exists
if not exist "%FILE_TO_SIGN%" (
    echo ERROR: File to sign not found: %FILE_TO_SIGN%
    echo.
    echo Please make sure the file exists or provide the correct path.
    echo.
    pause
    exit /b 1
)

echo Signing file: %FILE_TO_SIGN%
echo.

REM Sign the file using SSL.com CodeSignTool
echo Starting file signing process...
echo.

"%CODE_SIGN_TOOL_PATH%\CodeSignTool.bat" sign ^
    -username=%USERNAME% ^
    -password=%PASSWORD% ^
    -totp_secret=%TOTP_SECRET% ^
    -override=true ^
    -input_file_path=%FILE_TO_SIGN%

if errorlevel 1 (
    echo.
    echo ERROR: File signing failed!
    echo.
    echo Possible issues:
    echo   - Incorrect credentials
    echo   - Network connectivity problems
    echo   - Certificate issues
    echo   - TOTP synchronization problems
    echo   - CodeSignTool installation issues
    echo.
    echo Please check your SSL.com account and credentials.
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ===============================================
    echo        File signing completed successfully!
    echo ===============================================
    echo.
    echo Signed file: %FILE_TO_SIGN%
    echo.
    echo The file is now digitally signed and ready for distribution.
    echo.
)

pause
