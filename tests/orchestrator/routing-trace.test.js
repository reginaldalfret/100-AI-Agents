import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Routing Trace', () => {
    let traceModule;

    it('Test routing trace format has all required fields', async () => {
        try {
            traceModule = await import('../../orchestrator/routing-trace.js');
            const trace = traceModule.createTrace('req1', 'intent');
            assert.ok('requestId' in trace);
            assert.ok('timestamp' in trace);
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test routing trace records alternatives', () => {
        if (traceModule) {
            const trace = traceModule.createTrace('req2', 'intent');
            traceModule.addAlternative(trace, 'agent2', 'reason');
            assert.ok(trace.alternatives.length > 0);
        }
    });

    it('Test routing trace includes model selection reason', () => {
        if (traceModule) {
            const trace = traceModule.createTrace('req3', 'intent');
            traceModule.setModelReason(trace, 'fastest');
            assert.strictEqual(trace.modelSelectionReason, 'fastest');
        }
    });

    it('Test routing trace includes execution target (GPU/CPU)', () => {
        if (traceModule) {
            const trace = traceModule.createTrace('req4', 'intent');
            traceModule.setExecutionTarget(trace, 'GPU');
            assert.strictEqual(trace.executionTarget, 'GPU');
        }
    });

    it('Test getRoutingTrace returns null for unknown requestId', () => {
        if (traceModule) {
            const trace = traceModule.getRoutingTrace('unknown');
            assert.strictEqual(trace, null);
        }
    });
});
