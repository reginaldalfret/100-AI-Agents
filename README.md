# 100 → 1 Automation

## 100 AI Agents → 1 Unified AI System

A self-hosted multi-agent AI platform containing **100 specialized AI agents plus a Day-101 Master Agent**, exposed through a unified web interface and gateway.

The project is designed around one core principle:

> **Each specialized agent should do its own job well, and politely reject requests that belong outside its specialization.**

The platform uses local AI inference through **Ollama**, independent agent services, a shared capability-gating system, a central gateway, and a browser-based chat UI.

---

## ✨ What This Project Is

This repository is the automation and platform layer for a **100 Days → 100 AI Agents → 1 Unified AI System** challenge.

The system currently contains:

- **100 specialized AI agents** — Agents 001–100
- **1 Master Agent** — Agent 101
- **101 independent agent runtimes**
- A shared agent template
- Per-agent configuration and capability declarations
- A strict capability/intent gate
- A central gateway
- A unified web chat interface
- Local Ollama model inference
- Health endpoints
- Contract tests
- Linux `systemd` service management
- Agent registry and metadata
- Deployment/automation infrastructure

---

## 🧠 Core Architecture

```text
                         ┌──────────────────────┐
                         │    Web Chat UI       │
                         │  platform/web        │
                         └──────────┬───────────┘
                                    │
                                    │ POST /api/chat
                                    ▼
                         ┌──────────────────────┐
                         │   100-to-1 Gateway   │
                         │   port 8300          │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌──────────────────┐           ┌──────────────────┐
          │ Specialized      │           │ Master Agent     │
          │ Agents 001–100   │           │ Agent 101        │
          └────────┬─────────┘           └──────────────────┘
                   │
                   │ Capability Gate
                   ▼
          ┌──────────────────┐
          │ Ollama           │
          │ Local AI Model   │
          └──────────────────┘
```

### Request flow

1. User selects an agent in the web UI.
2. User submits a task.
3. The web UI sends the task to the gateway.
4. The gateway routes the request to the selected agent.
5. The agent's capability gate checks whether the request belongs to that agent.
6. If the request is outside the specialization, the agent rejects it politely without calling the model.
7. If the request is valid, the agent sends the task to Ollama.
8. The model response is returned to the gateway.
9. The web UI displays only the human-readable result.
10. Internal metadata such as capabilities, detected intents, and error objects are not displayed as raw JSON in the chat UI.

---

# 🤖 Agent Fleet

## Foundation Agents — 001–010

| ID | Agent |
|---|---|
| 001 | AI Writing Agent |
| 002 | AI Email Agent |
| 003 | AI Study Agent |
| 004 | AI Quiz Agent |
| 005 | AI Summarization Agent |
| 006 | AI Grammar Agent |
| 007 | AI Translation Agent |
| 008 | AI Idea Generation Agent |
| 009 | AI Storytelling Agent |
| 010 | AI Goal Planning Agent |

## Research, Productivity & Career — 011–040

| ID | Agent |
|---|---|
| 011 | AI Note-Taking Agent |
| 012 | AI Task Management Agent |
| 013 | AI Resume Agent |
| 014 | AI Job Matching Agent |
| 015 | AI Interview Agent |
| 016 | AI Communication Agent |
| 017 | AI SWOT Analysis Agent |
| 018 | AI Career Advisor Agent |
| 019 | AI Decision-Making Agent |
| 020 | AI Brainstorming Agent |
| 021 | AI Web Research Agent |
| 022 | AI News Research Agent |
| 023 | AI Research Paper Agent |
| 024 | AI Literature Review Agent |
| 025 | AI Book Research Agent |
| 026 | AI Company Research Agent |
| 027 | AI Competitor Research Agent |
| 028 | AI Market Research Agent |
| 029 | AI Startup Research Agent |
| 030 | AI Investment Research Agent |
| 031 | AI Product Research Agent |
| 032 | AI Travel Research Agent |
| 033 | AI Restaurant Research Agent |
| 034 | AI Course Research Agent |
| 035 | AI College Research Agent |
| 036 | AI GitHub Research Agent |
| 037 | AI Document Research Agent |
| 038 | AI Fact-Checking Agent |
| 039 | AI Source Verification Agent |
| 040 | AI Research Assistant Agent |

## Automation & Office Agents — 041–054

| ID | Agent |
|---|---|
| 041 | AI Email Management Agent |
| 042 | AI Calendar Management Agent |
| 043 | AI Task Automation Agent |
| 044 | AI File Organization Agent |
| 045 | AI PDF Processing Agent |
| 046 | AI Invoice Processing Agent |
| 047 | AI Spreadsheet Agent |
| 048 | AI Data Analysis Agent |
| 049 | AI Report Generation Agent |
| 050 | AI Presentation Agent |
| 051 | AI Image Analysis Agent |
| 052 | AI Video Analysis Agent |
| 053 | AI Meeting Assistant Agent |
| 054 | AI Voice Assistant Agent |

## Software Engineering Agents — 055–075

| ID | Agent |
|---|---|
| 055 | AI Code Review Agent |
| 056 | AI Debugging Agent |
| 057 | AI Test Generation Agent |
| 058 | AI Documentation Agent |
| 059 | AI Workflow Automation Agent |
| 060 | AI Personal Assistant Agent |
| 061 | AI Code Generation Agent |
| 062 | AI Software Architecture Agent |
| 063 | AI Codebase Analysis Agent |
| 064 | AI Bug Hunting Agent |
| 065 | AI Performance Optimization Agent |
| 066 | AI Security Audit Agent |
| 067 | AI Test Engineer Agent |
| 068 | AI Dependency Analysis Agent |
| 069 | AI API Documentation Agent |
| 070 | AI Code Refactoring Agent |
| 071 | AI Database Agent |
| 072 | AI DevOps Agent |
| 073 | AI Docker Agent |
| 074 | AI CI/CD Agent |
| 075 | AI Full-Stack Developer Agent |

## Business & Operations Agents — 076–100

| ID | Agent |
|---|---|
| 076 | AI Sales Agent |
| 077 | AI Lead Generation Agent |
| 078 | AI Lead Qualification Agent |
| 079 | AI Customer Support Agent |
| 080 | AI Marketing Agent |
| 081 | AI Social Media Agent |
| 082 | AI SEO Agent |
| 083 | AI Content Marketing Agent |
| 084 | AI Business Analyst Agent |
| 085 | AI Financial Analysis Agent |
| 086 | AI Accounting Assistant Agent |
| 087 | AI E-Commerce Agent |
| 088 | AI Supply Chain Agent |
| 089 | AI HR & Recruitment Agent |
| 090 | AI Project Manager Agent |
| 091 | AI Autonomous Research Agent |
| 092 | AI Browser Automation Agent |
| 093 | AI RAG Knowledge Agent |
| 094 | AI Multi-Agent Debate Agent |
| 095 | AI Business Operations Agent |
| 096 | AI Autonomous Coding Agent |
| 097 | AI AI-Research Scientist Agent |
| 098 | AI Startup Builder Agent |
| 099 | AI Multi-Agent Coordinator Agent |
| 100 | AI Agent Orchestrator Agent |

## Day 101

| ID | Agent |
|---|---|
| 101 | AI Master Agent |

Agent 101 is the top-level master/orchestration layer. Unlike specialized agents, the Master Agent is intentionally allowed to coordinate across capabilities and delegate work to the appropriate agents.

---

# 🛡️ Strict Specialization / Capability Gate

One of the most important features of the platform is the **fleet-wide capability gate**.

Every specialized agent has a declared capability list in its `agent.json`.

For example, Agent 002 declares capabilities such as:

```text
email-writing
email-rewriting
email-replies
email-subject-lines
professional-email
business-email
internship-email
```

If the user asks Agent 002:

```text
Write a professional internship application email.
```

The request is accepted and processed by the model.

If the user asks Agent 002:

```text
Generate 10 quiz questions about DBMS.
```

The request is rejected because quiz generation belongs to another specialized agent.

If the user asks an unrelated question that cannot be mapped to a known supported intent, it is also rejected.

### Rejection behavior

The user sees a normal human-readable response such as:

> I'm sorry, but I'm the AI Email Agent. I specialize in: email-writing, email-rewriting, email-replies, email-subject-lines, professional-email, business-email, internship-email. This request appears to be outside my specialization. Please use the appropriate specialized agent for this task.

The platform API may internally return structured metadata for debugging and integration, but the **web chat UI does not expose the raw JSON response to the user**.

### Strict policy

The gate uses three important outcomes:

```text
capability-match
    → allow request

capability-mismatch
    → reject request politely

unknown-or-out-of-scope
    → reject request politely
```

The strict gate is applied fleet-wide to the agent runtimes.

Master/orchestrator agents are intentionally exempt because their purpose is delegation and coordination rather than one narrow specialization.

---

# 🧩 Agent Structure

A typical agent contains:

```text
agent-XXX-name/
├── README.md
├── agent.json
├── package.json
├── backend/
│   └── src/
│       ├── agent.js
│       ├── capability-gate.js
│       ├── config.js
│       ├── model.js
│       └── server.js
├── frontend/
│   └── index.html
└── tests/
    └── contract.test.js
```

The exact files can vary for orchestration agents because they may require additional modules such as planners, registries, delegators, or synthesizers.

---

# ⚙️ Agent Runtime

Each agent exposes a consistent API contract.

### Health

```http
GET /api/health
```

### Execute agent

```http
POST /api/agent
Content-Type: application/json
```

Example request:

```json
{
  "task": "Write a professional internship application email to a company.",
  "context": {},
  "parameters": {},
  "output_format": "text"
}
```

Example successful response structure:

```json
{
  "agent_id": "agent-002",
  "agent_name": "AI Email Agent",
  "status": "success",
  "result": "...",
  "metadata": {
    "model": "qwen3.5:9b",
    "output_format": "text"
  },
  "error": null
}
```

Example rejected response structure:

```json
{
  "agent_id": "agent-002",
  "agent_name": "AI Email Agent",
  "status": "rejected",
  "result": null,
  "metadata": {
    "gate_reason": "capability-mismatch"
  },
  "error": {
    "code": "AGENT_CAPABILITY_MISMATCH",
    "message": "..."
  }
}
```

These structured responses are useful for API consumers and debugging. The browser chat layer extracts the human-readable `result` or `error.message` instead of displaying the complete JSON object.

---

# 🌐 Unified Gateway

The central gateway is located at:

```text
platform/gateway/
```

The development/runtime gateway listens on:

```text
http://127.0.0.1:8300
```

The primary chat endpoint is:

```http
POST /api/chat
```

Example:

```json
{
  "agent_id": "agent-002",
  "task": "Write a professional internship application email to a company.",
  "context": {},
  "parameters": {},
  "output_format": "text"
}
```

The gateway routes the request to the selected agent and returns the agent's response.

---

# 🖥️ Web Interface

The unified web application is located at:

```text
platform/web/index.html
```

The UI provides:

- Agent selection
- Chat-style interaction
- Agent metadata display
- Loading state
- Conversation history
- Human-readable responses
- Rejection messages
- Connection error handling
- Browser-side history persistence

The UI deliberately prevents internal API structures from being shown as raw JSON in the conversation.

---

# 🧠 AI Model Backend

The agent runtimes use **Ollama** for local model inference.

The current foundation agents are configured around:

```text
qwen3.5:9b
```

The runtime supports configurable model selection through agent configuration and request parameters.

The model layer is responsible for communicating with Ollama and reporting model health and generation metadata.

---

# 📁 Repository Layout

```text
100-to-1-automation/
│
├── agents/
│   ├── agent-001-writing-agent/
│   ├── agent-002-email-agent/
│   ├── agent-003-study-agent/
│   ├── ...
│   ├── agent-100-agent-orchestrator-agent/
│   └── agent-101-master-agent/
│
├── agent-template/
│   └── backend/
│       └── src/
│           └── capability-gate.js
│
├── platform/
│   ├── gateway/
│   │   ├── package.json
│   │   └── src/
│   │       └── server.js
│   └── web/
│       └── index.html
│
├── registry/
│   └── agents.json
│
└── README.md
```

---

# 🔧 Configuration

Each agent has an `agent.json` containing metadata such as:

```json
{
  "day": 2,
  "agent_id": "agent-002",
  "name": "AI Email Agent",
  "slug": "email-agent",
  "category": "foundation",
  "model": "qwen3.5:9b",
  "port": 8102,
  "api_url": "http://127.0.0.1:8102",
  "health_url": "http://127.0.0.1:8102/api/health",
  "capabilities": [],
  "ui_type": "task",
  "contract": {
    "health": "/api/health",
    "run": "/api/agent"
  }
}
```

The actual capability list and system prompt are defined per agent.

---

# 🚀 Local Development

## Prerequisites

Recommended environment:

- Linux/Ubuntu server or development machine
- Node.js
- npm
- Python 3
- Ollama
- Git
- `systemd` for the current production-style local service setup

## Clone

```bash
git clone https://github.com/reginaldalfret/100-to-1-automation.git
cd 100-to-1-automation
```

## Install dependencies

The project contains independent Node.js packages for the gateway and agents. Install dependencies from the relevant package directories before starting services.

Example:

```bash
cd platform/gateway
npm install
```

For an individual agent:

```bash
cd agents/agent-002-email-agent
npm install
```

## Start Ollama

Ensure Ollama is installed and running, then make the required model available:

```bash
ollama pull qwen3.5:9b
```

Verify:

```bash
ollama list
```

---

# ▶️ Running the Agent Fleet

The current server deployment uses one `systemd` service per agent.

Service naming convention:

```text
100-to-1-agent-001.service
100-to-1-agent-002.service
...
100-to-1-agent-101.service
```

Gateway service:

```text
100-to-1-gateway.service
```

Check the complete fleet:

```bash
sudo systemctl is-active 100-to-1-agent-{001..101}.service \
  | sort | uniq -c
```

A healthy fleet should report all 101 agent services as active.

Restart the fleet:

```bash
for i in $(seq -w 1 101); do
    sudo systemctl restart "100-to-1-agent-${i}.service"
done

sudo systemctl restart 100-to-1-gateway
```

Check the gateway:

```bash
sudo systemctl is-active 100-to-1-gateway
```

---

# 🧪 Testing

## Test an individual agent

Example — Agent 002:

```bash
curl -s -X POST http://127.0.0.1:8102/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "Write a professional internship application email to a company."
  }'
```

## Test specialization rejection

```bash
curl -s -X POST http://127.0.0.1:8102/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "Generate 10 quiz questions about DBMS."
  }'
```

Agent 002 should reject this because it is an Email Agent, not a Quiz Agent.

## Test unknown intent

```bash
curl -s -X POST http://127.0.0.1:8102/api/agent \
  -H 'Content-Type: application/json' \
  -d '{
    "task": "What is the capital of France?"
  }'
```

With the strict gate enabled, unknown/out-of-scope requests should be rejected politely rather than being answered by the underlying model.

## Test through the gateway

Successful request:

```bash
curl -s -X POST http://127.0.0.1:8300/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "agent-002",
    "task": "Write a professional internship application email to a company."
  }'
```

Rejection request:

```bash
curl -s -X POST http://127.0.0.1:8300/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "agent_id": "agent-002",
    "task": "Generate 10 quiz questions about DBMS."
  }'
```

---

# 🔒 Capability-Gate Design

The capability gate is maintained in the shared template:

```text
agent-template/backend/src/capability-gate.js
```

Every agent runtime receives the same strict gate implementation.

The gate performs approximately this sequence:

```text
Task
  │
  ▼
Normalize task
  │
  ▼
Detect known intents
  │
  ├── No known intent ──────────────► REJECT
  │
  ▼
Compare detected intent with
agent capabilities
  │
  ├── Match ────────────────────────► ALLOW
  │
  └── No match ─────────────────────► REJECT
```

This prevents a specialized agent from becoming a generic chatbot simply because the underlying LLM is capable of answering unrelated questions.

---

# 📋 Agent Contract

Every standard agent follows the same basic contract:

```text
GET  /api/health
POST /api/agent
```

This makes agents independently testable while allowing the gateway to treat them uniformly.

The agent runtime exposes information including:

- agent ID
- agent name
- version
- category
- capabilities
- selected model
- backend URL
- UI type
- model availability

---

# 🧪 Contract Tests

Agent-specific tests are stored under:

```text
agents/*/tests/contract.test.js
```

These tests are intended to validate the common agent contract and help prevent changes to one agent from breaking the fleet-wide interface.

---

# 🔄 Fleet-Wide Specialization Updates

The platform supports updating the specialization map across the entire fleet.

Every agent must have non-empty capabilities unless it is intentionally designed as an orchestration/master component.

The specialization configuration includes:

- Agent identity
- Agent name
- Category
- Capabilities
- System prompt
- UI type
- Model
- API port
- Health URL
- Contract endpoints

The current fleet contains **101 agents with declared capabilities**.

---

# 🏗️ Design Principles

## 1. Specialization first

A specialized agent should not behave like a generic assistant.

## 2. Deterministic request rejection

Known unrelated tasks are rejected before model generation whenever the capability gate can identify the conflict.

## 3. Unknown requests are rejected

Unknown intent is not treated as permission to answer everything.

## 4. Human-readable UI

The API can expose structured JSON for developers, but end users should see clean conversational responses.

## 5. Independent services

Each agent can be health-checked, restarted, tested, and monitored independently.

## 6. Common contract

Agents share consistent health and execution endpoints so the gateway can route requests uniformly.

## 7. Local-first inference

The current architecture is designed to run AI inference locally through Ollama rather than requiring a hosted LLM API for every request.

## 8. Master orchestration

Agent 101 exists to coordinate the specialized fleet rather than replace it.

---

# 📈 Project Roadmap

### Completed

- [x] 100-agent fleet structure
- [x] Day-101 Master Agent
- [x] Agent registry
- [x] Individual agent configurations
- [x] Shared agent template
- [x] Local Ollama inference
- [x] Common agent API contract
- [x] Health endpoints
- [x] Central gateway
- [x] Unified web interface
- [x] Fleet-wide specialization map
- [x] Strict capability gate
- [x] Unknown/out-of-scope rejection
- [x] Human-readable rejection messages
- [x] Web UI JSON filtering
- [x] Fleet-wide `systemd` services
- [x] Agent contract tests
- [x] GitHub repository integration

### Future improvements

- [ ] Automated agent discovery and registration
- [ ] Smarter intent classification
- [ ] Gateway-level automatic agent selection
- [ ] Advanced Master Agent delegation
- [ ] Multi-agent workflows
- [ ] Persistent shared memory
- [ ] RAG knowledge stores
- [ ] Observability and centralized logs
- [ ] Metrics and latency dashboards
- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] Containerized deployment
- [ ] Cloud deployment
- [ ] Automated CI/CD fleet deployment
- [ ] Agent version management
- [ ] Automated regression testing across all 101 agents

---

# 🔐 Security Notes

This repository should **never contain secrets** such as:

- API keys
- passwords
- SSH private keys
- access tokens
- OAuth secrets
- production credentials
- private certificates
- `.env` files containing secrets

Use environment variables or a proper secrets-management solution for deployment credentials.

Before pushing changes:

```bash
git status
git diff --cached
```

Review staged files carefully, especially generated backups and local configuration files.

---

# 🌐 GitHub

Repository:

https://github.com/reginaldalfret/100-to-1-automation

Default branch:

```text
main
```

Push changes with:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

---

# 📜 Project Status

**Current status: Active development**

The platform is operational as a local multi-service deployment with 101 agent services and a central gateway.

The current implementation demonstrates the complete concept:

```text
100 specialized AI agents
          ↓
strict specialization
          ↓
independent runtimes
          ↓
central gateway
          ↓
unified web interface
          ↓
1 Master Agent
```

The long-term goal is to evolve this into a robust, observable, production-ready multi-agent AI platform where specialized agents cooperate without losing their individual boundaries.

---

## 👤 Author

**Reginald Alfret**

GitHub: https://github.com/reginaldalfret

Repository: https://github.com/reginaldalfret/100-to-1-automation

---

## ⭐ If You Find This Interesting

Star the repository and follow the project as the 100-agent system evolves toward a unified autonomous AI platform.
