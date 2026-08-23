import { test } from 'node:test';
import assert from 'node:assert';
import { ArtifactManager } from '../../platform/workflow-engine/artifact-manager.js';

test('12. Artifact Manager: Isolates separate code files with metadata and SHA-256', () => {
  const am = new ArtifactManager();
  
  const artCpp = am.registerArtifact({
    workflowId: 'wf-test',
    subtaskId: 'sub-1',
    agentId: 'agent-057',
    agentName: 'C++ AI Agent',
    filename: 'palindrome.cpp',
    content: '#include <iostream>\nint main() { return 0; }'
  });
  
  assert.strictEqual(artCpp.filename, 'palindrome.cpp');
  assert.strictEqual(artCpp.language, 'cpp');
  assert.strictEqual(artCpp.lines, 2);
  assert.ok(artCpp.sha256);
  assert.strictEqual(artCpp.mimeType, 'text/x-c++src');
  
  const all = am.getWorkflowArtifacts('wf-test');
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0].id, artCpp.id);
});