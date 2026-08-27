import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Falcon3 1B — Health & Runtime Availability', () => {
  it('verifies Ollama lists falcon3:1b-instruct-q4_K_M in /api/tags', async () => {
    const res = await fetch('http://127.0.0.1:11434/api/tags');
    assert.strictEqual(res.status, 200, 'Ollama must return 200');
    const data = await res.json();
    const falcon = data.models.find(m => m.name.includes('falcon3') || m.model.includes('falcon3'));
    assert.ok(falcon, 'Falcon3 model must be loaded in Ollama');
  });

  it('verifies Falcon3 responds to /api/generate without error', async () => {
    const res = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'falcon3:1b-instruct-q4_K_M',
        prompt: 'Say OK',
        stream: false,
        options: { num_predict: 10 }
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.response && data.response.length > 0, 'Must return valid response');
  });
});
