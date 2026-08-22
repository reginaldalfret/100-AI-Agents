import fs from "node:fs";
import path from "node:path";

function getDirSize(dirPath) {
  let totalBytes = 0;
  let fileCount = 0;

  function traverse(current) {
    if (!fs.existsSync(current)) return;
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        try {
          if (entry.isDirectory()) {
            traverse(full);
          } else if (entry.isFile()) {
            totalBytes += fs.statSync(full).size;
            fileCount++;
          }
        } catch {}
      }
    } catch {}
  }

  traverse(dirPath);
  return {
    bytes: totalBytes,
    mb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    gb: Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2)),
    fileCount
  };
}

const targets = [
  { name: "Ollama Models", path: "C:\\Users\\ASUS\\.ollama\\models" },
  { name: "Antigravity Config & Brain", path: "C:\\Users\\ASUS\\.gemini" },
  { name: "Windows User Temp", path: "C:\\Users\\ASUS\\AppData\\Local\\Temp" },
  { name: "NPM Cache", path: "C:\\Users\\ASUS\\AppData\\Local\\npm-cache" },
  { name: "Project Total", path: "E:\\Smart Automation\\100-AI-Agents" },
  { name: "Project .git", path: "E:\\Smart Automation\\100-AI-Agents\\.git" },
  { name: "Project node_modules", path: "E:\\Smart Automation\\100-AI-Agents\\node_modules" },
  { name: "Project logs", path: "E:\\Smart Automation\\100-AI-Agents\\logs" },
  { name: "Project data", path: "E:\\Smart Automation\\100-AI-Agents\\data" },
  { name: "Project registry", path: "E:\\Smart Automation\\100-AI-Agents\\registry" },
  { name: "Project tests/results", path: "E:\\Smart Automation\\100-AI-Agents\\tests\\results" }
];

console.log("\n============================================================");
console.log("  STORAGE SIZE INVENTORY (C: and E: DRIVES)");
console.log("============================================================\n");

for (const t of targets) {
  const s = getDirSize(t.path);
  console.log(`  - ${t.name.padEnd(28)} : ${String(s.mb).padStart(8)} MB (${s.gb} GB) [${s.fileCount} files] -> ${t.path}`);
}

console.log("\n============================================================\n");
