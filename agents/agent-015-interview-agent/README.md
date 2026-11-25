# AI Interview Agent

> Day 15 · `agent-015` · category: **foundation** · port **8115**

AI Interview Agent is one of the 100 specialist agents in the 100 → 1 AI Agent Challenge. It runs on the shared agent runtime and exposes the standard HTTP contract, so it can be called directly or delegated to by the master agent.

## Specialization

The agent is configured with a focused system prompt (see `system_prompt` in [`agent.json`](agent.json)). It handles requests in its own domain and, when a request clearly belongs to another specialist, explains that it is out of scope and points to the appropriate agent instead of answering as a general assistant.

### Capabilities

- `interview-preparation`
- `interview-questions`
- `answer-coaching`
- `mock-interviews`

These identifiers are what the capability gate (`backend/src/capability-gate.js`) matches incoming tasks against before the model is called.

## Configuration

| Field | Value |
| --- | --- |
| Agent ID | `agent-015` |
| Slug | `interview-agent` |
| Default model | `qwen3.5:9b` (served by Ollama) |
| Default port | `8115` |
| UI type | `task` |
| API URL | `http://127.0.0.1:8115` |

Environment overrides read by `backend/src/config.js` and `backend/src/server.js` include `PORT`, `HOST`, `AGENT_ID`, `AGENT_NAME`, `AGENT_VERSION`, `AGENT_CATEGORY`, `AGENT_SYSTEM_PROMPT`, `AGENT_CAPABILITIES` (comma separated) and `OLLAMA_MODEL`.

## Run it

Requires Node.js 20+ and a running Ollama instance with the configured model pulled.

```bash
cd agents/agent-015-interview-agent
npm start          # starts the server on http://127.0.0.1:8115
npm run check      # syntax check of the backend sources
npm test           # contract tests
```

The built-in web UI is served at `http://127.0.0.1:8115/`.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Liveness and model availability |
| GET | `/api/info` | Agent metadata: ID, name, version, category, capabilities, model |
| POST | `/api/agent` | Run a task |

Request and response bodies follow the shared schemas in [`agent-contract/`](../../agent-contract).

### Example

```bash
curl -s http://127.0.0.1:8115/api/agent \
  -H 'Content-Type: application/json' \
  -d '{"task": "Generate 8 behavioral interview questions for a product manager role and coach my answers.", "output_format": "markdown"}'
```

Request fields: `task` (required, string, 1–20000 chars), `context` (object), `parameters` (object) and `output_format` (`text`, `json`, `markdown` or `structured`).

A successful response looks like:

```json
{
  "agent_id": "agent-015",
  "agent_name": "AI Interview Agent",
  "status": "success",
  "result": "<model output>",
  "metadata": { "model": "qwen3.5:9b" }
}
```

If the capability gate decides the task belongs elsewhere, the response has `status: "rejected"`, `result: null`, and `metadata.gate_reason` / `metadata.detected_intents` explaining why. Errors return HTTP 400 with `status: "error"` and an `error` message.

## Files

```
agent.json               agent identity, capabilities, system prompt, port
backend/src/server.js    HTTP server and static frontend
backend/src/agent.js     request handling, health and info
backend/src/capability-gate.js   scope check and routing hints
backend/src/config.js    config loading (agent.json + env)
backend/src/model.js     Ollama client
frontend/index.html      web UI
tests/contract.test.js   API contract tests
```
