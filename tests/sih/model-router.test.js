import { classifyTaskModelRequirements, routeTaskToLocalModel, listAvailableModels } from "../../platform/models/index.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Local Model Registry & Auto-Router Tests", [
  {
    name: "Registers Local Models with Zero Cloud Providers",
    fn: async () => {
      const models = listAvailableModels();
      assert.ok(models.length >= 3);
      assert.ok(models.every(m => m.provider === "ollama" || m.provider === "local-multimodal"));
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
    name: "Route Task API returns zero external calls",
    fn: async () => {
      const result = await routeTaskToLocalModel({ prompt: "Review P&ID drawing DWG-201.png", attachments: [{ name: "DWG-201.png" }] });
      assert.strictEqual(result.external_calls, 0);
      assert.strictEqual(result.is_sovereign_local, true);
    }
  }
]);
