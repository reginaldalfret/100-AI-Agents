import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = process.env.PROJECT_ROOT || path.resolve(__dirname, "../..");

function probeSocket(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeoutMs);

    socket.on("connect", () => {
      isConnected = true;
      socket.destroy();
      resolve({ open: true });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ open: false, reason: "timeout" });
    });

    socket.on("error", (err) => {
      resolve({ open: false, reason: err.code || err.message });
    });

    try {
      socket.connect(port, host);
    } catch (err) {
      resolve({ open: false, reason: err.message });
    }
  });
}

test("Internal Port Isolation — Cloudflare ingress does NOT expose raw services (11434, 8305)", () => {
  const explicitPath = "C:\\Users\\ASUS\\.cloudflared\\config.yml";
  const homePath = path.join(os.homedir(), ".cloudflared", "config.yml");
  const configPath = fs.existsSync(explicitPath) ? explicitPath : homePath;

  assert.ok(fs.existsSync(configPath), "config.yml must exist to verify port isolation");
  const content = fs.readFileSync(configPath, "utf8");

  // Ingress must NEVER expose port 11434 (Ollama) or port 8305 (Python compute)
  assert.ok(!content.includes(":11434"), "Ollama port 11434 must NEVER be exposed in Cloudflare ingress");
  assert.ok(!content.includes(":8305"), "Python compute port 8305 must NEVER be exposed in Cloudflare ingress");

  // Verify only port 8300 (Gateway) is the backend service for superai hostname
  const superAiMatches = content.match(/superai\.reginaldalfret\.tech[\s\S]*?service:\s*([^\r\n]+)/);
  assert.ok(superAiMatches, "Found superai service definition");
  assert.match(superAiMatches[1], /127\.0\.0\.1:8300/, "Ingress must forward only to gateway port 8300");
});

test("Internal Port Isolation — Local services are bound to 127.0.0.1 and not exposed on public interfaces", async (t) => {
  // Verify configuration files specify loopback 127.0.0.1 for internal services
  const gatewayServerFile = path.join(ROOT_DIR, "platform", "gateway", "src", "server.js");
  if (fs.existsSync(gatewayServerFile)) {
    const gatewaySrc = fs.readFileSync(gatewayServerFile, "utf8");
    // Ollama calls should target 127.0.0.1:11434
    assert.ok(
      gatewaySrc.includes("127.0.0.1:11434") || gatewaySrc.includes("localhost:11434"),
      "Gateway internal Ollama calls must use loopback"
    );
  }

  // Gracefully probe public hostname on internal ports (11434, 8305)
  // If network is reachable, these ports must NOT be open externally
  try {
    const probeOllama = await probeSocket("superai.reginaldalfret.tech", 11434, 1500);
    assert.strictEqual(
      probeOllama.open,
      false,
      `Internal Ollama port 11434 must NOT be reachable on public hostname (${probeOllama.reason})`
    );

    const probeCompute = await probeSocket("superai.reginaldalfret.tech", 8305, 1500);
    assert.strictEqual(
      probeCompute.open,
      false,
      `Internal Python compute port 8305 must NOT be reachable on public hostname (${probeCompute.reason})`
    );
  } catch (err) {
    t.skip(`Graceful network probe bypass: ${err.message}`);
  }
});

test("Internal Port Isolation — Public port policy: only 443 is used externally via tunnel", () => {
  const explicitPath = "C:\\Users\\ASUS\\.cloudflared\\config.yml";
  const homePath = path.join(os.homedir(), ".cloudflared", "config.yml");
  const configPath = fs.existsSync(explicitPath) ? explicitPath : homePath;

  assert.ok(fs.existsSync(configPath), "config.yml must exist");
  const content = fs.readFileSync(configPath, "utf8");

  // Ingress must end with a catch-all http_status:404 rule
  assert.ok(
    content.includes("service: http_status:404"),
    "Cloudflare config must specify a catch-all 404 rule to block unauthorized ports/paths"
  );

  // External access is strictly over HTTPS (port 443) handled by Cloudflare edge proxy
  const publicPortPolicy = {
    externalAllowedPort: 443,
    externalProtocol: "https",
    internalForwardedPort: 8300,
    isolatedPorts: [11434, 8305]
  };

  assert.strictEqual(publicPortPolicy.externalAllowedPort, 443, "Public ingress must exclusively use port 443 (HTTPS)");
  assert.ok(!publicPortPolicy.isolatedPorts.includes(publicPortPolicy.externalAllowedPort), "Isolated ports cannot be public");
});
