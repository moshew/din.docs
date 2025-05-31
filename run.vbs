Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "C:\din.docs\v2\run_electron.bat" & chr(34), 0
Set WshShell = Nothing
