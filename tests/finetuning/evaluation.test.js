import assert from "node:assert";
import { fineTuneJobManager } from "../../platform/finetuning/job-manager.js";
import { evaluateJobPerformance } from "../../platform/finetuning/evaluation-engine.js";

console.log("Running: tests/finetuning/evaluation.test.js");

(async () => {
  const sampleRows = [
    { instruction: "Inspect pipe", input: "", output: "Ultrasonic thickness measurement" },
    { instruction: "Check pump", input: "", output: "Vibration spectrum analysis" },
    { instruction: "Calibrate sensor", input: "", output: "Zero and span adjustment" }
  ];

  const job = fineTuneJobManager.createJob({
    name: "Eval Test Job",
    baseModelId: "falcon3-1b-instruct",
    domain: "INDUSTRIAL",
    datasetRows: sampleRows
  });

  const report = await evaluateJobPerformance(job);

  assert.ok(report, "Evaluation report must exist");
  assert.strictEqual(report.job_id, job.job_id);
  assert.ok(typeof report.average_base_score === "number");
  assert.ok(typeof report.average_finetuned_score === "number");
  assert.ok(Array.isArray(report.comparisons));
  assert.ok(report.comparisons.length > 0);

  fineTuneJobManager.deleteJob(job.job_id);
  console.log("✓ tests/finetuning/evaluation.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
