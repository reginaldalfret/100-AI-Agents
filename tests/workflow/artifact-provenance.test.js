import test from 'node:test';
import assert from 'node:assert/strict';
import { ArtifactManager } from '../../platform/workflow-engine/artifact-manager.js';

test('2. Artifact Provenance: Artifacts store cryptographic hash, agent identity, and metadata', () => {
  const mgr = new ArtifactManager();
  const art = mgr.registerArtifact({
    workflowId: 'wf-test-101',
    subtaskId: 'subtask-1-js',
    agentId: 'agent-131',
    displayNumber: '131',
    agentName: 'JavaScript Runtime AI Agent',
    filename: 'script.js',
    content: 'const app = { init() { console.log("ready"); } };',
    language: 'javascript',
    source: 'specialist-inference'
  });

  assert.ok(art.id.startsWith('art-wf-test-101-subtask-1-js-script.js'));
  assert.equal(art.workflowId, 'wf-test-101');
  assert.equal(art.subtaskId, 'subtask-1-js');
  assert.equal(art.agentId, 'agent-131');
  assert.equal(art.displayNumber, '131');
  assert.equal(art.agentName, 'JavaScript Runtime AI Agent');
  assert.equal(art.filename, 'script.js');
  assert.equal(art.mimeType, 'application/javascript');
  assert.ok(art.sha256.length >= 16);
  assert.ok(art.lines >= 1);
  assert.ok(art.sizeBytes > 0);
  assert.equal(art.isValid, true);
  assert.ok(art.createdAt);
});
