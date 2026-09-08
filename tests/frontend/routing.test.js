import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Frontend React Router View Isolation Tests', () => {
  const routesPath = path.resolve('platform/web/src/app/routes.tsx');

  it('routes.tsx defines sibling routes under AppShell', () => {
    assert.ok(fs.existsSync(routesPath));
    const content = fs.readFileSync(routesPath, 'utf8');
    assert.ok(content.includes('path="arena"'));
    assert.ok(content.includes('path="personal-style"'));
    assert.ok(content.includes('path="agents"'));
    assert.ok(content.includes('path="datasets"'));
    assert.ok(content.includes('path="fine-tuning"'));
  });

  it('root route redirects to /agents', () => {
    const content = fs.readFileSync(routesPath, 'utf8');
    assert.ok(content.includes('to="/agents"'));
  });

  it('routes are true sibling views with no nested feature views', () => {
    const content = fs.readFileSync(routesPath, 'utf8');
    assert.ok(!content.includes('path="arena" element={<AgentWorkspace'));
    assert.ok(!content.includes('path="personal-style" element={<AgentWorkspace'));
  });
});
