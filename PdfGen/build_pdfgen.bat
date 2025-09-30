@echo off
setlocal enabledelayedexpansion

echo.
echo ====================================================
echo    Din.Docs PdfGen - Complete Build Process
echo ====================================================
echo.
echo Usage: build_pdfgen.bat [options]
echo Options:
echo   -n          Use Nuitka instead of PyInstaller (default: PyInstaller)
echo   --sign, -s  Automatically sign the executable after build
echo.
echo ^*^*^* ANTIVIRUS WARNING ^*^*^*
echo If the build completes but PdfGen.exe is missing from srv,
echo your antivirus probably deleted it as a false positive.
echo Run 'fix_antivirus_issue.bat' for solutions.
echo.
echo ^*^*^* IMPORTANT ^*^*^*
echo Consider temporarily disabling real-time protection during build.
echo.

REM --- Settings ---
set APP_NAME=PdfGen
set OUT_DIR=..\srv

REM Parse command line parameters
set AUTO_SIGN=false
set USE_NUITKA=false

:parse_args
if "%1"=="" goto :args_done
if /i "%1"=="--sign" set AUTO_SIGN=true
if /i "%1"=="-s" set AUTO_SIGN=true
if /i "%1"=="-n" set USE_NUITKA=true
shift
goto :parse_args
:args_done

if "!USE_NUITKA!"=="true" (
  echo ^*^*^* STEP 1: RUNNING NUITKA BUILD ^*^*^*
  echo.
  echo Calling build_nutika.bat...
  echo.
  
  REM Call the nuitka build script (no pause version)
  call build_nutika.bat
) else (
  echo ^*^*^* STEP 1: RUNNING PYINSTALLER BUILD ^*^*^*
  echo.
  echo Calling build_pyinstaller.bat...
  echo.
  
  REM Call the pyinstaller build script
  call build_pyinstaller.bat
)

echo.
echo ^*^*^* STEP 2: CHECKING BUILD RESULTS ^*^*^*
echo.

if "!USE_NUITKA!"=="true" (
  goto :nuitka_build
) else (
  goto :pyinstaller_build
)

:nuitka_build
REM Check if Nuitka build was successful
if exist "%APP_NAME%.dist" (
  echo [OK] Nuitka build successful! Found: %APP_NAME%.dist
  echo.
  
  echo ^*^*^* STEP 3: DEPLOYING TO SRV ^*^*^*
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
    echo ^*^*^* DEPLOYMENT SUCCESSFUL ^*^*^*
    echo [OK] All files copied to: %OUT_DIR%\
    echo [OK] Main executable: %OUT_DIR%\%APP_NAME%.exe
    
    REM Verify the copy worked
    if exist "%OUT_DIR%\%APP_NAME%.exe" (
      echo [OK] Verified: Executable exists at destination
      
      REM Clean up the original dist directory
      echo.
      echo Cleaning up temporary build directory...
      rmdir /S /Q "%APP_NAME%.dist"
      if %errorlevel% equ 0 (
        echo [OK] Cleanup completed
      ) else (
        echo [WARNING] Could not clean up dist directory
      )
      
      goto :code_signing
      
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
  echo [ERROR] Nuitka build failed - no output directory found
  echo Looking for: %APP_NAME%.dist
  echo Available files:
  dir /B
  pause
  exit /b 1
)

:pyinstaller_build
REM Check if PyInstaller build was successful (files already in srv)
if exist "%OUT_DIR%\%APP_NAME%.exe" (
  echo [OK] PyInstaller build successful! Found: %OUT_DIR%\%APP_NAME%.exe
  echo.
  echo ^*^*^* STEP 3: DEPLOYMENT ^*^*^*
  echo Files already deployed by PyInstaller to: %OUT_DIR%\
  echo [OK] Main executable: %OUT_DIR%\%APP_NAME%.exe
  
  goto :code_signing
  
) else (
  echo.
  echo [ERROR] PyInstaller build failed - executable not found
  echo Looking for: %OUT_DIR%\%APP_NAME%.exe
  echo Available files in %OUT_DIR%:
  if exist "%OUT_DIR%" (
    dir /B "%OUT_DIR%"
  ) else (
    echo Directory %OUT_DIR% does not exist
  )
  pause
  exit /b 1
)

:code_signing
echo.
echo ^*^*^* STEP 4: CODE SIGNING ^(OPTIONAL^) ^*^*^*
echo.

REM Check if code signing is available
set "SIGN_SCRIPT=%~dp0..\sign\sign_file.bat"
if exist "!SIGN_SCRIPT!" (
  echo Code signing script found: !SIGN_SCRIPT!
  echo.
  
  if "!AUTO_SIGN!"=="true" (
    echo Auto-signing enabled via command line parameter
    set SIGN_CHOICE=y
  ) else (
    echo Code signing is available but not requested
    echo Use --sign or -s parameter to enable automatic signing
    set SIGN_CHOICE=n
  )
  
  if /i "!SIGN_CHOICE!"=="y" (
    echo.
    echo Starting code signing process...
    echo.
    call "!SIGN_SCRIPT!" "%OUT_DIR%\%APP_NAME%.exe"
    
    if !errorlevel! equ 0 (
      echo.
      echo [OK] Code signing completed successfully!
    ) else (
      echo.
      echo [WARNING] Code signing failed or was cancelled
      echo The executable is still usable but not signed
    )
  ) else (
    echo.
    echo Code signing skipped - use --sign parameter to enable
  )
) else (
  echo Code signing script not found at: !SIGN_SCRIPT!
  echo Skipping code signing step
)

echo.
echo ====================================================
echo [OK] COMPLETE BUILD PROCESS FINISHED SUCCESSFULLY!
echo [OK] Ready to use: %OUT_DIR%\%APP_NAME%.exe
echo ====================================================

echo.
