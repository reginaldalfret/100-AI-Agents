import { classifyTaskModelRequirements, routeTaskToLocalModel, listAvailableModels } from "../../platform/models/index.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Local Model Registry & Auto-Router Tests", [
  {
    name: "Registers Local Models with Zero Cloud Providers",
    fn: async () => {
      const models = listAvailableModels();
      assert.ok(models.length >= 3);
      assert.ok(models.every(m => m.endpoint?.includes("127.0.0.1") || m.runtime_type === "OLLAMA" || m.execution_target === "CPU" || m.execution_target === "GPU"));
    }
  },
  {
    name: "Routes Scanned PDF / OCR task to Local Vision & OCR Engine",
    fn: async () => {
      const req = classifyTaskModelRequirements("Process scanned ultrasonic thickness inspection report", [{ name: "scan.pdf" }]);
      assert.strictEqual(req.recommended_model_id, "local-vision-ocr");
      assert.strictEqual(req.primary_modality, "ocr");
    }
  },
  {
    name: "Routes Python scripting task to Local Code Specialist",
    fn: async () => {
      const req = classifyTaskModelRequirements("Write a python script to calculate tank corrosion rate");
      assert.strictEqual(req.recommended_model_id, "local-code-specialist");
    }
  },
  {
    name: "Routes General SOP Reasoning to NVIDIA Nemotron 3 Nano",
    fn: async () => {
      const req = classifyTaskModelRequirements("Summarize crude tank retirement limits under OISD standards");
      assert.strictEqual(req.recommended_model_id, "nemotron-3-nano");
    }
  },
  {
    name: "Routes Equipment Photograph / Drawing to Local Vision & OCR Engine",
    fn: async () => {
      const req = classifyTaskModelRequirements("Analyze this equipment photograph for localized pitting corrosion", [{ name: "defect_photo.jpg" }]);
      assert.strictEqual(req.recommended_model_id, "local-vision-ocr");
      assert.strictEqual(req.primary_modality, "vision");
    }
  },
  {
    name: "Route Task API returns zero external calls",
    fn: async () => {
      const result = await routeTaskToLocalModel({ prompt: "Review P&ID drawing DWG-201.png", attachments: [{ name: "DWG-201.png" }] });
      assert.strictEqual(result.external_calls, 0);
      assert.strictEqual(result.is_sovereign_local, true);
    }
  }
]);
