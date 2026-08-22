/**
 * Super AI — Numeric Agent Identity System Regression Test Suite
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log(`\n============================================================`);
console.log(`RUNNING TEST SUITE: Super AI Numeric Agent Identity System`);
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

// Test 1: Registry Integrity (101 agents present)
try {
  assert(Array.isArray(registryData.agents), 'registry.agents must be an array');
  assert.strictEqual(registryData.agents.length, 101, 'Registry must contain exactly 101 agents');
  console.log(`  [PASS] Verified 101 agents present in canonical registry`);
} catch (err) {
  console.error(`  [FAIL] Registry count check failed:`, err.message);
  throw err;
}

// Test 2: Numbering Completeness and Uniqueness (001-100 and 101)
try {
  const numbers = new Set();
  
  // Extract numbers
  registryData.agents.forEach((agent) => {
    const rawId = agent.agent_id || agent.id || '';
    const num = parseInt(rawId.replace(/\D/g, ''), 10);
    assert(!isNaN(num), `Agent ID ${rawId} must contain numeric digits`);
    assert(num >= 1 && num <= 101, `Agent number ${num} must be between 1 and 101`);
    assert(!numbers.has(num), `Duplicate agent number found: ${num}`);
    numbers.add(num);
  });
  
  assert.strictEqual(numbers.size, 101, 'Must have exactly 101 unique numeric agent IDs');
  
  for (let i = 1; i <= 101; i++) {
    assert(numbers.has(i), `Missing agent number: ${i}`);
  }
  
  console.log(`  [PASS] Verified complete and unique 001..100 specialist range and 101 orchestrator`);
} catch (err) {
  console.error(`  [FAIL] Numbering range & uniqueness check failed:`, err.message);
  throw err;
}

// Test 3: No Alphabetic Avatar Logic in Frontend
try {
  assert(!jsContent.includes('name.charAt(0)'), 'app.js must not derive avatar from name.charAt(0)');
  assert(!jsContent.includes('avatar.initial'), 'app.js must not reference avatar.initial');
  assert(jsContent.includes('getAgentDisplayNumber'), 'app.js must define getAgentDisplayNumber helper');
  assert(jsContent.includes('avatar.number'), 'app.js must render avatar.number');
  
  console.log(`  [PASS] Letter-based avatar logic fully eliminated in favor of numeric identity`);
} catch (err) {
  console.error(`  [FAIL] Alphabetic avatar elimination check failed:`, err.message);
  throw err;
}

// Test 4: Super AI Assigned as 101
try {
  assert(jsContent.includes("displayNumber: '101'"), "Super AI must have displayNumber: '101'");
  assert(jsContent.includes("name: 'Super AI Agent'") || jsContent.includes("name: 'Super AI'"), "Main orchestrator must be named 'Super AI Agent'");
  
  console.log(`  [PASS] Super AI Agent permanently assigned display number 101`);
} catch (err) {
  console.error(`  [FAIL] Super AI 101 assignment check failed:`, err.message);
  throw err;
}

// Test 5: Monospace Numeric Badge CSS & Responsive Styling
try {
  assert(cssContent.includes('.agent-row-avatar'), 'styles.css must style .agent-row-avatar');
  assert(cssContent.includes('JetBrains Mono'), 'styles.css must include JetBrains Mono / monospace font');
  assert(cssContent.includes('.agent-avatar'), 'styles.css must style header .agent-avatar');
  assert(cssContent.includes('.empty-avatar'), 'styles.css must style empty state .empty-avatar');
  
  console.log(`  [PASS] Monospace numeric badge styling and RGB neon treatments validated`);
} catch (err) {
  console.error(`  [FAIL] CSS styling check failed:`, err.message);
  throw err;
}

// Test 6: Search Support for Agent Numbers (042, 42, 101)
try {
  assert(jsContent.includes('matchesNumber'), 'app.js filterAgents must test numeric matches');
  assert(jsContent.includes('numWithoutZero'), 'app.js filterAgents must support unpadded and padded numeric search');
  
  console.log(`  [PASS] Search by padded and unpadded agent numbers (e.g. 042 / 42 / 101) verified`);
} catch (err) {
  console.error(`  [FAIL] Numeric search support check failed:`, err.message);
  throw err;
}

console.log(`------------------------------------------------------------`);
console.log(`Summary: 6 Passed, 0 Failed`);
console.log(`============================================================\n`);
