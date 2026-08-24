import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { LOCAL_MODELS } from '../../platform/models/model-registry.js';

describe('DeepSeek-R1 1.5B Model Removal Verification', () => {
  it('confirms deepseek-r1-1.5b is absent from active production LOCAL_MODELS', () => {
    const deepseek = LOCAL_MODELS.find(m => m.model_id.includes('deepseek') || (m.ollama_name && m.ollama_name.includes('deepseek')));
    assert.strictEqual(deepseek, undefined, 'DeepSeek-R1 must NOT be registered in active production models');
  });

  it('confirms deepseek-r1:1.5b is absent from local Ollama tag list', async () => {
    const models = await new Promise((resolve) => {
      const req = http.request('http://127.0.0.1:11434/api/tags', { method: 'GET' }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve((data.models || []).map(m => m.name));
          } catch {
            resolve([]);
          }
        });
      });
      req.on('error', () => resolve([]));
      req.end();
    });

    assert.ok(!models.some(m => m.includes('deepseek')), `DeepSeek model must not exist in Ollama. Found: ${JSON.stringify(models)}`);
  });
});
