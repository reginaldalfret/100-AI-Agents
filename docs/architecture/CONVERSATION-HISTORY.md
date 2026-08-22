# Super AI — Persistent Conversational History Architecture

This document describes the design, storage engine, API specifications, and UX interactions for the persistent conversation history system in Super AI.

---

## 1. Overview & Principles

The Conversational History subsystem provides a modern AI chat workspace experience with full air-gapped sovereignty:
- **100% On-Premise Persistence**: Conversations are stored locally on the server in `data/conversations/` as JSON documents.
- **Zero Cloud Egress**: No conversation logs or telemetry ever leave the local machine.
- **Stateful Continuity**: Reopening any past conversation restores the exact messages, selected agent (e.g. `Agent 101` or a specialist), selected model mode (`Auto`, `Nemotron 3`, `Gemma 3`, `Qwen 2.5 Coder`), evidence, and deliverables.
- **Fast Grouping & Virtualization**: Chats are categorized dynamically into date buckets: `Pinned`, `Today`, `Yesterday`, `Previous 7 Days`, `Previous 30 Days`, and `Older`.

---

## 2. Data Model

Each conversation is persisted as an independent file: `data/conversations/<id>.json`

```json
{
  "id": "chat-1787407123456-abcde",
  "title": "Compare Gemini Models",
  "agentId": "agent-101",
  "agentName": "Super AI",
  "modelMode": "auto",
  "pinned": false,
  "createdAt": "2026-08-22T19:15:00.000Z",
  "updatedAt": "2026-08-22T19:18:30.000Z",
  "messages": [
    {
      "id": "msg-1787407124000",
      "role": "user",
      "content": "Compare Gemini 3.7 Flash and 3.1 Pro for local tasks",
      "attachments": [],
      "timestamp": "2026-08-22T19:15:05.000Z"
    },
    {
      "id": "msg-1787407128000",
      "role": "assistant",
      "content": "Here is a structured comparison of Gemini 3.7 Flash vs 3.1 Pro...",
      "model": "Super AI (Nemotron 3 Nano)",
      "evidence": null,
      "deliverables": null,
      "traceId": "TRC-891023",
      "timestamp": "2026-08-22T19:15:09.000Z"
    }
  ]
}
```

---

## 3. REST API Specifications

The Central Gateway (`http://127.0.0.1:8300`) exposes the following endpoints:

| Endpoint | Method | Payload / Params | Response | Description |
|---|---|---|---|---|
| `/api/chats` | `GET` | `?q=<optional_query>` | `{ status: "success", chats: [...] }` | Returns sorted array of chat metadata (pinned first, then by `updatedAt` desc). |
| `/api/chats` | `POST` | `{ title, agentId, agentName, modelMode, messages }` | `{ status: "success", chat: {...} }` | Creates a new conversation file on disk. |
| `/api/chats/:id` | `GET` | None | `{ status: "success", chat: {...} }` | Fetches full conversation including all messages. |
| `/api/chats/:id` | `PATCH` | `{ title, pinned, agentId, modelMode }` | `{ status: "success", chat: {...} }` | Updates conversation metadata, rename, or pin status. |
| `/api/chats/:id` | `DELETE` | None | `{ status: "success", deleted: true }` | Permanently deletes conversation from disk. |
| `/api/chats/:id/messages` | `POST` | `{ id, role, content, attachments, timestamp, ... }` | `{ status: "success", chat: {...} }` | Appends a message to conversation and triggers deterministic title generation if still default. |

---

## 4. Automatic Deterministic Title Generation

When a new chat is initialized, its title is `"New Chat"`. Upon receiving the first user message, `conversation-service.js` automatically derives a concise title:
- Prompts starting with `"Compare..."` $\rightarrow$ `"Compare <Subject>"`
- Prompts starting with `"Analyze..."` $\rightarrow$ `"Analyze <Document/System>"`
- Prompts starting with `"Write..."` or `"Draft..."` $\rightarrow$ `"Draft <Title>"`
- General prompts $\rightarrow$ First 5–7 words truncated cleanly.

---

## 5. UI Features & Interactions

1. **`+ New Chat` Button**:
   - Fixed at top of the sidebar.
   - Creates a new conversation, defaults to `Super AI (Agent 101)` in `Auto` model mode, clears workspace, and focuses the composer input.
2. **Pinned Section**:
   - Pinned conversations are displayed at the very top of the history list with a pin indicator `📌`.
3. **Date Buckets**:
   - Conversations are dynamically grouped into `Today`, `Yesterday`, `Previous 7 Days`, `Previous 30 Days`, and `Older`.
4. **Row Actions (`Pin`, `Rename`, `Delete`)**:
   - Each row reveals quick-action buttons on hover:
     - `📌/📍` Toggles pin status.
     - `✎` Activates inline renaming (save on `Enter`, cancel on `Escape`).
     - `🗑` Opens safe deletion modal with confirmation prompt.
5. **Unified Search**:
   - The top search bar searches across conversation titles, message previews, agent names, numeric IDs (`001..100`, `101`), and capabilities.
