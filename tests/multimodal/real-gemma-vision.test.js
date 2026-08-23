import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';

test('Direct Local Google Gemma 3 Multimodal Vision Inference', async () => {
  // Minimal valid 1x1 Red PNG
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const payload = JSON.stringify({
    model: 'gemma3:4b',
    prompt: 'What color is this image? Reply with just the color name.',
    images: [samplePngBase64],
    stream: false,
    options: { num_predict: 32, temperature: 0.1 }
  });

  const resData = await new Promise((resolve, reject) => {
    const req = http.request('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Ollama returned status ${res.statusCode}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  assert.ok(resData.response, 'Gemma 3 must return a non-empty response');
  assert.ok(resData.response.toLowerCase().includes('red'), `Expected response to mention red. Got: "${resData.response}"`);
  assert.strictEqual(resData.model, 'gemma3:4b');
});
