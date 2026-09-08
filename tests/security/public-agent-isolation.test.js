import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

// Import platform security modules
import {
  DESTRUCTIVE_PATTERNS,
  requireConfirmation,
  checkPermission,
  checkAgentPermission,
  sanitizeForLogging,
  isWorkspaceAccessAllowed
} from '../../platform/agents/agent-permissions.js';

import {
  NetworkPolicyService,
  networkPolicy
} from '../../platform/agents/network-policy.js';

describe('Public Agent Isolation & RBAC Security Suite', () => {

  describe('1. Destructive Command Blocking (AgentPermissions)', () => {
    test('DESTRUCTIVE_PATTERNS defines regexes for rm -rf, format, DROP TABLE, del /s, TRUNCATE, mkfs', () => {
      assert.ok(Array.isArray(DESTRUCTIVE_PATTERNS), 'DESTRUCTIVE_PATTERNS must be an array');
      assert.ok(DESTRUCTIVE_PATTERNS.length >= 6, 'Must contain at least 6 destructive patterns');

      // Verify specific required patterns
      const hasRmRf = DESTRUCTIVE_PATTERNS.some(p => p.test('rm -rf /'));
      const hasFormat = DESTRUCTIVE_PATTERNS.some(p => p.test('format c:'));
      const hasDropTable = DESTRUCTIVE_PATTERNS.some(p => p.test('DROP TABLE users;'));
      const hasDelS = DESTRUCTIVE_PATTERNS.some(p => p.test('del /s *.*'));
      const hasTruncate = DESTRUCTIVE_PATTERNS.some(p => p.test('TRUNCATE TABLE logs;'));
      const hasMkfs = DESTRUCTIVE_PATTERNS.some(p => p.test('mkfs.ext4 /dev/sda1'));

      assert.ok(hasRmRf, 'Must detect rm -rf destructive commands');
      assert.ok(hasFormat, 'Must detect format drive destructive commands');
      assert.ok(hasDropTable, 'Must detect DROP TABLE destructive SQL commands');
      assert.ok(hasDelS, 'Must detect del /s Windows destructive commands');
      assert.ok(hasTruncate, 'Must detect TRUNCATE TABLE SQL commands');
      assert.ok(hasMkfs, 'Must detect mkfs filesystem creation commands');
    });

    test('requireConfirmation flags destructive commands (rm -rf, format, DROP TABLE)', () => {
      const destructiveCommands = [
        'rm -rf /',
        'rm -rf /var/data',
        'rm -rf node_modules',
        'format c:',
        'format d:',
        'format C:',
        'DROP TABLE users;',
        'drop table student_records;',
        'DROP TABLE IF EXISTS accounts;',
        'TRUNCATE TABLE audit_log;',
        'del /s C:\\Windows\\temp',
        'mkfs.ext4 /dev/sda1',
        'cat malicious > /dev/sda'
      ];

      for (const cmd of destructiveCommands) {
        const check = requireConfirmation('hermes', cmd);
        assert.strictEqual(
          check.needsConfirmation,
          true,
          `Command "${cmd}" must be flagged as needing confirmation`
        );
        assert.ok(
          check.reason.includes('destructive pattern'),
          `Reason for "${cmd}" must indicate destructive pattern match`
        );
        assert.ok(check.pattern instanceof RegExp, `Pattern for "${cmd}" must be a RegExp instance`);
      }
    });

    test('requireConfirmation allows safe, non-destructive commands without confirmation', () => {
      const safeCommands = [
        'ls -la',
        'dir',
        'cat README.md',
        'SELECT * FROM student_records WHERE id = 1;',
        'git status',
        'node -v',
        'npm test',
        'echo "Hello Sovereign AI"'
      ];

      for (const cmd of safeCommands) {
        const check = requireConfirmation('hermes', cmd);
        assert.strictEqual(
          check.needsConfirmation,
          false,
          `Safe command "${cmd}" should NOT require confirmation`
        );
        assert.strictEqual(check.pattern, null, `Pattern should be null for safe command "${cmd}"`);
      }
    });
  });

  describe('2. RBAC & Workspace Directory Isolation', () => {
    test('isWorkspaceAccessAllowed restricts agent access strictly to assigned workspace', () => {
      // Hermes agent workspace is configured as workspace/agents/hermes
      const allowedHermesPath = path.resolve(ROOT_DIR, 'workspace', 'agents', 'hermes', 'output.json');
      assert.strictEqual(
        isWorkspaceAccessAllowed('hermes', allowedHermesPath),
        true,
        'Agent must be allowed to access its own designated workspace directory'
      );

      // Deny lateral access to another agent workspace
      const crossAgentPath = path.resolve(ROOT_DIR, 'workspace', 'agents', 'opencode', 'code.js');
      assert.strictEqual(
        isWorkspaceAccessAllowed('hermes', crossAgentPath),
        false,
        'Agent must NOT be allowed to access another agent workspace directory'
      );

      // Deny root filesystem and OS path traversal attempts
      const rootPath = path.resolve(ROOT_DIR, '.env');
      assert.strictEqual(
        isWorkspaceAccessAllowed('hermes', rootPath),
        false,
        'Agent must NOT be allowed to access repo root files (.env)'
      );

      const sysPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
      assert.strictEqual(
        isWorkspaceAccessAllowed('hermes', sysPath),
        false,
        'Agent must NOT be allowed to access system OS paths'
      );

      // Unknown agent must be rejected
      assert.strictEqual(
        isWorkspaceAccessAllowed('unknown-malicious-agent', allowedHermesPath),
        false,
        'Unregistered agent must be denied workspace access'
      );
    });

    test('checkPermission returns RBAC decision interface', () => {
      const res = checkPermission('hermes', 'EXECUTE', 'tool-calc');
      assert.strictEqual(typeof res.allowed, 'boolean', 'RBAC permission result must have boolean allowed');
      assert.strictEqual(typeof res.reason, 'string', 'RBAC permission result must have string reason');
      assert.strictEqual(checkAgentPermission, checkPermission, 'checkAgentPermission alias must exist');
    });

    test('sanitizeForLogging strips secrets and Bearer tokens', () => {
      const rawHeader = 'Authorization: Bearer mySecretToken1234567890';
      const cleanHeader = sanitizeForLogging(rawHeader);
      assert.ok(!cleanHeader.includes('mySecretToken1234567890'), 'Bearer token value must be stripped');
      assert.ok(cleanHeader.includes('Bearer [REDACTED]'), 'Must replace token with [REDACTED]');

      const rawApiKey = 'OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz1234567890';
      const cleanApiKey = sanitizeForLogging(rawApiKey);
      assert.ok(!cleanApiKey.includes('sk-abcdefghijklmnopqrstuvwxyz1234567890'), 'API key must be stripped');
      assert.ok(cleanApiKey.includes('sk-[REDACTED]'), 'Must replace API key with [REDACTED]');
    });
  });

  describe('3. Network Policy: Strict LOCAL_ONLY Enforcement', () => {
    test('Default network policy is strictly LOCAL_ONLY', () => {
      assert.strictEqual(networkPolicy.getPolicy(), 'LOCAL_ONLY', 'Default policy must be LOCAL_ONLY');
      assert.strictEqual(networkPolicy.isExternalAllowed(), false, 'External connections must be disabled');
    });

    test('Internal agent loopback calls are permitted', () => {
      const localTargets = [
        'http://127.0.0.1:8300',
        'http://127.0.0.1:8300/api/health',
        'http://localhost:8300/api/agent',
        'http://127.0.0.1:11434',
        'http://localhost:11434/api/tags',
        'http://127.0.0.1:8305',
        'http://localhost:8305/health',
        'http://::1:8300'
      ];

      for (const target of localTargets) {
        const validation = networkPolicy.validateEgressAttempt(target);
        assert.strictEqual(
          validation.allowed,
          true,
          `Local loopback call to "${target}" must be allowed`
        );
        assert.strictEqual(
          validation.reason,
          'Local address',
          `Reason for "${target}" should confirm local address`
        );
      }
    });

    test('External egress attempts by internal agents are strictly blocked', () => {
      const externalTargets = [
        'https://api.openai.com/v1/chat/completions',
        'https://api.anthropic.com/v1/messages',
        'https://huggingface.co/api/models',
        'http://198.51.100.1:8080/exfiltrate',
        'http://malicious-telemetry.example.com',
        'https://cloudflare.com'
      ];

      for (const target of externalTargets) {
        const validation = networkPolicy.validateEgressAttempt(target);
        assert.strictEqual(
          validation.allowed,
          false,
          `External egress call to "${target}" must be blocked`
        );
        assert.ok(
          validation.reason.includes('LOCAL_ONLY'),
          `Block reason for "${target}" must mention LOCAL_ONLY policy`
        );
      }

      assert.strictEqual(
        networkPolicy.getExternalCallCount(),
        0,
        'External call count must remain 0 in LOCAL_ONLY mode'
      );
    });

    test('enforceOnProcess strips outbound proxy variables and locks no_proxy', () => {
      const dirtyEnv = {
        PATH: 'C:\\Windows',
        HTTP_PROXY: 'http://proxy.evil.corp:8080',
        HTTPS_PROXY: 'https://proxy.evil.corp:8443',
        http_proxy: 'http://proxy.evil.corp:8080',
        https_proxy: 'https://proxy.evil.corp:8443',
        CUSTOM_VAR: 'preserved'
      };

      const cleanEnv = networkPolicy.enforceOnProcess(dirtyEnv);
      assert.strictEqual(cleanEnv.HTTP_PROXY, undefined, 'HTTP_PROXY must be stripped');
      assert.strictEqual(cleanEnv.HTTPS_PROXY, undefined, 'HTTPS_PROXY must be stripped');
      assert.strictEqual(cleanEnv.http_proxy, undefined, 'http_proxy must be stripped');
      assert.strictEqual(cleanEnv.https_proxy, undefined, 'https_proxy must be stripped');
      assert.strictEqual(cleanEnv.no_proxy, '*', 'no_proxy must be wildcard locked');
      assert.strictEqual(cleanEnv.CUSTOM_VAR, 'preserved', 'Non-proxy variables must be preserved');
    });

    test('Every registered agent integration explicitly enforces LOCAL_ONLY policy', () => {
      const registryPath = path.join(ROOT_DIR, 'registry', 'agent-integrations.json');
      assert.ok(fs.existsSync(registryPath), 'agent-integrations.json registry must exist');

      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      assert.ok(Array.isArray(registry.integrations), 'integrations must be an array');
      assert.ok(registry.integrations.length > 0, 'Must have registered agent integrations');

      for (const agent of registry.integrations) {
        assert.strictEqual(
          agent.network_policy,
          'LOCAL_ONLY',
          `Agent ${agent.id} (${agent.name}) must have network_policy set to LOCAL_ONLY`
        );
      }
    });
  });

});
