import test from 'node:test';
import assert from 'node:assert/strict';
import { runLocalModel } from '../../platform/models/model-streamer.js';

test('Multi-Runtime Output Decoding & Special Tokens Stripping', async () => {
  const res = await runLocalModel({
    model: 'rwkv7-0.4b',
    prompt: 'Say hello.',
    options: { max_tokens: 15 }
  });

  assert.ok(!res.text.includes('<|im_end|>'), 'Must strip <|im_end|>');
  assert.ok(!res.text.includes('</s>'), 'Must strip </s>');
  assert.ok(!res.text.includes('<|endoftext|>'), 'Must strip <|endoftext|>');
});
