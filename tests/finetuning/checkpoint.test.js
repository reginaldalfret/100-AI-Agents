import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fineTuneJobManager, JobState } from "../../platform/finetuning/job-manager.js";

console.log("Running: tests/finetuning/checkpoint.test.js");

(async () => {
  const sampleRows = [
    { instruction: "Task 1", input: "", output: "Output 1" },
    { instruction: "Task 2", input: "", output: "Output 2" },
    { instruction: "Task 3", input: "", output: "Output 3" }
  ];

  const job = fineTuneJobManager.createJob({
    name: "Checkpoint Test Job",
    baseModelId: "falcon3-1b-instruct",
    datasetRows: sampleRows,
    hyperparameters: { epochs: 1 }
  });

  const checkpointDir = path.join(job.job_dir, "checkpoints");
  assert.ok(fs.existsSync(checkpointDir), "Checkpoints directory must exist in isolated job workspace");

  fineTuneJobManager.deleteJob(job.job_id);
  console.log("✓ tests/finetuning/checkpoint.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
