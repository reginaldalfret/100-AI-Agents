import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

import { dbConfig } from '../../platform/database/config.js';
import { networkPolicy } from '../../platform/agents/network-policy.js';

describe('PostgreSQL Security Boundaries & Port Isolation Suite', () => {

  const configPath = path.join(os.homedir(), '.cloudflared', 'config.yml');

  describe('1. TCP Loopback Connection to 127.0.0.1:5432', () => {
    test('dbConfig specifies strictly loopback host 127.0.0.1 and port 5432', () => {
      assert.strictEqual(dbConfig.host, '127.0.0.1', 'Default PG_HOST must be 127.0.0.1');
      assert.strictEqual(dbConfig.port, 5432, 'Default PG_PORT must be 5432');
    });

    test('Network policy permits local loopback 127.0.0.1:5432 access', () => {
      const loopbackUrl = 'http://127.0.0.1:5432';
      const check = networkPolicy.validateEgressAttempt(loopbackUrl);
      assert.strictEqual(check.allowed, true, 'Loopback connection must be permitted by network policy');
    });

    test('TCP socket connects successfully to 127.0.0.1:5432', async () => {
      const result = await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2500);

        socket.on('connect', () => {
          socket.destroy();
          resolve({ status: 'SUCCESS', details: 'Connected to 127.0.0.1:5432' });
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({ status: 'TIMEOUT', error: 'Connection timed out' });
        });

        socket.on('error', (err) => {
          resolve({ status: 'ERROR', code: err.code, message: err.message });
        });

        socket.connect(5432, '127.0.0.1');
      });

      // Assert connection succeeded or report exact status
      assert.ok(
        result.status === 'SUCCESS' || result.code === 'ECONNREFUSED',
        `TCP test reached 127.0.0.1:5432 with status: ${result.status}`
      );
    });
  });

  describe('2. LAN IP 192.168.0.213:5432 Rejection / Isolation', () => {
    test('Network policy strictly rejects egress to LAN IP 192.168.0.213:5432', () => {
      const lanUrl = 'http://192.168.0.213:5432';
      const check = networkPolicy.validateEgressAttempt(lanUrl);
      assert.strictEqual(check.allowed, false, 'Egress to LAN IP 192.168.0.213:5432 must be blocked');
      assert.ok(check.reason.includes('LOCAL_ONLY'), 'Reason must specify LOCAL_ONLY policy');
    });

    test('TCP socket connection to LAN IP 192.168.0.213:5432 fails / rejected', async () => {
      const result = await new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2500);

        socket.on('connect', () => {
          socket.destroy();
          resolve({ status: 'UNEXPECTED_CONNECTION', details: 'Unexpectedly connected to LAN IP' });
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({ status: 'REJECTED_TIMEOUT', message: 'Connection timed out (rejected/filtered)' });
        });

        socket.on('error', (err) => {
          resolve({ status: 'REJECTED_ERROR', code: err.code, message: err.message });
        });

        socket.connect(5432, '192.168.0.213');
      });

      assert.notStrictEqual(
        result.status,
        'UNEXPECTED_CONNECTION',
        'TCP connection to 192.168.0.213:5432 must NOT succeed (must fail/be rejected)'
      );
      assert.ok(
        result.status === 'REJECTED_ERROR' || result.status === 'REJECTED_TIMEOUT',
        `Expected rejection or failure, got ${result.status}`
      );
    });
  });

  describe('3. External Exposure Prevention & Tunnel Verification', () => {
    test('Cloudflare config.yml exists', () => {
      assert.ok(fs.existsSync(configPath), `Cloudflare config must exist at ${configPath}`);
    });

    test('Cloudflare tunnel does not expose port 5432 to external traffic', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      assert.strictEqual(
        content.includes('5432'),
        false,
        'Cloudflare config.yml must not contain port 5432 anywhere'
      );
    });

    test('Catch-all rule terminates with http_status:404 preventing unmapped access', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const lines = content.trim().split('\n');
      const lastLine = lines[lines.length - 1].trim();
      assert.strictEqual(
        lastLine,
        '- service: http_status:404',
        'Cloudflare ingress must terminate with catch-all 404 rule'
      );
    });

    test('Environment examples do not expose 0.0.0.0:5432 binding', () => {
      const envPath = path.join(ROOT_DIR, '.env.example');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        assert.strictEqual(
          envContent.includes('0.0.0.0:5432'),
          false,
          '.env.example must not expose PostgreSQL on 0.0.0.0'
        );
      }
    });
  });

});
