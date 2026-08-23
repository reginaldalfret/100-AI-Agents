/**
 * Super AI — Numeric Agent Identity System Regression Test Suite (301 Workforce)
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log(`\n============================================================`);
console.log(`RUNNING TEST SUITE: Super AI Numeric Agent Identity System (301 Agents)`);
console.log(`============================================================`);

const PROJECT_ROOT = process.cwd();
const htmlPath = path.join(PROJECT_ROOT, 'platform', 'web', 'index.html');
const cssPath = path.join(PROJECT_ROOT, 'platform', 'web', 'styles.css');
const jsPath = path.join(PROJECT_ROOT, 'platform', 'web', 'app.js');
const registryPath = path.join(PROJECT_ROOT, 'registry', 'agents.json');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const jsContent = fs.readFileSync(jsPath, 'utf8');
const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

// Test 1: Registry Integrity (301 agents present)
try {
  assert(Array.isArray(registryData.agents), 'registry.agents must be an array');
  assert.strictEqual(registryData.agents.length, 301, 'Registry must contain exactly 301 agents');
  console.log(`  [PASS] Verified 301 agents present in canonical registry`);
} catch (err) {
  console.error(`  [FAIL] Registry count check failed:`, err.message);
  throw err;
}

// Test 2: Numbering Completeness and Uniqueness (001-301)
try {
  const numbers = new Set();
  
  registryData.agents.forEach((agent) => {
    const rawId = agent.agent_id || agent.id || '';
    const num = parseInt(rawId.replace(/\D/g, ''), 10);
    assert(!isNaN(num), `Agent ID ${rawId} must contain numeric digits`);
    assert(num >= 1 && num <= 301, `Agent number ${num} must be between 1 and 301`);
    assert(!numbers.has(num), `Duplicate agent number found: ${num}`);
    numbers.add(num);
  });
  
  assert.strictEqual(numbers.size, 301, 'Must have exactly 301 unique numeric agent IDs');
  
  for (let i = 1; i <= 301; i++) {
    assert(numbers.has(i), `Missing agent number: ${i}`);
  }
  
  console.log(`  [PASS] Verified complete and unique 001..301 specialist range`);
} catch (err) {
  console.error(`  [FAIL] Numbering range & uniqueness check failed:`, err.message);
  throw err;
}

console.log(`============================================================`);
console.log(`ALL 301 AGENT NUMBERING TESTS PASSED`);
console.log(`============================================================`);
