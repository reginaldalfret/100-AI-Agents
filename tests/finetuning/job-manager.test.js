import assert from "node:assert";
import { fineTuneJobManager, JobState } from "../../platform/finetuning/job-manager.js";

console.log("Running: tests/finetuning/job-manager.test.js");

(async () => {
  const sampleRows = [
    { instruction: "Task 1", input: "", output: "Output 1" },
    { instruction: "Task 2", input: "", output: "Output 2" },
    { instruction: "Task 3", input: "", output: "Output 3" },
    { instruction: "Task 4", input: "", output: "Output 4" }
  ];

  // 1. Create Job
  const job = fineTuneJobManager.createJob({
    name: "Test Job",
    baseModelId: "falcon3-1b-instruct",
    datasetRows: sampleRows,
    hyperparameters: { epochs: 1 }
  });

  assert.ok(job.job_id.startsWith("ft_job_"));
  assert.strictEqual(job.state, JobState.QUEUED);
  assert.strictEqual(job.base_model_id, "falcon3-1b-instruct");

  // 2. Start Job
  await fineTuneJobManager.startJob(job.job_id);
  assert.ok(job.state === JobState.PREPARING || job.state === JobState.TRAINING);

  // 3. Pause Job
  await fineTuneJobManager.pauseJob(job.job_id);
  assert.strictEqual(job.state, JobState.PAUSED);

  // 4. Resume Job
  await fineTuneJobManager.resumeJob(job.job_id);
  assert.strictEqual(job.state, JobState.TRAINING);

  // 5. Cancel Job
  await fineTuneJobManager.cancelJob(job.job_id);
  assert.strictEqual(job.state, JobState.CANCELLED);

  // Cleanup
  fineTuneJobManager.deleteJob(job.job_id);
  console.log("✓ tests/finetuning/job-manager.test.js passed successfully.");
})().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
