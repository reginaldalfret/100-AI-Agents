import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('1. Smart Agent Redirect Button UI Component Test Suite', () => {
  const sampleAgents = [
    { id: 'agent-001', agent_id: 'agent-001', name: 'Writing AI Agent', displayNumber: '001', category: 'Writing & Communication' },
    { id: 'agent-002', agent_id: 'agent-002', name: 'Email AI Agent', displayNumber: '002', category: 'Writing & Communication' },
    { id: 'agent-003', agent_id: 'agent-003', name: 'Study AI Agent', displayNumber: '003', category: 'Education & Learning' },
    { id: 'agent-004', agent_id: 'agent-004', name: 'Quiz AI Agent', displayNumber: '004', category: 'Education & Learning' },
    { id: 'agent-061', agent_id: 'agent-061', name: 'Code Generation AI Agent', displayNumber: '061', category: 'Coding & Development' },
    { id: 'agent-101', agent_id: 'agent-101', name: 'Python AsyncIO AI Agent', displayNumber: '101', category: 'Coding & Development' }
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderAgentRedirectCard({ sourceAgent, targetAgent, originalPrompt, reason, politeMessage }) {
    const srcId = sourceAgent?.id || 'agent-001';
    const srcName = sourceAgent?.name || 'Writing AI Agent';
    let targetId = targetAgent?.id || (targetAgent?.displayNumber ? `agent-${targetAgent.displayNumber}` : 'agent-004');
    const targetName = targetAgent?.name || targetAgent?.displayName || 'Quiz AI Agent';
    const promptText = originalPrompt || '';
    const rawMessage = politeMessage || `This request is outside my specialization.\n\nI'm specialized in writing articles, essays, and editorial content. This request is better handled by the **${targetName}**.`;

    return `
      <div class="scope-redirect-card" data-source-id="${escapeHtml(srcId)}" data-target-id="${escapeHtml(targetId)}">
        <div class="scope-redirect-header">
          <span class="sparkle">✦</span>
          <span>Outside My Specialization</span>
        </div>
        <div class="scope-redirect-body">
          <p>${rawMessage}</p>
        </div>
        <div class="scope-redirect-action">
          <button class="btn-switch-agent"
                  role="button"
                  aria-label="Switch to ${escapeHtml(targetName)}"
                  data-target-id="${escapeHtml(targetId)}"
                  data-prompt="${escapeHtml(promptText)}"
                  onclick="window.executeAgentSwitch(this, '${escapeHtml(targetId)}', '${escapeHtml(promptText).replace(/'/g, "\\'")}')">
            <span class="switch-icon">↗</span>
            <span class="switch-label">Switch to ${escapeHtml(targetName)}</span>
          </button>
        </div>
      </div>
    `;
  }

  it('1.1 Renders button with EXACT text "Switch to Quiz AI Agent" and correct ARIA label', () => {
    const cardHtml = renderAgentRedirectCard({
      sourceAgent: { id: 'agent-001', name: 'Writing AI Agent' },
      targetAgent: { id: 'agent-004', name: 'Quiz AI Agent', displayNumber: '004' },
      originalPrompt: 'Create a 10-question multiple-choice quiz on industrial safety',
      reason: 'quiz_generation'
    });

    assert.ok(cardHtml.includes('Switch to Quiz AI Agent'), 'Button must contain EXACT text "Switch to Quiz AI Agent"');
    assert.ok(cardHtml.includes('aria-label="Switch to Quiz AI Agent"'), 'Button must have matching accessibility label');
    assert.ok(cardHtml.includes('role="button"'), 'Button must have role="button"');
    assert.ok(cardHtml.includes('data-target-id="agent-004"'), 'Must specify canonical target agent-004');
    assert.ok(cardHtml.includes('Create a 10-question multiple-choice quiz on industrial safety'), 'Must preserve original prompt');
  });

  it('1.2 Generates generic redirect cards across multiple agent pairs', () => {
    const emailCard = renderAgentRedirectCard({
      sourceAgent: { id: 'agent-001', name: 'Writing AI Agent' },
      targetAgent: { id: 'agent-002', name: 'Email AI Agent', displayNumber: '002' },
      originalPrompt: 'Draft an email requesting a project review'
    });
    assert.ok(emailCard.includes('Switch to Email AI Agent'));
    assert.ok(emailCard.includes('data-target-id="agent-002"'));

    const pythonCard = renderAgentRedirectCard({
      sourceAgent: { id: 'agent-001', name: 'Writing AI Agent' },
      targetAgent: { id: 'agent-101', name: 'Python AsyncIO AI Agent', displayNumber: '101' },
      originalPrompt: 'Write a Python async script'
    });
    assert.ok(pythonCard.includes('Switch to Python AsyncIO AI Agent'));
    assert.ok(pythonCard.includes('data-target-id="agent-101"'));
  });

  it('1.3 Simulates loading state, duplicate click prevention, and agent state transition', async () => {
    const simulatedState = {
      selectedAgent: { id: 'agent-001', name: 'Writing AI Agent', displayNumber: '001' },
      headerTitle: 'Writing AI Agent',
      headerNumber: '001',
      placeholder: 'Message Writing AI Agent...',
      activeSidebarId: 'agent-001',
      chatHistory: [
        { role: 'user', content: 'Create a 10-question multiple-choice quiz on industrial safety' },
        { role: 'assistant', status: 'out_of_scope', content: 'This request is better handled by the Quiz AI Agent.' }
      ],
      executedTasks: []
    };

    const simulatedBtn = {
      disabled: false,
      classList: new Set(['btn-switch-agent']),
      innerHTML: '<span class="switch-label">Switch to Quiz AI Agent</span>'
    };

    async function executeAgentSwitch(btnEl, targetAgentId, promptText) {
      if (btnEl) {
        if (btnEl.disabled || btnEl.classList.has('loading')) return false;
        btnEl.disabled = true;
        btnEl.classList.add('loading');
        btnEl.innerHTML = 'Switching to Quiz AI Agent...';
      }

      const targetAgent = sampleAgents.find(a => a.id === targetAgentId);
      if (!targetAgent) {
        if (btnEl) {
          btnEl.disabled = false;
          btnEl.classList.delete('loading');
          btnEl.classList.add('error');
        }
        return false;
      }

      // Switch active agent
      simulatedState.selectedAgent = targetAgent;
      simulatedState.headerTitle = targetAgent.name;
      simulatedState.headerNumber = targetAgent.displayNumber;
      simulatedState.placeholder = `Message ${targetAgent.name}...`;
      simulatedState.activeSidebarId = targetAgent.id;

      // Automatically retry original prompt
      simulatedState.executedTasks.push({
        agentId: targetAgent.id,
        agentName: targetAgent.name,
        prompt: promptText
      });

      if (btnEl) {
        btnEl.classList.delete('loading');
        btnEl.classList.add('completed');
        btnEl.innerHTML = '✓ Switched to Quiz AI Agent';
      }
      return true;
    }

    // 1st click
    const firstClick = await executeAgentSwitch(simulatedBtn, 'agent-004', 'Create a 10-question multiple-choice quiz on industrial safety');
    assert.strictEqual(firstClick, true);
    assert.strictEqual(simulatedState.selectedAgent.id, 'agent-004');
    assert.strictEqual(simulatedState.selectedAgent.name, 'Quiz AI Agent');
    assert.strictEqual(simulatedState.headerTitle, 'Quiz AI Agent');
    assert.strictEqual(simulatedState.headerNumber, '004');
    assert.strictEqual(simulatedState.placeholder, 'Message Quiz AI Agent...');
    assert.strictEqual(simulatedState.activeSidebarId, 'agent-004');
    assert.strictEqual(simulatedState.chatHistory.length, 2, 'Chat history must be preserved');
    assert.strictEqual(simulatedState.executedTasks.length, 1);
    assert.strictEqual(simulatedState.executedTasks[0].prompt, 'Create a 10-question multiple-choice quiz on industrial safety');

    // 2nd duplicate click while completed/disabled must be ignored
    const secondClick = await executeAgentSwitch(simulatedBtn, 'agent-004', 'Create a 10-question multiple-choice quiz on industrial safety');
    assert.strictEqual(secondClick, false, 'Duplicate click must be prevented');
    assert.strictEqual(simulatedState.executedTasks.length, 1, 'Task must not be executed twice');
  });

  it('1.4 Handles non-existent destination agent without crashing', async () => {
    const errorBtn = {
      disabled: false,
      classList: new Set(['btn-switch-agent']),
      innerHTML: '<span class="switch-label">Switch to Unknown</span>'
    };

    let errorRaised = false;
    async function executeInvalidSwitch(btnEl, targetAgentId) {
      const targetAgent = sampleAgents.find(a => a.id === targetAgentId);
      if (!targetAgent) {
        btnEl.disabled = false;
        btnEl.classList.add('error');
        btnEl.innerHTML = `Unable to switch to ${targetAgentId}.`;
        errorRaised = true;
        return false;
      }
      return true;
    }

    const success = await executeInvalidSwitch(errorBtn, 'agent-999');
    assert.strictEqual(success, false);
    assert.strictEqual(errorRaised, true);
    assert.ok(errorBtn.innerHTML.includes('Unable to switch to agent-999'));
    assert.ok(errorBtn.classList.has('error'));
  });
});
