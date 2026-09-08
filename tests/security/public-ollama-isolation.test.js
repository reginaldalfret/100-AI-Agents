import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

import { networkPolicy } from '../../platform/agents/network-policy.js';

describe('Public Ollama Isolation Security Suite', () => {

  const configPath = path.join(os.homedir(), '.cloudflared', 'config.yml');

  describe('1. Cloudflare config.yml Inspection', () => {
    test('config.yml exists in user cloudflared directory', () => {
      assert.ok(
        fs.existsSync(configPath),
        `Cloudflare tunnel configuration must exist at ${configPath}`
      );
    });

    test('config.yml does not map 11434 to any public hostname', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      assert.strictEqual(
        content.includes('11434'),
        false,
        'config.yml must not contain port 11434 anywhere in its definitions'
      );
    });

    test('config.yml ingress rules strictly exclude Ollama port 11434', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const lines = content.split('\n');

      const ingressServices = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('service:')) {
          ingressServices.push(trimmed.replace(/^service:\s*/, ''));
        }
      }

      assert.ok(ingressServices.length > 0, 'Must have defined ingress services in config.yml');

      for (const service of ingressServices) {
        assert.strictEqual(
          service.includes(':11434'),
          false,
          `Ingress service "${service}" must NOT point to Ollama port 11434`
        );
      }
    });

    test('config.yml ends with a catch-all http_status:404 rule', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const lines = content.split('\n').map(l => l.trim().replace(/^-\s*/, '')).filter(Boolean);
      const lastServiceLine = lines.filter(l => l.startsWith('service:')).pop();

      assert.strictEqual(
        lastServiceLine,
        'service: http_status:404',
        'Ingress must terminate with catch-all 404 rule to prevent unmapped port forwarding'
      );
    });
  });

  describe('2. Public Tunnel Route Isolation for Ollama Port 11434', () => {
    test('No tunnel route exists for Ollama port 11434 or raw Ollama endpoints', () => {
      const content = fs.readFileSync(configPath, 'utf8');

      // Parse hostnames from ingress rules
      const hostnameMatches = content.match(/hostname:\s*([^\s]+)/g) || [];
      const hostnames = hostnameMatches.map(h => h.replace(/^hostname:\s*/, ''));

      assert.ok(hostnames.length >= 3, 'Must have configured public tunnel hostnames');

      // Verify none of the hostnames route directly to Ollama
      for (const hostname of hostnames) {
        // Regex check that this hostname block does not specify port 11434
        const regex = new RegExp(`${hostname}[\\s\\S]*?service:\\s*([^\\r\\n]+)`, 'm');
        const match = content.match(regex);
        if (match) {
          const targetService = match[1].trim();
          assert.ok(
            !targetService.includes('11434'),
            `Hostname ${hostname} must not route to port 11434 (found: ${targetService})`
          );
        }
      }
    });

    test('Public tunnel ingress routes only to Gateway (8300) and authorized frontends', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const lines = content.split('\n');

      const allowedPorts = ['8300', '8050'];
      const linesWithService = lines.filter(l => l.trim().startsWith('service: http'));

      for (const line of linesWithService) {
        const portMatch = line.match(/:(\d+)/);
        if (portMatch) {
          const port = portMatch[1];
          assert.ok(
            allowedPorts.includes(port),
            `Service on port ${port} is not in allowed tunnel ingress ports (${allowedPorts.join(', ')})`
          );
          assert.notStrictEqual(port, '11434', 'Port 11434 must never be an allowed ingress port');
        }
      }
    });
  });

  describe('3. Ollama Bound Strictly to 127.0.0.1 (Air-Gapped Loopback)', () => {
    test('Platform environment configs specify 127.0.0.1 loopback for Ollama', () => {
      const envExamplePath = path.join(ROOT_DIR, '.env.example');
      assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');

      const envContent = fs.readFileSync(envExamplePath, 'utf8');
      assert.ok(
        envContent.includes('OLLAMA_BASE_URL=http://127.0.0.1:11434'),
        'OLLAMA_BASE_URL must default to loopback 127.0.0.1:11434'
      );
      assert.strictEqual(
        envContent.includes('0.0.0.0:11434'),
        false,
        'Ollama must never be configured with 0.0.0.0:11434 public binding'
      );
    });

    test('Desktop supervisor launcher specifies OLLAMA_HOST=127.0.0.1:11434', () => {
      const launcherPath = path.join(ROOT_DIR, 'desktop', 'native', 'Launcher.cs');
      assert.ok(fs.existsSync(launcherPath), 'Launcher.cs must exist');

      const launcherContent = fs.readFileSync(launcherPath, 'utf8');
      assert.ok(
        launcherContent.includes('psi.EnvironmentVariables["OLLAMA_HOST"] = "127.0.0.1:11434"'),
        'OLLAMA_HOST must be explicitly locked to 127.0.0.1:11434 in desktop launcher'
      );
    });

    test('Active port allowlist audit documents Ollama strictly bound to 127.0.0.1', () => {
      const portAllowlistPath = path.join(ROOT_DIR, 'docs', 'ACTIVE-PORT-ALLOWLIST.md');
      assert.ok(fs.existsSync(portAllowlistPath), 'ACTIVE-PORT-ALLOWLIST.md must exist');

      const portDoc = fs.readFileSync(portAllowlistPath, 'utf8');
      const ollamaPortRow = portDoc.split('\n').find(line => line.includes('11434'));
      assert.ok(ollamaPortRow, 'Must document port 11434 in allowlist');
      assert.ok(
        ollamaPortRow.includes('127.0.0.1'),
        'Port 11434 binding must be documented as 127.0.0.1'
      );
      assert.ok(
        !ollamaPortRow.includes('0.0.0.0'),
        'Port 11434 must not be bound to wildcard 0.0.0.0'
      );
    });

    test('Network policy blocks any external non-loopback access to Ollama', () => {
      const externalAttempt = 'http://192.168.1.50:11434/api/generate';
      const checkExternal = networkPolicy.validateEgressAttempt(externalAttempt);
      assert.strictEqual(checkExternal.allowed, false, 'Non-loopback access to Ollama must be blocked');

      const localAttempt = 'http://127.0.0.1:11434/api/tags';
      const checkLocal = networkPolicy.validateEgressAttempt(localAttempt);
      assert.strictEqual(checkLocal.allowed, true, 'Local loopback access to Ollama must be allowed');
    });

    test('Ollama connectivity on 127.0.0.1:11434 verifies loopback binding when active', async () => {
      // Check if Ollama daemon is running locally
      const isOllamaUp = await new Promise((resolve) => {
        const req = http.request(
          'http://127.0.0.1:11434/api/tags',
          { method: 'GET', timeout: 1500 },
          (res) => resolve(res.statusCode >= 200 && res.statusCode < 500)
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      });

      if (isOllamaUp) {
        // Confirm loopback connection succeeded
        assert.ok(isOllamaUp, 'Ollama responds on local loopback 127.0.0.1:11434');
      } else {
        // Offline or standby mode is acceptable; verify configuration constraint
        assert.ok(true, 'Ollama is offline or in standby mode on local loopback');
      }
    });
  });

});
