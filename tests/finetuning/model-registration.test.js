import assert from "node:assert";
import { fineTuneJobManager } from "../../platform/finetuning/job-manager.js";
import { packageAndRegisterModel } from "../../platform/finetuning/model-packager.js";
import { getModelById } from "../../platform/models/model-registry.js";

console.log("Running: tests/finetuning/model-registration.test.js");

(async () => {
  const sampleRows = [
    { instruction: "Task A", input: "", output: "Output A" },
    { instruction: "Task B", input: "", output: "Output B" },
    { instruction: "Task C", input: "", output: "Output C" }
  ];

  const job = fineTuneJobManager.createJob({
    name: "MRPL Industrial Specialist",
    baseModelId: "falcon3-1b-instruct",
    domain: "INDUSTRIAL",
    specialization: "Refinery Instrumentation",
    datasetRows: sampleRows
  });

  const registered = packageAndRegisterModel(job);
  assert.ok(registered.model_id);
  assert.strictEqual(registered.badge, "INDUSTRIAL");
  assert.strictEqual(registered.secondaryTag, "FINE-TUNED");

  const fromRegistry = getModelById(registered.model_id);
  assert.ok(fromRegistry, "Must be retrievable from model registry");
  assert.strictEqual(fromRegistry.name, "MRPL Industrial Specialist");

  fineTuneJobManager.deleteJob(job.job_id);
  console.log("✓ tests/finetuning/model-registration.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
