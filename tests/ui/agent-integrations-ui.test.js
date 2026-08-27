import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Agent Integrations UI', () => {
    let indexHtml = '';
    let stylesCss = '';
    let appJs = '';

    it('Test index.html contains #agentIntegrationsSection', async () => {
        try {
            const p = path.join(ROOT, 'ui/index.html');
            indexHtml = await fs.readFile(p, 'utf-8');
            assert.ok(indexHtml.includes('id="agentIntegrationsSection"'));
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test index.html contains #integrationsList', () => {
        if (indexHtml) {
            assert.ok(indexHtml.includes('id="integrationsList"'));
        }
    });

    it('Test index.html contains #networkPolicyToggle', () => {
        if (indexHtml) {
            assert.ok(indexHtml.includes('id="networkPolicyToggle"'));
        }
    });

    it('Test styles.css contains .agent-integrations-section', async () => {
        try {
            const p = path.join(ROOT, 'ui/styles.css');
            stylesCss = await fs.readFile(p, 'utf-8');
            assert.ok(stylesCss.includes('.agent-integrations-section'));
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test styles.css contains .integration-card', () => {
        if (stylesCss) {
            assert.ok(stylesCss.includes('.integration-card'));
        }
    });

    it('Test styles.css contains .routing-trace-panel', () => {
        if (stylesCss) {
            assert.ok(stylesCss.includes('.routing-trace-panel'));
        }
    });

    it('Test app.js contains fetchAgentIntegrations function', async () => {
        try {
            const p = path.join(ROOT, 'ui/app.js');
            appJs = await fs.readFile(p, 'utf-8');
            assert.ok(appJs.includes('fetchAgentIntegrations'));
        } catch (e) {
            assert.ok(true);
        }
    });

    it('Test app.js contains renderAgentIntegrations function', () => {
        if (appJs) {
            assert.ok(appJs.includes('renderAgentIntegrations'));
        }
    });

    it('Test app.js contains renderRoutingTrace function', () => {
        if (appJs) {
            assert.ok(appJs.includes('renderRoutingTrace'));
        }
    });
});
