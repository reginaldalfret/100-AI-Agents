import fs from "node:fs";
import path from "node:path";

const dirs = [
  "E:\\Smart Automation\\100-AI-Agents\\artifacts",
  "E:\\Smart Automation\\100-AI-Agents\\logs",
  "E:\\Smart Automation\\100-AI-Agents\\temp",
  "E:\\Smart Automation\\100-AI-Agents\\cache",
  "E:\\Smart Automation\\100-AI-Agents\\archive",
  "E:\\Smart Automation\\AI\\Models\\Ollama",
  "E:\\Smart Automation\\AI\\Datasets",
  "E:\\Smart Automation\\AI\\Embeddings",
  "E:\\Smart Automation\\AI\\VectorDB",
  "E:\\Smart Automation\\AI\\Runtime",
  "E:\\Smart Automation\\Antigravity\\Projects",
  "E:\\Smart Automation\\Antigravity\\Logs",
  "E:\\Smart Automation\\Antigravity\\Cache",
  "E:\\Smart Automation\\Antigravity\\Temp"
];

console.log("\n============================================================");
console.log("  SETTING UP E: DRIVE AUTHORITATIVE WORKSPACE DIRECTORIES");
console.log("============================================================\n");

for (const d of dirs) {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
    console.log(`  [CREATED] ${d}`);
  } else {
    console.log(`  [EXISTS]  ${d}`);
  }
}

console.log("\n============================================================\n");
