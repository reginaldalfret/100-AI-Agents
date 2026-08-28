import assert from "node:assert";
import { fineTuneJobManager } from "../../platform/finetuning/job-manager.js";
import { packageAndRegisterModel } from "../../platform/finetuning/model-packager.js";
import { routeTaskToLocalModel } from "../../platform/models/model-router.js";

console.log("Running: tests/orchestration/finetuned-model-routing.test.js");

(async () => {
  const sampleRows = [
    { instruction: "Inspect pipe", input: "", output: "Ultrasonic testing" },
    { instruction: "Check pump", input: "", output: "Vibration analysis" },
    { instruction: "Calibrate sensor", input: "", output: "Zero and span calibration" }
  ];

  const job = fineTuneJobManager.createJob({
    name: "Industrial Specialist v1",
    baseModelId: "falcon3-1b-instruct",
    domain: "INDUSTRIAL",
    datasetRows: sampleRows
  });

  const registered = packageAndRegisterModel(job);

  // 1. Explicit model override routing
  const decision = await routeTaskToLocalModel({
    prompt: "Perform ultrasonic pipe inspection",
    model_override: registered.model_id
  });

  assert.ok(decision, "Must return routing decision");
  assert.strictEqual(decision.selected_model, registered.model_id);
  assert.strictEqual(decision.is_sovereign_local, true);
  assert.strictEqual(decision.external_calls, 0);

  fineTuneJobManager.deleteJob(job.job_id);
  console.log("✓ tests/orchestration/finetuned-model-routing.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
