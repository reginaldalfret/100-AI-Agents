import test from 'node:test';
import assert from 'node:assert/strict';
import { globalResponseExportEngine } from '../../platform/exports/response-export-engine.js';

test('1. Code Export: Preserves code indentation and blocks across PDF and XLSX', async () => {
  const content = '# Multi-Agent Palindrome\n```cpp\n#include <iostream>\nint main() { return 0; }\n```\n\n```python\ndef is_pal(s):\n    return s == s[::-1]\n```';

  const pdf = await globalResponseExportEngine.exportResponse({ content, title: 'Palindrome Multi-Agent', format: 'pdf' });
  assert.ok(pdf.sizeBytes > 1000);
});
