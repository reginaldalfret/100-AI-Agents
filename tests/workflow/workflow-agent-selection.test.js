import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('3. Exact Canonical Agent Discovery: Maps technologies to canonical specialists', () => {
  const engine = new SuperAIWorkflowEngine();
  
  const cpp = engine.discoverSpecialist('C++', 'coding', 'c++-coding');
  assert.ok(cpp.name.includes('C++') || cpp.agent_id === 'agent-113' || cpp.agent_id === 'agent-057');
  
  const java = engine.discoverSpecialist('Java', 'coding', 'java-coding');
  assert.ok(java.name.includes('Java') || java.agent_id === 'agent-107' || java.agent_id === 'agent-055');
  
  const python = engine.discoverSpecialist('Python', 'coding', 'python-coding');
  assert.ok(python.name.includes('Python') || python.agent_id === 'agent-101' || python.agent_id === 'agent-043');
  
  const html = engine.discoverSpecialist('HTML', 'markup', 'html-markup');
  assert.ok(html.name.includes('HTML') || html.agent_id === 'agent-160' || html.agent_id === 'agent-071');
  
  const css = engine.discoverSpecialist('CSS', 'styling', 'css-styling');
  assert.ok(css.name.includes('CSS') || css.agent_id === 'agent-157' || css.agent_id === 'agent-072');
  
  const js = engine.discoverSpecialist('JavaScript', 'interaction', 'javascript-coding');
  assert.ok(js.name.includes('JavaScript') || js.agent_id === 'agent-131' || js.agent_id === 'agent-053');
});