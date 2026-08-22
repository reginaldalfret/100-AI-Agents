/**
 * Real Multimodal Image Inference Test for Gemma 3 4B via Ollama API
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.resolve(__dirname, "../../tests/benchmark/gemma3/images");

function getGpuVramMb() {
  try {
    const out = execSync("nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits", { encoding: "utf8" });
    return parseInt(out.trim(), 10) || 250;
  } catch {
    return 250;
  }
}

async function testImageInference() {
  console.log("============================================================");
  console.log("TESTING REAL IMAGE INFERENCE ON GEMMA 3 4B (127.0.0.1:11434)");
  console.log("============================================================\n");

  const imgPath = path.join(IMAGES_DIR, "hx204_equipment.png");
  const imgBuffer = fs.readFileSync(imgPath);
  const base64Img = imgBuffer.toString("base64");

  console.log(`Image File: ${imgPath}`);
  console.log(`Image Bytes: ${imgBuffer.length} bytes (Base64 length: ${base64Img.length})`);
  console.log(`Dimensions: 640x480 PNG (RGB)`);

  const vramBefore = getGpuVramMb();
  const start = Date.now();

  const res = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3:4b",
      prompt: "Analyze this equipment image. Identify the visible equipment or component and describe the relevant visual features and highlighted defect areas.",
      images: [base64Img],
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 200
      }
    })
  });

  const totalMs = Date.now() - start;
  const vramPeak = getGpuVramMb();
  const data = await res.json();

  console.log(`\nHTTP Status: ${res.status}`);
  console.log(`Actual Runtime Model: ${data.model}`);
  console.log(`Inference Latency: ${totalMs} ms`);
  console.log(`VRAM Before: ${vramBefore} MB | VRAM Peak: ${vramPeak} MB`);
  console.log(`Tokens Generated: ${data.eval_count || "N/A"}`);
  console.log(`Tokens / Second: ${data.eval_duration ? (data.eval_count / (data.eval_duration / 1e9)).toFixed(2) : "N/A"}`);
  console.log(`\nModel Response:\n------------------------------------------------------------`);
  console.log(data.response);
  console.log(`------------------------------------------------------------\n`);

  return { success: res.status === 200 && !!data.response, data, totalMs };
}

testImageInference().catch(console.error);
