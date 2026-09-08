import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

describe('Model Arena API Routes', () => {
  const serverPath = path.join(ROOT, 'platform', 'gateway', 'src', 'server.js');
  let content;
  
  it('server.js exists', () => {
    assert.ok(fs.existsSync(serverPath));
    content = fs.readFileSync(serverPath, 'utf8');
  });
  
  it('imports model arena service', () => {
    assert.ok(content.includes('model-arena'), 'Should import model-arena module');
  });
  
  it('has POST /api/model-arena/compare route', () => {
    assert.ok(content.includes('/api/model-arena/compare'), 'Should have compare route');
  });
  
  it('has GET /api/model-arena/status route', () => {
    assert.ok(content.includes('/api/model-arena/status'), 'Should have status route');
  });
  
  it('has POST /api/model-arena/cancel route', () => {
    assert.ok(content.includes('/api/model-arena/cancel'), 'Should have cancel route');
  });
  
  it('has POST /api/model-arena/clear route', () => {
    assert.ok(content.includes('/api/model-arena/clear'), 'Should have clear route');
  });
  
  it('has GET /api/model-arena/models route', () => {
    assert.ok(content.includes('/api/model-arena/models'), 'Should have models listing route');
  });
  
  it('compare route uses SSE (text/event-stream)', () => {
    assert.ok(content.includes('text/event-stream'), 'Should set SSE content type');
  });
});
