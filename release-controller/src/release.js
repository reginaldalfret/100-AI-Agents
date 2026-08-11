import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export function runCommand(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeout ?? 120000,
    maxBuffer: options.maxBuffer ?? 4 * 1024 * 1024
  }).trim();
}

export function updateJson(file, mutate) {
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  mutate(value);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  return value;
}

export function assertExists(file, label) {
  if (!fs.existsSync(file)) {
    throw new Error(`${label} does not exist: ${file}`);
  }
}

export function runAgentTests(projectRoot, agentPath) {
  const packageJson = path.join(projectRoot, agentPath, "package.json");
  assertExists(packageJson, "Agent package.json");

  const packageData = JSON.parse(fs.readFileSync(packageJson, "utf8"));
  if (!packageData.scripts?.test) {
    throw new Error("Agent package.json does not define npm test.");
  }

  return runCommand("npm", ["test"], {
    cwd: path.join(projectRoot, agentPath),
    timeout: 180000
  });
}

export function runAgentCheck(projectRoot, agentPath) {
  const packageJson = path.join(projectRoot, agentPath, "package.json");
  assertExists(packageJson, "Agent package.json");

  const packageData = JSON.parse(fs.readFileSync(packageJson, "utf8"));
  if (!packageData.scripts?.check) {
    throw new Error("Agent package.json does not define npm run check.");
  }

  return runCommand("npm", ["run", "check"], {
    cwd: path.join(projectRoot, agentPath),
    timeout: 120000
  });
}

export function runGitStatus(projectRoot) {
  return runCommand("git", ["status", "--short"], { cwd: projectRoot });
}

export function gitCommitAndPush(projectRoot, message) {
  const status = runGitStatus(projectRoot);
  if (!status) {
    return { committed: false, status: "clean" };
  }

  runCommand("git", ["add", "."], { cwd: projectRoot });
  runCommand("git", ["commit", "-m", message], { cwd: projectRoot });
  runCommand("git", ["push", "origin", "main"], { cwd: projectRoot });

  return { committed: true, status };
}
