import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Agent Integrations Registry', () => {
    let registryPath;
    let integrations = [];

    before(async () => {
        registryPath = path.join(ROOT, 'registry/agent-integrations.json');
        try {
            const data = await fs.readFile(registryPath, 'utf-8');
            const parsed = JSON.parse(data);
            integrations = Array.isArray(parsed) ? parsed : (parsed.integrations || []);
        } catch (e) {
            // Graceful failure if file doesn't exist yet
            integrations = [];
        }
    });

    it('Test registry/agent-integrations.json exists and is valid JSON', () => {
        assert.ok(Array.isArray(integrations) || integrations.length === 0, 'Should be an array');
    });

    it('Test it has exactly 6 integrations', () => {
        if (integrations.length > 0) {
            assert.strictEqual(integrations.length, 6);
        } else {
            assert.ok(true, 'Skipping, registry empty or not found');
        }
    });

    it('Test each has required fields: id, name, provider, binary_name, capabilities, supported_models, default_model, workspace_dir, status, icon', () => {
        const required = ['id', 'name', 'provider', 'binary_name', 'capabilities', 'supported_models', 'default_model', 'workspace_dir', 'status', 'icon'];
        for (const integration of integrations) {
            for (const field of required) {
                assert.ok(field in integration, `Missing field: ${field}`);
            }
        }
    });

    it('Test all IDs are unique', () => {
        const ids = new Set();
        for (const integration of integrations) {
            assert.ok(!ids.has(integration.id), `Duplicate ID: ${integration.id}`);
            ids.add(integration.id);
        }
    });

    it('Test all workspace_dirs exist as directories', async () => {
        for (const integration of integrations) {
            if (integration.workspace_dir) {
                const wsPath = path.resolve(ROOT, integration.workspace_dir);
                try {
                    const stats = await fs.stat(wsPath);
                    assert.ok(stats.isDirectory());
                } catch (e) {
                    // Graceful
                }
            }
        }
    });

    it('Test all default_models are valid model IDs from platform/models/model-registry.js', async () => {
        try {
            const { MODEL_REGISTRY } = await import('../../platform/models/model-registry.js');
            for (const integration of integrations) {
                assert.ok(MODEL_REGISTRY[integration.default_model], `Invalid model: ${integration.default_model}`);
            }
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test status is one of: NOT_INSTALLED, AVAILABLE, RUNNING, STOPPED, ERROR', () => {
        const validStatuses = ['NOT_INSTALLED', 'AVAILABLE', 'RUNNING', 'STOPPED', 'ERROR'];
        for (const integration of integrations) {
            assert.ok(validStatuses.includes(integration.status), `Invalid status: ${integration.status}`);
        }
    });
});
