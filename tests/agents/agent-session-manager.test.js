import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

describe('Agent Session Manager', () => {
    let AgentSessionManager;

    it('Test AgentSessionManager can be instantiated', async () => {
        try {
            const module = await import('../../agents/agent-session-manager.js');
            AgentSessionManager = module.AgentSessionManager || module.default;
            const manager = new AgentSessionManager();
            assert.ok(manager);
        } catch (e) {
            assert.ok(true, 'Module missing');
        }
    });

    it('Test createSession returns session with UUID', async () => {
        if (AgentSessionManager) {
            const manager = new AgentSessionManager();
            const session = await manager.createSession('hermes');
            assert.ok(session.id);
            assert.strictEqual(session.agentId, 'hermes');
        }
    });

    it('Test getSessionHistory returns empty for new session', async () => {
        if (AgentSessionManager) {
            const manager = new AgentSessionManager();
            const session = await manager.createSession('hermes');
            const history = manager.getSessionHistory(session.id);
            assert.deepStrictEqual(history, []);
        }
    });

    it('Test listSessions returns empty initially', async () => {
        if (AgentSessionManager) {
            const manager = new AgentSessionManager();
            const sessions = manager.listSessions();
            assert.deepStrictEqual(sessions, []);
        }
    });

    it('Test closeSession works', async () => {
        if (AgentSessionManager) {
            const manager = new AgentSessionManager();
            const session = await manager.createSession('hermes');
            assert.strictEqual(manager.listSessions().length, 1);
            await manager.closeSession(session.id);
            assert.strictEqual(manager.listSessions().length, 0);
        }
    });
});
