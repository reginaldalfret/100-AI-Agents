import { loadState, getProjectRoot } from "./state.js";
import {
  loadRegistry,
  validateRelease
} from "./validator.js";

const startedAt = new Date();

console.log("");
console.log("============================================================");
console.log("100 → 1 RELEASE CONTROLLER");
console.log("============================================================");
console.log(`Started: ${startedAt.toISOString()}`);
console.log("Mode: DRY RUN");
console.log("");

try {
  const projectRoot = getProjectRoot();
  const state = loadState();
  const registry = loadRegistry(projectRoot);

  console.log("PROJECT");
  console.log(`  Root: ${projectRoot}`);
  console.log("");

  console.log("RELEASE STATE");
  console.log(`  Current day: ${state.current_day}`);
  console.log(`  Status: ${state.status}`);
  console.log("");

  console.log("AGENT REGISTRY");

  const validation = validateRelease(
    state,
    registry,
    projectRoot
  );

  if (validation.agent) {
    console.log(`  Agent ID: ${validation.agent.agent_id}`);
    console.log(`  Name: ${validation.agent.name}`);
    console.log(`  Agent status: ${validation.agent.status}`);
  }

  console.log("");
  console.log("VALIDATION");

  for (const warning of validation.warnings) {
    console.log(`  ⚠ ${warning}`);
  }

  for (const error of validation.errors) {
    console.error(`  ✗ ${error}`);
  }

  if (!validation.valid) {
    console.error("");
    console.error("RELEASE PLAN: BLOCKED");
    process.exitCode = 1;
  } else if (state.status !== "ready") {
    console.log("");
    console.log("RELEASE PLAN: NOT READY");
    console.log("");
    console.log("No GitHub or Vercel operation will be performed.");
    console.log("The controller is waiting for the agent to become READY.");
  } else if (validation.agent.status === "released") {
    console.log("");
    console.log("RELEASE PLAN: ALREADY RELEASED");
    console.log("Duplicate release prevented.");
  } else {
    console.log("");
    console.log("RELEASE PLAN: READY");
    console.log("");
    console.log("DRY RUN — no deployment performed.");
    console.log("");
    console.log("Target agent:");
    console.log(
      `  ${validation.agent.agent_id} — ${validation.agent.name}`
    );
    console.log("");
    console.log("Future stages:");
    console.log("  1. Validate agent");
    console.log("  2. Run tests");
    console.log("  3. Build");
    console.log("  4. Create GitHub repository");
    console.log("  5. Push agent");
    console.log("  6. Create/deploy Vercel project");
    console.log("  7. Verify deployment");
    console.log("  8. Verify /api/health");
    console.log("  9. Update registry");
    console.log(" 10. Mark release complete");
  }

  console.log("");
  console.log("============================================================");
  console.log("RELEASE CONTROLLER FINISHED");
  console.log("============================================================");
} catch (error) {
  console.error("");
  console.error("RELEASE CONTROLLER ERROR");
  console.error(
    error instanceof Error ? error.stack : error
  );
  process.exitCode = 1;
}
