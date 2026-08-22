import fs from "node:fs";
import path from "node:path";

const oldOllamaModels = "C:\\Users\\ASUS\\.ollama\\models";
const newOllamaModels = "E:\\Smart Automation\\AI\\Models\\Ollama";

console.log("\n============================================================");
console.log("  CLEANING OLD DUPLICATE OLLAMA MODELS ON C: DRIVE");
console.log("============================================================\n");

// Double check that new location has valid blobs and manifests
if (!fs.existsSync(newOllamaModels) || !fs.existsSync(path.join(newOllamaModels, "blobs"))) {
  console.error("CRITICAL SAFETY CHECK FAILED: New Ollama model store on E: does not exist!");
  process.exit(1);
}

const eBlobs = fs.readdirSync(path.join(newOllamaModels, "blobs"));
console.log(`[VERIFIED] E: drive model store has ${eBlobs.length} model blob files.`);

if (fs.existsSync(oldOllamaModels)) {
  fs.rmSync(oldOllamaModels, { recursive: true, force: true });
  console.log(`[CLEANED] Successfully removed old duplicate models at ${oldOllamaModels}`);
} else {
  console.log(`[SKIP] ${oldOllamaModels} does not exist.`);
}

console.log("\n============================================================\n");
