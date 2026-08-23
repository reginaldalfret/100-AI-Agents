# 101 Super AI Agents — Agent-Specific Examples & Empty States Guide

This guide documents the canonical architecture, metadata flow, and quality rules for agent-specific empty states, example prompts, dynamic placeholders, and capabilities across all 101 agents in the **Sovereign AI Workbench**.

---

## 1. Core Architectural Principle

When any agent is selected in the UI:

$$\text{Selected Agent} \longrightarrow \text{Description} \longrightarrow \text{Capabilities} \longrightarrow \text{Examples / Quick Actions} \longrightarrow \text{Composer Placeholder}$$

All attributes are derived **strictly** from that individual agent's profile in the authoritative registry (`registry/sih-agent-mapping.json` & `registry/agents.json`). There are **no global cross-agent prompt fallbacks** or hard-coded assumptions.

---

## 2. Canonical Agent Profile Schema

```json
{
  "displayNumber": "003",
  "displayName": "Study AI Agent",
  "name": "Study AI Agent",
  "category": "Education & Learning",
  "description": "Generates study plans, active recall guides, flashcards, and concept explanations.",
  "capabilities": [
    "Study Plan Generation",
    "Concept Simplification",
    "Flashcard Creation",
    "Revision Coaching"
  ],
  "tools": [
    "Study Planner",
    "Flashcard Builder",
    "Concept Explainer"
  ],
  "examples": [
    "Create a 7-day study plan for my upcoming exams",
    "Explain this complex topic in simple terms with analogies",
    "Make flashcards and summary notes from this textbook chapter",
    "Help me revise this topic quickly before my test"
  ]
}
```

---

## 3. Example Prompt Quality Standards

1. **Role Authenticity**: Prompts must mirror real tasks a human user would delegate to that specific agent.
   - **001 Writing AI Agent**: Articles, proposals, announcements, document polishing.
   - **002 Email AI Agent**: Manager emails, client replies, follow-ups.
   - **003 Study AI Agent**: Study plans, flashcards, concept simplification, revision guides. *(Zero programming / Node.js)*
   - **051 Image Analysis AI Agent**: Surface corrosion detection, visual defect inspections, photo OCR.
   - **061 Code Generation AI Agent**: Python classes, TypeScript schemas, backend CRUD, worker queues.
   - **101 Super AI Agent**: Multi-agent task planning, end-to-end industrial investigations, fleet orchestration.
2. **Prompt Length**: 3 to 5 clear, concise, actionable prompts (each 10–90 characters).
3. **No Cross-Pollution**: If an agent lacks examples, it cleanly presents `"No example prompts available yet."` rather than showing examples from another agent.

---

## 4. Frontend Integration & Interaction

- **Dynamic Empty State**: Renders agent avatar, displayName, customized description, and 3–5 interactive quick-action chips.
- **Dynamic Placeholder**: Dynamically renders `Ask the [Agent Name]...` (e.g. `Ask the Study AI Agent...`).
- **One-Click Population**: Clicking an example chip automatically populates `#chatInput`, focuses the composer, and triggers auto-resizing.
- **Zero Stale State**: Switching agents updates the header, empty state, placeholder, about tab, capabilities tab, and examples tab synchronously in the same render loop.

---

## 5. Verification Commands

```bash
# Verify all 101 agent examples and empty state rules
node --test tests/ui/agent-examples.test.js

# Verify sidebar split scroll and ordering
node --test tests/ui/sidebar-split-scroll.test.js

# Verify full regression suite
node --test tests/ui/agent-taxonomy.test.js tests/ui/conversation-history.test.js tests/ui/model-selector.test.js
```
