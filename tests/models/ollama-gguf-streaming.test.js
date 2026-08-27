import test from 'node:test';
import assert from 'node:assert/strict';
import { modelStreamer } from '../../platform/models/model-streamer.js';

test('Ollama GGUF Streaming with Zero VRAM', async () => {
  let chunks = [];
  await modelStreamer.streamFromOllama({
    model: 'mollysama/rwkv-7-g1d:0.4b',
    prompt: 'Say hello',
    options: { num_gpu: 0, num_predict: 10 },
    onToken: ({ token }) => chunks.push(token)
  });

  assert.ok(chunks.length > 0, 'Should stream chunks from Ollama');
});
