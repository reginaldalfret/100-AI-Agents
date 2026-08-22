import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "../..");
const STATE_FILE = path.join(PROJECT_ROOT, "state", "release-state.json");

export function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`State file not found: ${STATE_FILE}`);
  }

  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}

export function saveState(state) {
  fs.writeFileSync(
    STATE_FILE,
    `${JSON.stringify(state, null, 2)}\n`,
    "utf8"
  );
}

export function getProjectRoot() {
  return PROJECT_ROOT;
}
