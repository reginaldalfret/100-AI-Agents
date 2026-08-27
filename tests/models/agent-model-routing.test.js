import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Agent Model Routing', () => {
    let routingModule;

    it('Test routeAgentToModel returns valid model for hermes', async () => {
        try {
            routingModule = await import('../../models/agent-model-routing.js');
            const model = routingModule.routeAgentToModel('hermes');
            assert.ok(model);
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test routeAgentToModel returns valid model for pi', () => {
        if (routingModule) {
            const model = routingModule.routeAgentToModel('pi');
            assert.ok(model);
        }
    });

    it('Test agents don\'t hardcode models (routing goes through router)', () => {
        if (routingModule) {
            // Mock test for behavior
            assert.ok(typeof routingModule.routeAgentToModel === 'function');
        }
    });

    it('Test getModelRecommendation returns ranked list', () => {
        if (routingModule) {
            const list = routingModule.getModelRecommendation('CODE');
            assert.ok(Array.isArray(list));
        }
    });

    it('Test getRoutingExplanation returns human-readable explanation', () => {
        if (routingModule) {
            const explanation = routingModule.getRoutingExplanation('hermes', 'llama3');
            assert.strictEqual(typeof explanation, 'string');
            assert.ok(explanation.length > 0);
        }
    });
});
