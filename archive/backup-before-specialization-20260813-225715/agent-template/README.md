# 100-to-1 Agent Template

Reusable runtime for the 100 specialist agents.

## Contract

- `GET /api/health`
- `GET /api/info`
- `POST /api/agent`

## Configuration

Set:

- `AGENT_ID`
- `AGENT_NAME`
- `AGENT_VERSION`
- `AGENT_SYSTEM_PROMPT`
- `PORT`
- `HOST`
- `OLLAMA_URL`
- `MODEL`

The template is intentionally local-first and uses the shared Ollama/Qwen backend configuration by default. Each generated agent can override its system prompt and behavior without changing the HTTP contract.
