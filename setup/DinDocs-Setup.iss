[Setup]
; Application information
AppId={{8D6F9A2B-4C7E-4B5A-9F1D-3E8C7A6B2F5E}
AppName=Din.Docs
AppVersion=1.0.0
AppVerName=Din.Docs 1.0.0
AppPublisher=Din.Docs Team
AppPublisherURL=https://github.com/din-docs
AppSupportURL=https://github.com/din-docs
AppUpdatesURL=https://github.com/din-docs
DefaultDirName={autopf}\Din.Docs
DefaultGroupName=Din.Docs
OutputDir=..\dist_installer
OutputBaseFilename=Din.Docs-Setup-1.0.0
SetupIconFile=..\public\app_icon-256.png
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

; License and information
LicenseFile=..\LICENSE
InfoBeforeFile=setup-info.txt
InfoAfterFile=setup-complete.txt

; Uninstaller
UninstallDisplayIcon={app}\Din.Docs.exe
UninstallDisplayName=Din.Docs
UninstallFilesDir={app}

; Visual appearance
WizardImageFile=setup-banner.bmp
WizardSmallImageFile=setup-icon.bmp

[Languages]
Name: "hebrew"; MessagesFile: "compiler:Languages\Hebrew.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1
Name: "associatefiles"; Description: "קשר קבצי PDF עם Din.Docs"; GroupDescription: "קשרי קבצים:"; Flags: unchecked

[Files]
; Main application files
Source: "..\dist_electron\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\Din.Docs"; Filename: "{app}\Din.Docs.exe"
Name: "{group}\{cm:UninstallProgram,Din.Docs}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Din.Docs"; Filename: "{app}\Din.Docs.exe"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\Din.Docs"; Filename: "{app}\Din.Docs.exe"; Tasks: quicklaunchicon

[Registry]
; File associations for PDF files (optional)
Root: HKCR; Subkey: ".pdf\OpenWithProgids"; ValueType: string; ValueName: "DinDocs.Document"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatefiles
Root: HKCR; Subkey: "DinDocs.Document"; ValueType: string; ValueName: ""; ValueData: "Din.Docs Document"; Flags: uninsdeletekey; Tasks: associatefiles
Root: HKCR; Subkey: "DinDocs.Document\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\Din.Docs.exe,0"; Tasks: associatefiles
Root: HKCR; Subkey: "DinDocs.Document\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\Din.Docs.exe"" ""%1"""; Tasks: associatefiles

[Run]
Filename: "{app}\Din.Docs.exe"; Description: "{cm:LaunchProgram,Din.Docs}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}"

[Code]
// Custom messages in Hebrew
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Any post-installation tasks can be added here
  end;
end;

// Check if the application is running before installation
function InitializeUninstall(): Boolean;
var
  ErrorCode: Integer;
begin
  if CheckForMutexes('DinDocsAppMutex') then
  begin
    if MsgBox('Din.Docs פועל כעת. יש לסגור את התוכנה לפני המשך ההתקנה.' + #13#10 + 'האם ברצונך לסגור את התוכנה ולהמשיך?', 
              mbConfirmation, MB_YESNO or MB_DEFBUTTON2) = IDYES then
    begin
      // Try to close the application gracefully
      if not Exec('taskkill', '/f /im "Din.Docs.exe"', '', SW_HIDE, ewWaitUntilTerminated, ErrorCode) then
      begin
        MsgBox('לא ניתן לסגור את התוכנה. אנא סגר את Din.Docs באופן ידני ונסה שוב.', mbError, MB_OK);
        Result := False;
        Exit;
      end;
    end
    else
    begin
      Result := False;
      Exit;
    end;
  end;
  Result := True;
end;
