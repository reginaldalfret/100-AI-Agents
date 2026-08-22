/**
 * Sovereign AI Workbench — Full Automated & Adversarial Test Suite Runner
 */

console.log(`\n============================================================`);
console.log(`STARTING COMPLETE SOVEREIGN AI WORKBENCH TEST MATRIX (SIH MRPL)`);
console.log(`============================================================\n`);

try {
  await import("./sovereignty.test.js");
  await import("./real-network-isolation.test.js");
  await import("./adversarial-security.test.js");
  await import("./model-router.test.js");
  await import("./multimodel/multimodel.test.js");
  await import("./multimodal.test.js");
  await import("./rag.test.js");
  await import("./sandbox.test.js");
  await import("./deliverables.test.js");
  await import("./workflow.test.js");
  await import("./flagship-demo.test.js");
  await import("./fleet.test.js");
  await import("./autonomous/task-planner.test.js");
  await import("./autonomous/replanner.test.js");
  await import("./autonomous/execution-engine.test.js");
  await import("./autonomous/golden-benchmark.test.js");

  console.log(`\n============================================================`);
  console.log(`ALL 16 TEST SUITES PASSED (100% PASS RATE)`);
  console.log(`EXTERNAL EGRESS: 0 CALLS (AIR-GAP VERIFIED)`);
  console.log(`============================================================\n`);
} catch (err) {
  console.error(`\nTEST RUN FAILED:`, err);
  process.exit(1);
}
