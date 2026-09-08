import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.env.PROJECT_ROOT || path.resolve(__dirname, "../..");

test("Cloudflare Config — C:\\Users\\ASUS\\.cloudflared\\config.yml exists and maps superai.reginaldalfret.tech to http://127.0.0.1:8300", () => {
  const explicitPath = "C:\\Users\\ASUS\\.cloudflared\\config.yml";
  const homePath = path.join(os.homedir(), ".cloudflared", "config.yml");
  const configPath = fs.existsSync(explicitPath) ? explicitPath : homePath;

  assert.ok(fs.existsSync(configPath), `Cloudflared config.yml must exist at ${explicitPath} or ${homePath}`);

  const content = fs.readFileSync(configPath, "utf8");

  // Verify hostname mapping
  assert.ok(
    content.includes("superai.reginaldalfret.tech"),
    "config.yml must contain ingress mapping for 'superai.reginaldalfret.tech'"
  );

  assert.ok(
    content.includes("http://127.0.0.1:8300"),
    "config.yml must map superai.reginaldalfret.tech to local gateway service 'http://127.0.0.1:8300'"
  );

  // Validate YAML structure pairs superai hostname to port 8300
  const lines = content.split(/\r?\n/);
  let foundSuperAIBlock = false;
  let routedTo8300 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("hostname:") && line.includes("superai.reginaldalfret.tech")) {
      foundSuperAIBlock = true;
      // Look ahead for service line
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        if (lines[j].includes("service:") && lines[j].includes("http://127.0.0.1:8300")) {
          routedTo8300 = true;
          break;
        }
      }
    }
  }

  assert.ok(foundSuperAIBlock, "Found ingress entry for superai.reginaldalfret.tech");
  assert.ok(routedTo8300, "superai.reginaldalfret.tech ingress service is configured to http://127.0.0.1:8300");
});

test("Cloudflare Config — Verify protocol is http2", () => {
  const explicitPath = "C:\\Users\\ASUS\\.cloudflared\\config.yml";
  const homePath = path.join(os.homedir(), ".cloudflared", "config.yml");
  const configPath = fs.existsSync(explicitPath) ? explicitPath : homePath;

  assert.ok(fs.existsSync(configPath), "config.yml must exist to verify protocol");

  const content = fs.readFileSync(configPath, "utf8");
  const hasHttp2Protocol = /^\s*protocol:\s*http2\s*$/m.test(content);

  assert.ok(hasHttp2Protocol, "config.yml must explicitly specify 'protocol: http2'");
});

test("Cloudflare Config — .gitignore excludes .cloudflared and *.pem, *.key", () => {
  const gitignorePath = path.join(ROOT_DIR, ".gitignore");
  assert.ok(fs.existsSync(gitignorePath), ".gitignore must exist in root repository directory");

  const content = fs.readFileSync(gitignorePath, "utf8");
  const lines = content.split(/\r?\n/).map(l => l.trim());

  const excludesCloudflared = lines.some(l => l === ".cloudflared/" || l === ".cloudflared" || l.startsWith(".cloudflared"));
  const excludesPem = lines.some(l => l === "*.pem");
  const excludesKey = lines.some(l => l === "*.key");

  assert.ok(excludesCloudflared, ".gitignore must exclude '.cloudflared' or '.cloudflared/'");
  assert.ok(excludesPem, ".gitignore must exclude '*.pem'");
  assert.ok(excludesKey, ".gitignore must exclude '*.key'");
});
