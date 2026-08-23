import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'E:\\Smart Automation\\100-AI-Agents';

describe('301 Super AI Agents — Agent Example Prompts Verification', () => {
  const mappingPath = path.join(ROOT, 'registry', 'sih-agent-mapping.json');
  const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

  it('1. All 301 agents in registry have non-empty example prompts', () => {
    assert.equal(mapping.length, 301, 'Must have exactly 301 agents in mapping');
    for (const a of mapping) {
      assert.ok(Array.isArray(a.examples), `Agent ${a.displayNumber || a.day} must have examples array`);
      assert.ok(a.examples.length >= 2, `Agent ${a.displayNumber || a.day} (${a.name}) must have at least 2 examples`);
      for (const ex of a.examples) {
        assert.ok(typeof ex === 'string' && ex.trim().length > 5, `Example in ${a.name} must be non-empty`);
      }
    }
  });

  it('2. Baseline agents retain educational and domain examples', () => {
    const agent1 = mapping.find(a => a.day === 1);
    assert.ok(agent1.examples.some(e => e.toLowerCase().includes('article') || e.toLowerCase().includes('proposal')));
  });
});
