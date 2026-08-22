# Super AI — Branding & Terminology Audit Report

**Date:** 2026-08-22  
**Public Brand:** **SUPER AI**  
**Engineering / Architecture Engine:** **Sovereign AI Workbench**  
**Classification System:**  
- `USER_FACING`: Public-facing UI titles, brand headers, placeholders, empty states, and agent cards.  
- `INTERNAL`: Technical identifiers, agent IDs (`agent-101`), service routes, folder paths.  
- `SECURITY_CONCEPT`: Sovereignty policies, air-gapped zero-egress controls, on-premise governance.  
- `STATUS_TERMINOLOGY`: Replaced all user-facing "online" strings with "active".

---

## 1. Executive Summary

The user-facing branding has been transitioned to **Super AI**. The primary default orchestrator (internally `agent-101`) is now publicly presented as **Super AI** (`agent-101 · orchestrator`), maintaining full backward compatibility with internal APIs, registries, and security mechanisms. All user-facing status indicators now use **Active** instead of **Online**.

---

## 2. Branding Audit & Change Matrix

| Location | Old Text | New Text | Classification | Reason |
| :--- | :--- | :--- | :--- | :--- |
| `platform/web/index.html` | `<title>Sovereign AI Workbench</title>` | `<title>Super AI — Industrial Agentic Intelligence</title>` | `USER_FACING` | Browser title rebrand |
| `platform/web/index.html` | `SOVEREIGN AI / WORKBENCH` | `SUPER AI / INDUSTRIAL INTELLIGENCE` | `USER_FACING` | Sidebar brand header |
| `platform/web/index.html` | `<meta property="og:title" content="...">` | `<meta property="og:title" content="Super AI">` | `USER_FACING` | Social & browser metadata |
| `platform/web/index.html` | `101 agents online` | `101 agents active` | `STATUS_TERMINOLOGY` | User-facing status rule |
| `platform/web/index.html` | `Gateway online` | `Gateway active` | `STATUS_TERMINOLOGY` | User-facing status rule |
| `platform/web/index.html` | `<h2>Agent Name</h2>` | `<h2>Super AI</h2>` | `USER_FACING` | Default initial agent header |
| `platform/web/index.html` | `ID-1234 • engineering.local` | `agent-101 · orchestrator` | `USER_FACING` | Clean presentation of orchestrator |
| `platform/web/app.js` | `name: 'Sovereign AI (Auto)'` | `name: 'Super AI'` | `USER_FACING` | Main orchestrator agent card |
| `platform/web/app.js` | `elements.chatInput.placeholder = "Ask Sovereign AI anything..."` | `elements.chatInput.placeholder = "Ask Super AI anything..."` | `USER_FACING` | Default composer placeholder |
| `platform/web/app.js` | `Auto (Nemotron 3 Nano / Local)` | `Super AI (Nemotron 3 Nano / Local)` | `USER_FACING` | Dynamic model pill indicator |
| `platform/web/app.js` | `Autonomous task planner evaluating evidence...` | `Super AI is analyzing your evidence on local hardware...` | `USER_FACING` | Thinking pulse indicator |
| `platform/web/app.js` | `document.title = ... Sovereign AI Workbench` | `document.title = 'Super AI — Industrial Agentic Intelligence'` | `USER_FACING` | Window title on selection |
| `platform/web/app.js` | `model: 'NVIDIA Nemotron 3 Nano (4B)'` (default AI msg) | `model: 'Super AI'` | `USER_FACING` | AI message header for orchestrator |
| `platform/web/app.js` | `elements.modelPill.classList.add('online')` | `elements.modelPill.classList.add('active')` | `STATUS_TERMINOLOGY` | Status class hygiene |
| `platform/web/styles.css` | `.status-indicator.status-ready` | `.status-indicator.status-active, .status-indicator.status-ready` | `STATUS_TERMINOLOGY` | Neon green active styling |
| `README.md` | `# SOVEREIGN AI WORKBENCH` | `# Super AI\n### Sovereign On-Premise Agentic AI Workbench` | `USER_FACING` | Public documentation heading |
| `tests/sih/ui/composer-ui.test.js` | Check `Ask Sovereign AI anything...` | Check `Ask Super AI anything...` & `SUPER AI` & `101 agents active` | `TECHNICAL` | Automated test suite update |

---

## 3. Preserved Architectural & Sovereignty Concepts

The following internal and architectural references remain intentionally unchanged:
- **Internal Agent ID**: `agent-101` (Orchestrator).
- **Specialist Agents**: `agent-001` through `agent-100` intact in `registry/agents.json` and `registry/sih-agent-mapping.json`.
- **Security & Sovereignty Engine**: "Sovereign execution", "Sovereign security policy", "Air-gapped inference", "Data sovereignty controls" (`platform/security/`).
- **Hardware Stack**: NVIDIA RTX 2050 (4GB VRAM) running local Nemotron, Gemma 3 4B, and Qwen 2.5 Coder.
- **Repository Structure**: `E:\Smart Automation\100-AI-Agents`.

---

## 4. Status Vocabulary Standard

| Status Name | Visual Representation | Meaning |
| :--- | :--- | :--- |
| **Active** | Emerald / Cyan neon dot (`#22c55e` / `#06b6d4`) | Agent / Service is ready to receive and execute tasks. |
| **Busy** | Amber pulsing dot (`#f59e0b`) | Agent is currently executing a DAG step or inference. |
| **Offline** | Slate grey dot (`#64748b`) | Agent / Service process is not running. |
| **Error** | Red neon dot (`#ef4444`) | Agent / Service encountered a runtime failure. |

---

## 5. Numeric Agent Identity System

- **101 = Super AI**: The primary master orchestrator is assigned permanent display number `101` and is pinned to the top of the agent directory.
- **001–100 = Specialist Agent Workforce**: The 100 specialized industrial agents are numbered with zero-padding (`001`, `002`, ..., `010`, ..., `099`, `100`) following natural numeric order.
- **No Letter-Based Avatars**: All single-character initial derivation (`charAt(0)`, `name[0]`) has been eliminated. The primary visual identity is the 3-digit number rendered in high-contrast monospaced typography with RGB neon accents.
- **Internal ID vs Display Number**: Internal IDs remain canonical (`agent-001` .. `agent-101`) ensuring 100% backward compatibility with backend tooling, APIs, and registries.
- **Padded & Unpadded Search**: Search supports numeric queries like `042`, `42`, `101`, `001`, as well as canonical names and domains.

---

## 6. Local Model Selector Architecture

The chat composer incorporates a floating liquid glass Model Selector allowing operators to dynamically choose or auto-route across the 3 local production models:

- **Auto Mode (Default)**: Dynamic intelligent local routing via `task-classifier.js` and `model-router.js`.
- **1. Google Gemma 3 (`gemma3:4b`)**: Vision / Multimodal (Image understanding, P&ID schematics, engineering drawings, defect photographs).
- **2. NVIDIA Nemotron 3 (`nemotron-3-nano`)**: Reasoning / Planning (Complex industrial task decomposition, evidence synthesis, autonomous replanning).
- **3. Qwen 2.5 Coder (`qwen2.5-coder:1.5b`)**: Coding / Sandbox (Python calculations, SCADA parsing, formula scripting, sandbox automation).

### UX & Architectural Invariants:
- **Floating Liquid Glass Dropdown**: Pinned directly above the `[ Auto ▾ ]` or `[ Gemma 3 ▾ ]` button with backdrop blur, RGB neon accents, and smooth transition.
- **Selected State**: Cyan/violet neon glow, checkmark (`✓`), and brighter typography.
- **Inline Details Subpanel**: Clicking the chevron (`›`) opens runtime specifications (`Local Ollama`, `Active`, `RTX 2050 4GB VRAM`).
- **Mid-Conversation Event**: Changing model during an active session logs an inline system notice (`Model changed to [Model Name]`).
- **Authoritative Backend**: UI forwards `modelMode` and `model_override` to `/api/chat` while backend security gates, air-gap policy, and resource profilers remain authoritative.

---

## 7. Header Minimalism & Top-Right Cleanliness

- **Three-Dots / Ellipsis Menu Elimination**: The obsolete top-right overflow button (`btnContextTools`), dropdown (`contextToolsDropdown`), and related DOM/CSS/JS event listeners have been completely removed.
- **Clean Status Indicators**: The top-right header area is now strictly dedicated to high-visibility, non-interactive status pills:
  - `[ ● Gateway active ]` (Status glow blue)
  - `[ ● 101 agents active ]` (Status glow cyan)
  - `[ ● Local & Secure ]` (Sovereignty air-gap indicator)
- **Direct Workspace Focus**: Eliminates visual clutter, ensuring the operator's attention remains focused on the selected agent, active conversation context, and composer tools.

---

## 8. Verification Results

- **Composer & UI Regression Suite (`tests/sih/ui/composer-ui.test.js`)**: **PASS (6/6)**
- **Numeric Agent Identity Test (`tests/ui/agent-numbering.test.js`)**: **PASS (6/6)**
- **Local Model Selector Test (`tests/ui/model-selector.test.js`)**: **PASS (5/5)**
- **Full SIH Test Matrix (`tests/sih/run-all-tests.js`)**: **PASS (28/28 Suites)**
- **Workforce Fleet Test (`tests/run-all-agents.js`)**: **PASS (101/101 Agents)**
- **External Network Egress**: **0 Calls (100% Air-Gapped)**
