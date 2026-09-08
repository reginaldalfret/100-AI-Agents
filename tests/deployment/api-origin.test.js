import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.env.PROJECT_ROOT || path.resolve(__dirname, "../..");

test("API Origin — Frontend uses same-origin relative /api routes", () => {
  const appJsPath = path.join(ROOT_DIR, "platform", "web", "app.js");
  assert.ok(fs.existsSync(appJsPath), "platform/web/app.js must exist");

  const appJs = fs.readFileSync(appJsPath, "utf8");

  // Verify frontend uses relative /api paths
  const hasRelativeApiFetch = appJs.includes("fetch('/api/") || appJs.includes("fetch(`/api/");
  assert.ok(hasRelativeApiFetch, "Frontend must issue API calls using same-origin relative /api/ paths");

  // Verify critical endpoints use relative routes
  const requiredEndpoints = [
    "/api/chat",
    "/api/models/list",
    "/api/health",
    "/api/chats"
  ];

  for (const endpoint of requiredEndpoints) {
    const regex = new RegExp(`['"\`]${endpoint}`, "i");
    assert.ok(
      regex.test(appJs),
      `Frontend should reference relative endpoint '${endpoint}' without hardcoded host:port`
    );
  }

  // Ensure no fetch calls use hardcoded gateway localhost:8300
  const hardcodedGatewayCall = /(?:fetch|axios|\.open)\s*\(\s*['"`]https?:\/\/(?:127\.0\.0\.1|localhost):8300\/api/i.test(appJs);
  assert.strictEqual(
    hardcodedGatewayCall,
    false,
    "Frontend fetch calls must not hardcode http://127.0.0.1:8300; must use relative /api paths"
  );
});

test("API Origin — Verify no hardcoded 127.0.0.1:11434 in frontend api calls", () => {
  const appJsPath = path.join(ROOT_DIR, "platform", "web", "app.js");
  const indexHtmlPath = path.join(ROOT_DIR, "platform", "web", "index.html");

  assert.ok(fs.existsSync(appJsPath), "platform/web/app.js must exist");
  assert.ok(fs.existsSync(indexHtmlPath), "platform/web/index.html must exist");

  const appJs = fs.readFileSync(appJsPath, "utf8");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");

  // Verify no active network request targets Ollama port 11434 directly
  const activeOllamaCallRegex = /(?:fetch|axios|\.open|WebSocket|EventSource)\s*\(\s*['"`]https?:\/\/(?:127\.0\.0\.1|localhost):11434/i;
  assert.strictEqual(
    activeOllamaCallRegex.test(appJs),
    false,
    "Frontend app.js must never make direct network calls to 127.0.0.1:11434"
  );

  assert.strictEqual(
    activeOllamaCallRegex.test(indexHtml),
    false,
    "Frontend index.html must never make direct network calls to 127.0.0.1:11434"
  );

  // Also verify Python Compute port 8305 is not called directly from frontend
  const activeComputeCallRegex = /(?:fetch|axios|\.open|WebSocket|EventSource)\s*\(\s*['"`]https?:\/\/(?:127\.0\.0\.1|localhost):8305/i;
  assert.strictEqual(
    activeComputeCallRegex.test(appJs),
    false,
    "Frontend app.js must never make direct network calls to 127.0.0.1:8305"
  );
});
