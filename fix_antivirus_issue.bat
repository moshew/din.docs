@echo off
echo ================================================
echo    Fix Antivirus Issue for PdfGen.exe
echo ================================================
echo.
echo This script will help you add exclusions to Windows Defender
echo to prevent it from deleting the built PdfGen.exe file.
echo.
echo OPTION 1: Add directory exclusions (Recommended)
echo Run these commands as Administrator:
echo.
echo powershell -Command "Add-MpPreference -ExclusionPath 'C:\din.docs\v2\PdfGen'"
echo powershell -Command "Add-MpPreference -ExclusionPath 'C:\din.docs\v2\srv'"
echo.
echo OPTION 2: Manual steps:
echo 1. Open Windows Security (Windows Defender)
echo 2. Go to Virus and threat protection
echo 3. Click on "Manage settings" under Virus and threat protection settings
echo 4. Scroll down to "Exclusions" and click "Add or remove exclusions"
echo 5. Click "Add an exclusion" and choose "Folder"
echo 6. Add these folders:
echo    - C:\din.docs\v2\PdfGen
echo    - C:\din.docs\v2\srv
echo.
echo OPTION 3: Temporary disable (during build only):
echo 1. Open Windows Security
echo 2. Go to Virus and threat protection
echo 3. Click "Manage settings" under Real-time protection
echo 4. Turn off "Real-time protection" temporarily
echo 5. Run the build script
echo 6. Turn Real-time protection back ON
echo.
pause

