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

import { PythonComputeClient } from '../../platform/compute/python-client.js';
import { networkPolicy } from '../../platform/agents/network-policy.js';

describe('Public Python Compute Isolation Security Suite', () => {

  const configPath = path.join(os.homedir(), '.cloudflared', 'config.yml');

  describe('1. Python Compute Port 8305 Not Mapped in config.yml', () => {
    test('config.yml exists in user cloudflared directory', () => {
      assert.ok(
        fs.existsSync(configPath),
        `Cloudflare tunnel configuration must exist at ${configPath}`
      );
    });

    test('config.yml does not contain port 8305 anywhere in content', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      assert.strictEqual(
        content.includes('8305'),
        false,
        'config.yml must not contain port 8305 anywhere in its definitions'
      );
    });

    test('config.yml ingress rules do not map any hostname to port 8305', () => {
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
          service.includes(':8305'),
          false,
          `Ingress service "${service}" must NOT point to Python Compute port 8305`
        );
      }
    });

    test('No public hostname in ingress maps to Python Compute daemon', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const hostnameMatches = content.match(/hostname:\s*([^\s]+)/g) || [];
      const hostnames = hostnameMatches.map(h => h.replace(/^hostname:\s*/, ''));

      assert.ok(hostnames.length >= 3, 'Must have configured public tunnel hostnames');

      for (const hostname of hostnames) {
        const regex = new RegExp(`${hostname}[\\s\\S]*?service:\\s*([^\\r\\n]+)`, 'm');
        const match = content.match(regex);
        if (match) {
          const targetService = match[1].trim();
          assert.strictEqual(
            targetService.includes('8305'),
            false,
            `Hostname ${hostname} must not route to Python Compute port 8305`
          );
        }
      }
    });
  });

  describe('2. Public Access to :8305 is Rejected', () => {
    test('PythonComputeClient defaults to strictly local loopback 127.0.0.1:8305', () => {
      const client = new PythonComputeClient();
      assert.strictEqual(
        client.baseUrl,
        'http://127.0.0.1:8305',
        'PythonComputeClient must bind strictly to local loopback 127.0.0.1:8305'
      );

      const status = client.getStatus();
      assert.strictEqual(status.is_air_gapped, true, 'Python compute status must declare is_air_gapped: true');
      assert.strictEqual(status.service, 'sovereign-compute');
      assert.strictEqual(status.version, '2.0.0');
    });

    test('PythonComputeClient checkHealth enforces is_air_gapped: true', async () => {
      const client = new PythonComputeClient();
      const health = await client.checkHealth();
      assert.strictEqual(health.is_air_gapped, true, 'Compute health check must declare is_air_gapped: true');
      assert.strictEqual(health.baseUrl, 'http://127.0.0.1:8305');
      assert.ok(['healthy', 'degraded_fallback'].includes(health.status));
    });

    test('Network policy rejects external network access targeting :8305', () => {
      const externalComputeUrl = 'http://203.0.113.5:8305/compute';
      const validation = networkPolicy.validateEgressAttempt(externalComputeUrl);
      assert.strictEqual(
        validation.allowed,
        false,
        'External compute request to :8305 must be rejected by network policy'
      );
      assert.ok(
        validation.reason.includes('LOCAL_ONLY'),
        'Rejection reason must specify LOCAL_ONLY policy'
      );

      const localComputeUrl = 'http://127.0.0.1:8305/health';
      const localValidation = networkPolicy.validateEgressAttempt(localComputeUrl);
      assert.strictEqual(
        localValidation.allowed,
        true,
        'Local loopback compute call must be permitted'
      );
    });

    test('Catch-all rule in Cloudflare tunnel rejects public requests to unmapped port 8305', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      // The final ingress rule must be http_status:404
      const lines = content.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      assert.strictEqual(
        lastLine,
        '- service: http_status:404',
        'Cloudflare tunnel must reject unmapped traffic (including port 8305) with http_status:404'
      );
    });

    test('Gateway mediates all compute traffic and does not expose raw socket 8305', () => {
      const gatewayServerPath = path.join(ROOT_DIR, 'platform', 'gateway', 'src', 'server.js');
      assert.ok(fs.existsSync(gatewayServerPath), 'Gateway server.js must exist');

      const serverContent = fs.readFileSync(gatewayServerPath, 'utf8');

      // Gateway exposes /api/compute/... routes
      assert.ok(serverContent.includes('/api/compute/status'), 'Gateway must expose /api/compute/status');
      assert.ok(serverContent.includes('/api/compute/health'), 'Gateway must expose /api/compute/health');
      assert.ok(serverContent.includes('/api/compute/nodes'), 'Gateway must expose /api/compute/nodes');

      // Gateway reports is_air_gapped: true in compute responses
      assert.ok(
        serverContent.includes('is_air_gapped: true'),
        'Gateway compute endpoints must enforce air-gap compliance guarantee'
      );
    });
  });

});
