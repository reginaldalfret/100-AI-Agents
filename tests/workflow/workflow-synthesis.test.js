import { test } from 'node:test';
import assert from 'node:assert';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('10. Unified Synthesis: Combines specialist code blocks with headers and comparison table', () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python.');
  
  const subtaskResults = {
    'subtask-1': {
      status: 'completed',
      technology: 'C++',
      agentName: 'C++ AI Agent',
      result: { code: 'bool isPal(string s) { return true; }', explanation: 'O(n) time complexity' },
      artifacts: [{ filename: 'palindrome.cpp', lines: 1, sizeBytes: 36 }],
      model: 'qwen2.5-coder:1.5b',
      durationMs: 2100
    },
    'subtask-2': {
      status: 'completed',
      technology: 'Java',
      agentName: 'Java AI Agent',
      result: { code: 'public boolean isPal(String s) { return true; }', explanation: 'Two pointer check' },
      artifacts: [{ filename: 'Palindrome.java', lines: 1, sizeBytes: 44 }],
      model: 'qwen2.5-coder:1.5b',
      durationMs: 2300
    }
  };
  
  const synthesis = engine.synthesizeResponse(plan, subtaskResults);
  
  assert.ok(synthesis.includes('# Multi-Agent Implementation — 301 Super AI Agent'));
  assert.ok(synthesis.includes('## C++ — ('));
  assert.ok(synthesis.includes('## Java — ('));
  assert.ok(synthesis.includes('```c++') || synthesis.includes('```cpp'));
  assert.ok(synthesis.includes('```java'));
  assert.ok(synthesis.includes('| Technology | Specialist Agent | Model |'));
});