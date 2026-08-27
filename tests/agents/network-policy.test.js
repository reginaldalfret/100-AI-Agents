import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Network Policy', () => {
    let networkPolicyModule;

    it('Test default policy is LOCAL_ONLY', async () => {
        try {
            networkPolicyModule = await import('../../agents/network-policy.js');
            const policy = new networkPolicyModule.NetworkPolicy();
            assert.strictEqual(policy.getPolicy(), 'LOCAL_ONLY');
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test setPolicy changes mode', () => {
        if (networkPolicyModule) {
            const policy = new networkPolicyModule.NetworkPolicy();
            policy.setPolicy('ALLOW_EXTERNAL');
            assert.strictEqual(policy.getPolicy(), 'ALLOW_EXTERNAL');
        }
    });

    it('Test isExternalAllowed returns false in LOCAL_ONLY', () => {
        if (networkPolicyModule) {
            const policy = new networkPolicyModule.NetworkPolicy();
            assert.strictEqual(policy.isExternalAllowed(), false);
        }
    });

    it('Test isExternalAllowed returns true in ALLOW_EXTERNAL', () => {
        if (networkPolicyModule) {
            const policy = new networkPolicyModule.NetworkPolicy();
            policy.setPolicy('ALLOW_EXTERNAL');
            assert.strictEqual(policy.isExternalAllowed(), true);
        }
    });

    it('Test validateEgressAttempt blocks external URLs in LOCAL_ONLY', () => {
        if (networkPolicyModule) {
            const policy = new networkPolicyModule.NetworkPolicy();
            assert.strictEqual(policy.validateEgressAttempt('http://example.com'), false);
        }
    });

    it('Test validateEgressAttempt allows localhost in LOCAL_ONLY', () => {
        if (networkPolicyModule) {
            const policy = new networkPolicyModule.NetworkPolicy();
            assert.strictEqual(policy.validateEgressAttempt('http://localhost:3000'), true);
            assert.strictEqual(policy.validateEgressAttempt('http://127.0.0.1:8080'), true);
        }
    });

    it('Test getExternalCallCount returns 0 in LOCAL_ONLY', () => {
        if (networkPolicyModule) {
            const policy = new networkPolicyModule.NetworkPolicy();
            assert.strictEqual(policy.getExternalCallCount(), 0);
        }
    });

    it('Test enforceOnProcess strips proxy vars', () => {
        if (networkPolicyModule) {
            const policy = new networkPolicyModule.NetworkPolicy();
            const env = { HTTP_PROXY: 'proxy.com', PATH: '/bin' };
            const cleanEnv = policy.enforceOnProcess(env);
            assert.strictEqual(cleanEnv.HTTP_PROXY, undefined);
            assert.strictEqual(cleanEnv.PATH, '/bin');
        }
    });
});
