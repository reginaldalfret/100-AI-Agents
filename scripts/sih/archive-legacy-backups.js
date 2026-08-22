import fs from "node:fs";
import path from "node:path";

const ROOT = "E:\\Smart Automation\\100-AI-Agents";
const archiveDir = path.join(ROOT, "archive");

if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

const entries = fs.readdirSync(ROOT, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory() && entry.name.startsWith("backup-before-")) {
    const src = path.join(ROOT, entry.name);
    const dest = path.join(archiveDir, entry.name);
    try {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.renameSync(src, dest);
      console.log(`[ARCHIVED] Moved ${entry.name} -> archive/${entry.name}`);
    } catch (err) {
      console.error(`Error archiving ${entry.name}:`, err.message);
    }
  }
}
