@echo off
REM Post-build processing for PdfGen
echo.
echo *** POST-BUILD PROCESSING ***
echo.

set APP_NAME=PdfGen
set OUT_DIR=..\srv

if exist "%APP_NAME%.dist" (
    echo ✓ Found build directory: %APP_NAME%.dist
    echo.
    
    REM Create srv directory
    if not exist "%OUT_DIR%" (
        echo Creating srv directory...
        mkdir "%OUT_DIR%"
    ) else (
        echo Cleaning existing srv directory...
        del /Q "%OUT_DIR%\*.*" 2>nul
        for /d %%i in ("%OUT_DIR%\*") do rmdir /S /Q "%%i" 2>nul
    )
    
    REM Copy all files from dist directory to srv
    echo Copying files to srv...
    xcopy "%APP_NAME%.dist\*" "%OUT_DIR%\" /E /I /Y
    
    if %errorlevel% equ 0 (
        echo.
        echo *** SUCCESS ***
        echo ✓ Successfully copied application to: %OUT_DIR%\
        echo ✓ Main executable: %OUT_DIR%\%APP_NAME%.exe
        
        REM Verify the copy worked
        if exist "%OUT_DIR%\%APP_NAME%.exe" (
            echo ✓ Verified: Executable exists at destination
            
            REM Clean up the original dist directory
            echo Cleaning up original dist directory...
            rmdir /S /Q "%APP_NAME%.dist"
            if %errorlevel% equ 0 (
                echo ✓ Cleaned up temporary build directory
            ) else (
                echo [WARNING] Could not clean up dist directory
            )
        ) else (
            echo [ERROR] Executable not found at expected location!
        )
    ) else (
        echo.
        echo [ERROR] Failed to copy application to srv directory.
        echo Error level: %errorlevel%
    )
) else (
    echo.
    echo [ERROR] Built application directory not found at: %APP_NAME%.dist
)

echo.
echo Final output directory: %OUT_DIR%\
echo Main executable: %OUT_DIR%\%APP_NAME%.exe
echo.

