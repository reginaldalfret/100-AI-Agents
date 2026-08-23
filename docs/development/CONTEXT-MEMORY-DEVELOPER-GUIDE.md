# Conversational Memory Developer Guide

**Platform:** Sovereign AI Workbench  
**Directory:** `platform/context/`

---

## 1. Quick Integration Example

```javascript
import { conversationManager } from './platform/context/index.js';

// 1. Prepare context before calling local Ollama model
const contextPayload = conversationManager.prepareContext({
  conversationId: 'chat-123',
  agent: { agent_id: 'agent-001', name: 'Writing AI Agent', domain: 'Writing' },
  task: 'write about the types in it',
  model: 'nemotron-3-nano:latest'
});

// contextPayload contains:
// - systemPrompt: enriched with active topic
// - prompt: assembled multi-turn conversation string
// - messages: normalized array of { role, content }

// 2. Execute model streaming with contextPayload.systemPrompt & contextPayload.prompt...

// 3. Record turn after completion to update memory state
conversationManager.recordTurn({
  conversationId: 'chat-123',
  userPrompt: 'write about the types in it',
  assistantResponse: streamedFullText,
  agent: { agent_id: 'agent-001', name: 'Writing AI Agent' },
  model: 'NVIDIA Nemotron 3'
});
```

---

## 2. Testing & Verification

Run the test suites:
```bash
node tests/context/reference-resolution.test.js
node tests/context/conversation-memory.test.js
node --test tests/ui/no-agent-tabs.test.js
```
