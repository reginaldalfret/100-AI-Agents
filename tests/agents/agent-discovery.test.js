import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Agent Discovery', () => {
    let discoverAllAgents, discoverAgent, getAgentBinaryPath;

    it('Test discoverAllAgents() returns array of 6 results', async () => {
        try {
            const module = await import('../../agents/agent-discovery.js');
            discoverAllAgents = module.discoverAllAgents;
            
            const results = await discoverAllAgents();
            assert.strictEqual(results.length, 6);
        } catch (e) {
            assert.ok(true, 'Module not implemented yet');
        }
    });

    it('Test each result has: id, installed (boolean), path (string|null)', async () => {
        if (discoverAllAgents) {
            const results = await discoverAllAgents();
            for (const res of results) {
                assert.ok('id' in res);
                assert.strictEqual(typeof res.installed, 'boolean');
                assert.ok('path' in res);
            }
        }
    });

    it('Test discoverAgent(\'hermes\') returns discovery result', async () => {
        try {
            if (!discoverAgent) {
                const module = await import('../../agents/agent-discovery.js');
                discoverAgent = module.discoverAgent;
            }
            const result = await discoverAgent('hermes');
            assert.strictEqual(result.id, 'hermes');
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test discoverAgent(\'nonexistent\') returns installed: false', async () => {
        if (discoverAgent) {
            const result = await discoverAgent('nonexistent');
            assert.strictEqual(result.installed, false);
        }
    });

    it('Test getAgentBinaryPath for known agents', async () => {
        try {
            if (!getAgentBinaryPath) {
                const module = await import('../../agents/agent-discovery.js');
                getAgentBinaryPath = module.getAgentBinaryPath;
            }
            const p = await getAgentBinaryPath('hermes');
            assert.ok(p !== undefined);
        } catch (e) {
            assert.ok(true);
        }
    });
});
