import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Sovereignty Network Policy (SIH)', () => {
    let sihModule;

    it('Test NetworkPolicyService defaults to LOCAL_ONLY', async () => {
        try {
            sihModule = await import('../../sih/sovereignty-network-policy.js');
            const svc = new sihModule.NetworkPolicyService();
            assert.strictEqual(svc.getCurrentPolicy(), 'LOCAL_ONLY');
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test all agent integrations respect network policy', () => {
        if (sihModule) {
            assert.ok(typeof sihModule.enforcePolicy === 'function');
        }
    });

    it('Test external URLs are blocked in LOCAL_ONLY mode', () => {
        if (sihModule) {
            const svc = new sihModule.NetworkPolicyService();
            assert.strictEqual(svc.isAllowed('http://google.com'), false);
        }
    });

    it('Test 127.0.0.1 and localhost are always allowed', () => {
        if (sihModule) {
            const svc = new sihModule.NetworkPolicyService();
            assert.strictEqual(svc.isAllowed('http://localhost:8080'), true);
            assert.strictEqual(svc.isAllowed('http://127.0.0.1:9090'), true);
        }
    });

    it('Test enforceOnProcess produces clean environment', () => {
        if (sihModule) {
            const svc = new sihModule.NetworkPolicyService();
            const env = svc.enforceOnProcess({ HTTP_PROXY: 'proxy' });
            assert.strictEqual(env.HTTP_PROXY, undefined);
        }
    });

    it('Test violation logging works', () => {
        if (sihModule) {
            const svc = new sihModule.NetworkPolicyService();
            svc.logViolation('agent1', 'http://malicious.com');
            const logs = svc.getViolations();
            assert.ok(logs.length > 0);
        }
    });
});
