import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Frontend API Client Service Tests', () => {
  const apiPath = path.resolve('platform/web/src/services/api.ts');

  it('api.ts exists and exports api object', () => {
    assert.ok(fs.existsSync(apiPath));
    const content = fs.readFileSync(apiPath, 'utf8');
    assert.ok(content.includes('export const api =') || content.includes('export { api }'));
  });

  it('uses relative /api/* URLs without hardcoded hostnames', () => {
    const content = fs.readFileSync(apiPath, 'utf8');
    assert.ok(!content.includes('http://127.0.0.1:8300'));
    assert.ok(!content.includes('http://localhost:8300'));
    assert.ok(content.includes('/api/'));
  });

  it('provides all mandatory service methods', () => {
    const content = fs.readFileSync(apiPath, 'utf8');
    assert.ok(content.includes('getModels'));
    assert.ok(content.includes('getAgents'));
    assert.ok(content.includes('getArenaModels'));
    assert.ok(content.includes('personalStyleChat'));
    assert.ok(content.includes('getDatasets'));
    assert.ok(content.includes('getFineTuneJobs'));
  });
});
