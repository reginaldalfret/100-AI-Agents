import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperAIWorkflowEngine } from '../../platform/workflow-engine/super-ai-workflow-engine.js';

test('7. Workflow Synthesis Integrity: 301 Super AI Agent synthesizes actual specialist code', async () => {
  const engine = new SuperAIWorkflowEngine();
  const plan = engine.planWorkflow('Write a palindrome program in C++, Java, Python');

  const result = await engine.executeWorkflow(plan, {
    executeAgentFn: async (contract) => {
      const codeMap = {
        'C++': '#include <iostream>\nbool isPalindrome(std::string s) { return true; }',
        'Java': 'public class Palindrome { public static boolean isPalindrome(String s) { return true; } }',
        'Python': 'def is_palindrome(s: str) -> bool:\n    return s == s[::-1]'
      };
      return {
        code: codeMap[contract.technology] || '// code',
        explanation: 'Time complexity O(n)',
        model: 'qwen2.5-coder:1.5b',
        durationMs: 150,
        source: 'live_model'
      };
    }
  });

  const synthesis = result.finalSynthesis;

  assert.ok(synthesis.includes('# Multi-Agent Implementation — 301 Super AI Agent'));
  assert.ok(synthesis.includes('113 C++ Template AI Agent'));
  assert.ok(synthesis.includes('107 Java JVM AI Agent'));
  assert.ok(synthesis.includes('101 Python AsyncIO AI Agent'));
  assert.ok(synthesis.includes('```cpp'));
  assert.ok(synthesis.includes('```java'));
  assert.ok(synthesis.includes('```python') || synthesis.includes('```py'));
});
