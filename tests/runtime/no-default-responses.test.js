import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../');

test('1. Production Codebase Scan: Zero hardcoded palindrome or canned code in production engine', () => {
  const enginePath = path.join(ROOT, 'platform/workflow-engine/super-ai-workflow-engine.js');
  const engineContent = fs.readFileSync(enginePath, 'utf8');

  // Assert no hardcoded palindrome templates
  assert.ok(!engineContent.includes('racecar'), 'Must not contain hardcoded racecar palindrome');
  assert.ok(!engineContent.includes('A man, a plan, a canal, Panama'), 'Must not contain hardcoded Panama palindrome string');
  assert.ok(!engineContent.includes('Precision Caliper'), 'Must not contain hardcoded product list in engine');
  assert.ok(!engineContent.includes('STORE-PRO'), 'Must not contain hardcoded STORE-PRO HTML');
});

test('2. Production Safeguard: Rejects execution if canned/default source is detected', async () => {
  const { SuperAIWorkflowEngine } = await import('../../platform/workflow-engine/super-ai-workflow-engine.js');
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Test multi-agent execution');

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async () => ({
      code: 'test',
      source: 'default' // Prohibited source in production
    })
  });

  assert.equal(result.status, 'FAILED');
  const failedSubtask = result.executionRecords[0];
  assert.equal(failedSubtask.status, 'failed');
  assert.ok(failedSubtask.error.includes('PRODUCTION_DEFAULT_RESPONSE_FORBIDDEN'), 'Must flag PRODUCTION_DEFAULT_RESPONSE_FORBIDDEN');
});
