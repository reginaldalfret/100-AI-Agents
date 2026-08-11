import http from "node:http";
import { loadState, getProjectRoot } from "./state.js";
import {
  loadRegistry,
  validateRelease
} from "./validator.js";

const startedAt = new Date();

function checkAgentHealth(agent) {
  if (!agent?.health_url) {
    return Promise.resolve({
      ok: false,
      reason: "Agent health_url is not configured."
    });
  }

  return new Promise((resolve) => {
    const request = http.get(agent.health_url, { timeout: 5000 }, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        if (response.statusCode !== 200) {
          resolve({
            ok: false,
            reason: `Health endpoint returned HTTP ${response.statusCode}.`
          });
          return;
        }

        try {
          const data = JSON.parse(body);
          const healthy = data.status === "healthy";
          const qwenAvailable = data.qwen_available === true;

          resolve({
            ok: healthy && qwenAvailable,
            data,
            reason: !healthy
              ? `Agent health status is ${data.status ?? "unknown"}.`
              : !qwenAvailable
                ? "Qwen 3.5 9B backend is unavailable."
                : null
          });
        } catch {
          resolve({
            ok: false,
            reason: "Health endpoint returned invalid JSON."
          });
        }
      });
    });

    request.on("timeout", () => {
      request.destroy();
      resolve({ ok: false, reason: "Health endpoint timed out after 5 seconds." });
    });

    request.on("error", (error) => {
      resolve({
        ok: false,
        reason: `Health endpoint unavailable: ${error.message}`
      });
    });
  });
}

console.log("");
console.log("============================================================");
console.log("100 → 1 RELEASE CONTROLLER");
console.log("============================================================");
console.log(`Started: ${startedAt.toISOString()}`);
console.log("Mode: READINESS CHECK / DRY RUN");
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

  const validation = validateRelease(state, registry, projectRoot);

  if (validation.agent) {
    console.log(`  Agent ID: ${validation.agent.agent_id}`);
    console.log(`  Name: ${validation.agent.name}`);
    console.log(`  Agent status: ${validation.agent.status}`);
    console.log(`  Health URL: ${validation.agent.health_url || "not configured"}`);
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
    console.log("LIVE AGENT READINESS");

    const health = await checkAgentHealth(validation.agent);

    if (health.ok) {
      console.log("  ✓ Agent health: healthy");
      console.log("  ✓ Qwen backend: qwen3.5:9b available");
      console.log("");
      console.log("RELEASE PLAN: READY");
      console.log("Day 1 agent passed live readiness checks.");
      console.log("No GitHub or Vercel operation will be performed in this dry-run controller.");
    } else {
      console.error(`  ✗ ${health.reason}`);
      console.log("");
      console.log("RELEASE PLAN: NOT READY");
      console.log("The controller will wait until the agent and Qwen backend are healthy.");
    }
  } else if (validation.agent.status === "released") {
    console.log("");
    console.log("RELEASE PLAN: ALREADY RELEASED");
    console.log("Duplicate release prevented.");
  } else {
    console.log("");
    console.log("LIVE AGENT READINESS");

    const health = await checkAgentHealth(validation.agent);

    if (!health.ok) {
      console.error(`  ✗ ${health.reason}`);
      console.error("");
      console.error("RELEASE PLAN: BLOCKED");
      process.exitCode = 1;
    } else {
      console.log("  ✓ Agent health: healthy");
      console.log("  ✓ Qwen backend: qwen3.5:9b available");
      console.log("");
      console.log("RELEASE PLAN: READY");
      console.log("");
      console.log("DRY RUN — no deployment performed.");
      console.log("");
      console.log("Target agent:");
      console.log(`  ${validation.agent.agent_id} — ${validation.agent.name}`);
      console.log("");
      console.log("Future release stages:");
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
  }

  console.log("");
  console.log("============================================================");
  console.log("RELEASE CONTROLLER FINISHED");
  console.log("============================================================");
} catch (error) {
  console.error("");
  console.error("RELEASE CONTROLLER ERROR");
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
}
