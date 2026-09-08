import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

describe('Model Arena Model Selection', () => {
  const registryPath = path.join(ROOT, 'platform', 'models', 'model-registry.js');
  const servicePath = path.join(ROOT, 'platform', 'model-arena', 'model-arena-service.js');
  let registryContent, serviceContent;
  
  it('loads source files', () => {
    registryContent = fs.readFileSync(registryPath, 'utf8');
    serviceContent = fs.readFileSync(servicePath, 'utf8');
  });
  
  it('all default arena models exist in registry', () => {
    const defaults = [
      'nemotron-3-nano', 'gemma3-1b', 'local-code-specialist',
      'llama3.2-1b', 'granite4-1b-h', 'phi4-mini',
      'smollm2-1.7b', 'falcon3-1b-instruct'
    ];
    for (const id of defaults) {
      assert.ok(registryContent.includes(id), `Model ${id} should exist in registry`);
    }
  });
  
  it('all default models are GPU execution target', () => {
    // Parse model entries and verify they have GPU execution target
    for (const id of ['nemotron-3-nano', 'gemma3-1b', 'local-code-specialist', 'llama3.2-1b', 'granite4-1b-h', 'phi4-mini', 'smollm2-1.7b', 'falcon3-1b-instruct']) {
      const modelRegex = new RegExp(`model_id:\\s*["']${id}["'][\\s\\S]*?execution_target:\\s*["'](\\w+)["']`);
      const match = registryContent.match(modelRegex);
      assert.ok(match, `Should find execution_target for ${id}`);
      assert.equal(match[1], 'GPU', `${id} should be GPU target`);
    }
  });
  
  it('no default model exceeds 4GB VRAM', () => {
    for (const id of ['nemotron-3-nano', 'gemma3-1b', 'local-code-specialist', 'llama3.2-1b', 'granite4-1b-h', 'phi4-mini', 'smollm2-1.7b', 'falcon3-1b-instruct']) {
      const modelRegex = new RegExp(`model_id:\\s*["']${id}["'][\\s\\S]*?vram_mb:\\s*(\\d+)`);
      const match = registryContent.match(modelRegex);
      assert.ok(match, `Should find vram_mb for ${id}`);
      const vram = parseInt(match[1]);
      assert.ok(vram <= 4096, `${id} VRAM ${vram}MB should be <= 4096MB`);
    }
  });
  
  it('service does not include PERSONAL_STYLE models by default', () => {
    assert.ok(!serviceContent.includes('301-kaviya-style'), 'Should not include personal style models in defaults');
  });
  
  it('all default models use Ollama runtime', () => {
    for (const id of ['nemotron-3-nano', 'gemma3-1b', 'local-code-specialist', 'llama3.2-1b', 'granite4-1b-h', 'phi4-mini', 'smollm2-1.7b', 'falcon3-1b-instruct']) {
      const modelRegex = new RegExp(`model_id:\\s*["']${id}["'][\\s\\S]*?runtime_type:\\s*RuntimeType\\.(\\w+)`);
      const match = registryContent.match(modelRegex);
      assert.ok(match, `Should find runtime_type for ${id}`);
      assert.equal(match[1], 'OLLAMA', `${id} should use OLLAMA runtime`);
    }
  });
});
