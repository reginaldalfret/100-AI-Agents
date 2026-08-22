import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const services = [
  { name: 'Gateway', path: 'platform/gateway/src/server.js', port: 8300 },
  { name: 'Agent 001 (Writing)', path: 'agents/agent-001-writing-agent/backend/src/server.js', port: 8101 },
  { name: 'Agent 002 (Email)', path: 'agents/agent-002-email-agent/backend/src/server.js', port: 8102 },
  { name: 'Agent 021 (Web Research)', path: 'agents/agent-021-web-research-agent/backend/src/server.js', port: 8121 },
  { name: 'Agent 045 (PDF Processing)', path: 'agents/agent-045-pdf-processing-agent/backend/src/server.js', port: 8145 },
  { name: 'Agent 055 (Code Review)', path: 'agents/agent-055-code-review-agent/backend/src/server.js', port: 8155 },
  { name: 'Agent 084 (Business Analyst)', path: 'agents/agent-084-business-analyst-agent/backend/src/server.js', port: 8184 },
  { name: 'Agent 101 (Master Agent)', path: 'agents/agent-101-master-agent/backend/src/server.js', port: 8201 }
];

const children = [];

for (const svc of services) {
  const fullPath = path.join(ROOT, svc.path);
  const child = spawn(process.execPath, [fullPath], {
    cwd: ROOT,
    env: {
      ...process.env,
      OLLAMA_MODEL: 'nemotron-3-nano',
      OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
      PROJECT_ROOT: ROOT
    },
    stdio: 'inherit'
  });

  child.on('error', (err) => {
    console.error(`[${svc.name}] Failed to start:`, err);
  });

  children.push({ ...svc, child });
  console.log(`[Fleet] Spawned ${svc.name} on port ${svc.port} (PID ${child.pid})`);
}

process.on('SIGINT', () => {
  console.log('Stopping fleet...');
  for (const c of children) {
    try { c.child.kill(); } catch {}
  }
  process.exit(0);
});
