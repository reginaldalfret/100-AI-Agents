import { test } from 'node:test';
import assert from 'node:assert';
import { conversationManager } from '../../platform/context/conversation-manager.js';

test('4. PDF Follow-up Turn Memory Resolution', async () => {
  const conversationId = `test_conv_pdf_${Date.now()}`;
  
  // Turn 1: User uploads PDF and asks what it says
  const extractedPdfText = 'Write a professional email to my manager requesting a project review';
  const turn1UserPrompt = `What does this PDF say?\n\n[ATTACHED EVIDENCE: project_review_request_fixed.pdf]\n${extractedPdfText}`;
  const turn1AssistantResponse = `The PDF contains a single directive: "Write a professional email to my manager requesting a project review".`;

  conversationManager.recordTurn({
    conversationId,
    userPrompt: turn1UserPrompt,
    assistantResponse: turn1AssistantResponse,
    agent: { agent_id: 'agent-101', name: 'Super AI Agent' },
    model: 'NVIDIA Nemotron 3'
  });

  // Turn 2: User asks follow-up: "Turn that into a professional email"
  const turn2Task = 'Turn that into a professional email';
  const turn2Context = conversationManager.prepareContext({
    conversationId,
    agent: { agent_id: 'agent-002', name: 'Email AI Agent' },
    task: turn2Task,
    model: 'nemotron-3-nano:latest'
  });

  assert.ok(
    turn2Context.prompt.includes('project review') || turn2Context.prompt.includes(extractedPdfText) || turn2Context.prompt.includes('manager requesting'),
    'Follow-up context prompt must retain previous PDF content reference'
  );
});
