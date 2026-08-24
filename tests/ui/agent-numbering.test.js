/**
 * Super AI — Numeric Agent Identity System Regression Test Suite (301 Workforce)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.env.PROJECT_ROOT || 'E:\\Smart Automation\\100-AI-Agents';

describe('Super AI Numeric Agent Identity System (301 Agents)', () => {
  const registryPath = path.join(PROJECT_ROOT, 'registry', 'agents.json');
  const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

  it('1. Verified 301 agents present in canonical registry', () => {
    assert.ok(Array.isArray(registryData.agents), 'registry.agents must be an array');
    assert.strictEqual(registryData.agents.length, 301, 'Registry must contain exactly 301 agents');
  });

  it('2. Verified complete and unique 001..301 specialist range', () => {
    const numbers = new Set();
    
    registryData.agents.forEach((agent) => {
      const rawId = agent.agent_id || agent.id || '';
      const num = parseInt(rawId.replace(/\D/g, ''), 10);
      assert.ok(!isNaN(num), `Agent ID ${rawId} must contain numeric digits`);
      assert.ok(num >= 1 && num <= 301, `Agent number ${num} must be between 1 and 301`);
      assert.ok(!numbers.has(num), `Duplicate agent number found: ${num}`);
      numbers.add(num);
    });
    
    assert.strictEqual(numbers.size, 301, 'Must have exactly 301 unique numeric agent IDs');
    
    for (let i = 1; i <= 301; i++) {
      assert.ok(numbers.has(i), `Missing agent number: ${i}`);
    }
  });
});
