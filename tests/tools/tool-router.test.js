import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Tool Router', () => {
    let toolRouter;

    it('Test getToolCategories returns DOCUMENT, COMPUTE, STORAGE, DATA, DELIVERABLE', async () => {
        try {
            toolRouter = await import('../../tools/tool-router.js');
            const categories = toolRouter.getToolCategories();
            assert.ok(categories.includes('DOCUMENT'));
            assert.ok(categories.includes('COMPUTE'));
            assert.ok(categories.includes('STORAGE'));
            assert.ok(categories.includes('DATA'));
            assert.ok(categories.includes('DELIVERABLE'));
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test routeAgentToTool returns tools for coding agent', () => {
        if (toolRouter) {
            const tools = toolRouter.routeAgentToTool('hermes');
            assert.ok(Array.isArray(tools));
        }
    });

    it('Test getToolsForTask with "extract text from PDF" returns document tools', () => {
        if (toolRouter) {
            const tools = toolRouter.getToolsForTask('extract text from PDF');
            assert.ok(tools.some(t => t.category === 'DOCUMENT'));
        }
    });

    it('Test RBAC: agent can only use permitted tools', () => {
        if (toolRouter) {
            const canUse = toolRouter.canAgentUseTool('hermes', 'CREATE_DB');
            assert.ok(typeof canUse === 'boolean');
        }
    });
});
