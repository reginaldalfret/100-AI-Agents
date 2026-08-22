/**
 * Sovereign AI Workbench — Automated Test Runner
 */

export async function runTestSuite(suiteName, testFns = []) {
  console.log(`\n============================================================`);
  console.log(`RUNNING TEST SUITE: ${suiteName}`);
  console.log(`============================================================`);

  let passed = 0;
  let failed = 0;

  for (const test of testFns) {
    try {
      await test.fn();
      console.log(`  [PASS] ${test.name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${test.name}:`, err.message);
      failed++;
    }
  }

  console.log(`------------------------------------------------------------`);
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    throw new Error(`Suite ${suiteName} failed with ${failed} errors.`);
  }
}
