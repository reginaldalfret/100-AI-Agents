import fs from "node:fs";
import path from "node:path";

export function validateRelease(state, projectRoot) {
  const errors = [];
  const warnings = [];

  if (!Number.isInteger(state.current_day)) {
    errors.push("current_day must be an integer.");
  }

  if (state.current_day < 1 || state.current_day > 100) {
    errors.push(`current_day must be between 1 and 100. Got: ${state.current_day}`);
  }

  const validStatuses = [
    "not_ready",
    "ready",
    "validating",
    "testing",
    "building",
    "pushing",
    "deploying",
    "verifying",
    "released",
    "failed"
  ];

  if (!validStatuses.includes(state.status)) {
    errors.push(`Unknown release status: ${state.status}`);
  }

  const registryPath = path.join(projectRoot, "registry", "agents.json");

  if (!fs.existsSync(registryPath)) {
    errors.push("Agent registry does not exist.");
  }

  if (state.status !== "ready") {
    warnings.push(
      `Day ${state.current_day} is currently "${state.status}". No deployment will occur.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
