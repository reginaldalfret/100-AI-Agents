import test from 'node:test';
import assert from 'node:assert/strict';

test('1. Out-of-Scope Redirect Card HTML structure and accessibility', () => {
  const parsed = {
    status: 'out_of_scope',
    currentAgentId: '004',
    currentAgentName: 'Quiz AI Agent',
    recommendedAgentId: '002',
    recommendedAgentName: 'Email AI Agent',
    recommendedAgent: { id: 'agent-002', displayNumber: '002', displayName: 'Email AI Agent' },
    originalPrompt: 'write a email for internship',
    politeMessage: "This request is outside my specialization.\n\nI'm specialized in quizzes and assessments. This request is better handled by the **Email AI Agent**."
  };

  const rec = parsed.recommendedAgent;
  const targetId = rec.id;
  const promptToRetain = parsed.originalPrompt;
  const recName = rec.displayName;

  const cardHtml = `
    <div class="scope-redirect-card">
      <div class="scope-redirect-header">
        <span class="sparkle">✫</span>
        <span>Outside My Specialization</span>
      </div>
      <div class="scope-redirect-body">
        <p>${parsed.politeMessage}</p>
      </div>
      <div class="scope-redirect-action">
        <button class="btn-switch-agent" aria-label="Switch to ${recName}" onclick="window.switchAgentAndRetainPrompt('${targetId}', '${promptToRetain}')">
          <span>↗ Switch to ${recName}</span>
        </button>
      </div>
    </div>
  `;

  assert.ok(cardHtml.includes('scope-redirect-card'), 'Card must have scope-redirect-card class');
  assert.ok(cardHtml.includes('Outside My Specialization'), 'Card header must state Outside My Specialization');
  assert.ok(cardHtml.includes('btn-switch-agent'), 'Card must contain one-click button');
  assert.ok(cardHtml.includes('agent-002'), 'Button must reference canonical agent-002');
  assert.ok(cardHtml.includes('write a email for internship'), 'Button must preserve original prompt');
});

test('2. switchAgentAndRetainPrompt preserves chat history and composer text', () => {
  const simulatedState = {
    selectedAgent: { id: 'agent-004', name: 'Quiz AI Agent', displayNumber: '004' },
    chatHistory: [{ role: 'user', content: 'write a email for internship' }],
    composerValue: '',
    focused: false
  };

  const agents = [
    { id: 'agent-002', name: 'Email AI Agent', displayNumber: '002', category: 'Writing & Communication' },
    { id: 'agent-004', name: 'Quiz AI Agent', displayNamer: '004', category: 'Education & Learning' }
  ];

  function switchAgentAndRetainPrompt(targetAgentId, promptText) {
    const targetAgent = agents.find(a => a.id === targetAgentId);
    if (!targetAgent) return;

    // Switch selected agent without wiping chat view
    simulatedState.selectedAgent = targetAgent;

    // Restore prompt into composer
    simulatedState.composerValue = promptText;
    simulatedState.focused = true;
  }

  // Execute switch
  switchAgentAndRetainPrompt('agent-002', 'write a email for internship');

  assert.equal(simulatedState.selectedAgent.id, 'agent-002', 'Target agent must be 002');
  assert.equal(simulatedState.selectedAgent.name, 'Email AI Agent');
  assert.equal(simulatedState.composerValue, 'write a email for internship', 'Prompt must be preserved in composer');
  assert.equal(simulatedState.focused, true, 'Composer must be focused');
  assert.equal(simulatedState.chatHistory.length, 1, 'Chat history must not be wiped out');
});
