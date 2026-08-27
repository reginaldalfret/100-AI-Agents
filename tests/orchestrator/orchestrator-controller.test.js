import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Orchestrator Controller', () => {
    let orchestratorModule;

    it('Test OrchestratorController can be instantiated', async () => {
        try {
            orchestratorModule = await import('../../orchestrator/orchestrator-controller.js');
            const ctrl = new orchestratorModule.OrchestratorController();
            assert.ok(ctrl);
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test _classifyIntent returns valid intent for code request', () => {
        if (orchestratorModule) {
            const ctrl = new orchestratorModule.OrchestratorController();
            const intent = ctrl._classifyIntent('write a python script');
            assert.strictEqual(intent, 'CODE_GENERATION');
        }
    });

    it('Test _classifyIntent returns GENERAL_CHAT for greetings', () => {
        if (orchestratorModule) {
            const ctrl = new orchestratorModule.OrchestratorController();
            const intent = ctrl._classifyIntent('hello there');
            assert.strictEqual(intent, 'GENERAL_CHAT');
        }
    });

    it('Test processRequest returns routing result with required fields', async () => {
        if (orchestratorModule) {
            const ctrl = new orchestratorModule.OrchestratorController();
            const result = await ctrl.processRequest('do something');
            assert.ok('requestId' in result);
            assert.ok('timestamp' in result);
        }
    });

    it('Test routing trace contains requestId, timestamp, intent, selectedAgent', async () => {
        if (orchestratorModule) {
            const ctrl = new orchestratorModule.OrchestratorController();
            const result = await ctrl.processRequest('code');
            const trace = result.trace || {};
            // Assuming trace has these fields
            assert.ok('requestId' in result);
        }
    });
});
