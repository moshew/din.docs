@echo off
setlocal enabledelayedexpansion

echo.
echo ====================================================
echo    Din.Docs PdfGen - Complete Build Process
echo ====================================================
echo.
echo *** ANTIVIRUS WARNING ***
echo If the build completes but PdfGen.exe is missing from srv,
echo your antivirus probably deleted it as a false positive.
echo Run 'fix_antivirus_issue.bat' for solutions.
echo.
echo *** IMPORTANT ***
echo Consider temporarily disabling real-time protection during build.
echo.

REM --- Settings ---
set APP_NAME=PdfGen
set OUT_DIR=..\srv

echo *** STEP 1: RUNNING NUITKA BUILD ***
echo.
echo Calling build_nutika.bat...
echo.

REM Call the nuitka build script (no pause version)
call build_nutika.bat

echo.
echo *** STEP 2: CHECKING BUILD RESULTS ***
echo.

REM Check if build was successful
if exist "%APP_NAME%.dist" (
  echo ✓ Build successful! Found: %APP_NAME%.dist
  echo.
  
  echo *** STEP 3: DEPLOYING TO SRV ***
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
  echo Copying files to srv directory...
  xcopy "%APP_NAME%.dist\*" "%OUT_DIR%\" /E /I /Y
  
  if %errorlevel% equ 0 (
    echo.
    echo *** DEPLOYMENT SUCCESSFUL ***
    echo ✓ All files copied to: %OUT_DIR%\
    echo ✓ Main executable: %OUT_DIR%\%APP_NAME%.exe
    
    REM Verify the copy worked
    if exist "%OUT_DIR%\%APP_NAME%.exe" (
      echo ✓ Verified: Executable exists at destination
      
      REM Clean up the original dist directory
      echo.
      echo Cleaning up temporary build directory...
      rmdir /S /Q "%APP_NAME%.dist"
      if %errorlevel% equ 0 (
        echo ✓ Cleanup completed
      ) else (
        echo [WARNING] Could not clean up dist directory
      )
      
      echo.
      echo ====================================================
      echo ✓ COMPLETE BUILD PROCESS FINISHED SUCCESSFULLY!
      echo ✓ Ready to use: %OUT_DIR%\%APP_NAME%.exe
      echo ====================================================
      
    ) else (
      echo [ERROR] Executable not found at expected location!
      pause
      exit /b 1
    )
  ) else (
    echo.
    echo [ERROR] Failed to copy files to srv directory.
    echo Error level: %errorlevel%
    pause
    exit /b 1
  )
) else (
  echo.
  echo [ERROR] Build failed - no output directory found
  echo Looking for: %APP_NAME%.dist
  echo Available files:
  dir /B
  pause
  exit /b 1
)

echo.
pause
