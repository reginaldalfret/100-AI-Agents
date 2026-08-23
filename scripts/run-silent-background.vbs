' 101 Super AI Agents — Silent Windows Background Launcher
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectRoot = fso.GetParentFolderName(scriptDir)
targetScript = scriptDir & "\start-production.ps1"
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & targetScript & """"
WshShell.CurrentDirectory = projectRoot
WshShell.Run cmd, 0, False
Set WshShell = Nothing
Set fso = Nothing