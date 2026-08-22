# Specialist Agent Scope & Handoff Demonstration Script

**Platform:** Sovereign AI Workbench  
**Test URL:** `http://127.0.0.1:8300/`

---

## Live Demonstration Steps

### Step 1: Specialist Out-of-Scope Detection
1. Select **`003 Study AI Agent`** from the agent directory sidebar.
2. In the composer, enter:
   ```text
   Write a REST API handler in Node.js.
   ```
3. Click **Send** (or press Enter).
4. **Observed Output:**
   - The Study AI Agent immediately displays a calm, polite recommendation card:
     > *"I'd be happy to help, but this task is a little outside my specialty.*
     > *I focus on study planning, revision, exam preparation, flashcards, and learning support.*
     > *For backend development, I'd recommend:*
     > ***046 — Backend AI Agent***"
   - Shows action button: **`[ Switch to Backend AI Agent ]`** and **`[ Ask Super AI Agent ]`**.

### Step 2: One-Click Handoff & Prompt Retention
1. Click **`[ Switch to Backend AI Agent ]`**.
2. **Observed Behavior:**
   - Active agent seamlessly switches to **`046 Backend AI Agent`**.
   - Workspace header and description update to Backend AI Agent.
   - The user's original query (`"Write a REST API handler in Node.js."`) remains populated in the composer.
3. Click **Send**.
4. **Observed Output:**
   - Backend AI Agent generates and streams the complete Node.js REST API code with Qwen 2.5 Coder in real-time.

### Step 3: Conceptual Learning In-Scope Verification
1. Switch back to **`003 Study AI Agent`**.
2. In the composer, enter:
   ```text
   Explain REST APIs for my exam.
   ```
3. Click **Send**.
4. **Observed Output:**
   - Because the user's intent is study and learning, the Study AI Agent accepts the task and streams a clear, student-friendly explanation.
