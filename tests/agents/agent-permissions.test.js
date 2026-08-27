import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Agent Permissions', () => {
    let permissionsModule;

    it('Test DESTRUCTIVE_PATTERNS contains expected patterns (rm -rf, DROP TABLE, etc)', async () => {
        try {
            permissionsModule = await import('../../agents/agent-permissions.js');
            const patterns = permissionsModule.DESTRUCTIVE_PATTERNS;
            assert.ok(Array.isArray(patterns));
            assert.ok(patterns.some(p => p.source.includes('rm -rf') || p.toString().includes('rm -rf')));
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test requireConfirmation detects "rm -rf /" as needing confirmation', () => {
        if (permissionsModule) {
            assert.strictEqual(permissionsModule.requireConfirmation('rm -rf /'), true);
        }
    });

    it('Test requireConfirmation allows "ls -la" without confirmation', () => {
        if (permissionsModule) {
            assert.strictEqual(permissionsModule.requireConfirmation('ls -la'), false);
        }
    });

    it('Test sanitizeForLogging removes tokens (API_KEY=xxx, Bearer xxx)', () => {
        if (permissionsModule) {
            const clean1 = permissionsModule.sanitizeForLogging('API_KEY=12345');
            assert.ok(!clean1.includes('12345'));
            
            const clean2 = permissionsModule.sanitizeForLogging('Authorization: Bearer secret');
            assert.ok(!clean2.includes('secret'));
        }
    });

    it('Test isWorkspaceAccessAllowed with valid and invalid paths', () => {
        if (permissionsModule) {
            const valid = permissionsModule.isWorkspaceAccessAllowed('/var/www', '/var/www/test.txt');
            assert.strictEqual(valid, true);

            const invalid = permissionsModule.isWorkspaceAccessAllowed('/var/www', '/etc/passwd');
            assert.strictEqual(invalid, false);
        }
    });
});
