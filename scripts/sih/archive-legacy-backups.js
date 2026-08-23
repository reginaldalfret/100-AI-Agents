import fs from "node:fs";
import path from "node:path";

const ROOT = "E:\\\\Smart Automation\\\\100-AI-Agents";
const targetVbs = path.join(ROOT, "scripts", "run-silent-background.vbs");

const vbsContent = [
  "' 101 Super AI Agents — Silent Windows Background Launcher",
  "Set WshShell = CreateObject(\"WScript.Shell\")",
  "Set fso = CreateObject(\"Scripting.FileSystemObject\")",
  "scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)",
  "projectRoot = fso.GetParentFolderName(scriptDir)",
  "targetScript = scriptDir & \"\\start-production.ps1\"",
  "cmd = \"powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"\"\" & targetScript & \"\"\"\"",
  "WshShell.CurrentDirectory = projectRoot",
  "WshShell.Run cmd, 0, False",
  "Set WshShell = Nothing",
  "Set fso = Nothing"
].join("\r\n");

fs.writeFileSync(targetVbs, vbsContent, "utf8");
console.log("Successfully created scripts/run-silent-background.vbs");

