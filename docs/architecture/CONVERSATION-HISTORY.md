# Sovereign AI Workbench — Conversation History & Persistence Architecture

## Overview

The Sovereign AI Workbench maintains an authoritative, local-first conversation history storage layer directly on the authoritative drive path:
`E:\Smart Automation\100-AI-Agents\data\conversations\`

This ensures 100% data sovereignty, zero cloud egress, and guaranteed persistence across browser refreshes and gateway restarts.

---

## Architecture & Storage Layer

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend UI (app.js)                   │
│   • Renders real conversation titles                     │
│   • Date Grouping (Pinned, Today, Yesterday, Older)      │
│   • Restores Agent, Model Mode, and Full Message History │
└────────────────────────────┬─────────────────────────────┘
                             │ REST / SSE API
                             ▼
┌──────────────────────────────────────────────────────────┐
│            Gateway Server (server.js / REST)             │
│   • GET    /api/chats          (List/Search)             │
│   • POST   /api/chats          (Create & Persist)        │
│   • GET    /api/chats/:id      (Load Full History)       │
│   • PATCH  /api/chats/:id      (Pin / Rename)            │
│   • DELETE /api/chats/:id      (Permanent Purge)         │
│   • POST   /api/chats/:id/msg  (Append Message)          │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│     Conversation Service (conversation-service.js)       │
│   • Authoritative JSON files: data/conversations/*.json  │
│   • Automatic deterministic title generation             │
│   • Legacy context migration adapter                     │
│   • Automatic cleanup of 0-message placeholder chats     │
└──────────────────────────────────────────────────────────┘
```

---

## Canonical Conversation Schema

```json
{
  "id": "chat-1787408104725-743",
  "title": "HX-204 Ultrasonic Thickness Analysis",
  "agentId": "agent-101",
  "agentName": "Super AI Agent",
  "modelMode": "auto",
  "pinned": false,
  "createdAt": "2026-08-22T14:15:04.725Z",
  "updatedAt": "2026-08-22T14:15:04.726Z",
  "messages": [
    {
      "id": "msg-1787408104726",
      "role": "user",
      "content": "Please analyze the ultrasonic thickness report for Heat Exchanger HX-204.",
      "timestamp": "2026-08-22T14:15:04.726Z"
    },
    {
      "id": "msg-1787408105900",
      "role": "assistant",
      "content": "### HX-204 Inspection Summary...",
      "model": "NVIDIA Nemotron 3",
      "actualModel": "nemotron-3-nano:latest",
      "durationMs": 1450,
      "tokensPerSec": 35.2,
      "timestamp": "2026-08-22T14:15:05.900Z"
    }
  ]
}
```

---

## Key Features & Invariants

1. **No Fake / Placeholder Entries**:
   - Empty "New Chat" objects are never saved to disk merely by clicking "+ New Chat" or refreshing the app.
   - Persistence occurs on the first user message or when explicitly saved.
2. **Automatic Title Generation**:
   - Generates concise engineering summaries (e.g. `Renewable Energy Article`, `HX-204 Ultrasonic Thickness Analysis`, `Full-Stack Website Project`).
3. **Date Grouping**:
   - Computed dynamically using `updatedAt` / `createdAt` into: `Pinned`, `Today`, `Yesterday`, `Previous 7 Days`, `Previous 30 Days`, and `Older`.
4. **Agent & Model State Restoration**:
   - When reopening a conversation, the active agent (e.g. `001 Writing AI Agent`, `003 Coding AI Agent`, `101 Super AI Agent`) and model mode (`Auto`, `NVIDIA Nemotron 3`, `Google Gemma 3`, `Qwen 2.5 Coder`) are restored.
5. **Real Token Streaming Compatibility**:
   - Progressive token chunks stream via SSE into the message card, with completion metrics persisted upon final event arrival.
