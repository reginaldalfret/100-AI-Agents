# SA-S03 Judge & Evaluator Demonstration Guide

**Live Access URL:** [`https://smartauto.reginaldalfret.tech`](https://smartauto.reginaldalfret.tech)  
**System Type:** Educational Intelligent Workflow Management Platform  
**Agent Workforce:** 100 Specialized AI Agents + 1 Master Orchestrator  
**Inference Engine:** Local NVIDIA Nemotron 3 Nano 4B Q4_K_M  

---

## 1. Flagship Demonstration: Autonomous Scholarship & Financial Aid Verification

### Narrative
Synthetic student **Demosthenes Rao (STU-DEMO-001)** applies for the Presidential Merit Scholarship ($6,000 award) by submitting verified academic mark sheets and government income proof.

### Step-by-Step Walkthrough
1. Navigate to **`https://smartauto.reginaldalfret.tech`**
2. In the **⚡ Workflow Center**, locate the top banner: **★ Flagship Judge Demonstration**.
3. Click **"⚡ Run Flagship Scholarship Demo"**.
4. Observe the live multi-agent execution in the **Step Visualizer**:
   - **`agent-040` (Student Verification Agent):** Authenticates profile, confirms enrolled status in B.S. AI & CS with GPA 3.90.
   - **`agent-045` (PDF & Transcript Processing Agent):** Extracts optical mark sheet scores and verifies cryptographic SHA-256 tamper hash.
   - **`agent-085` (Financial Aid Evaluator Agent):** Cross-checks policy thresholds (`GPA >= 3.80` and `Household Income <= $60,000`).
   - **`agent-046` (Fee Receipt Verification Agent):** Audits tuition ledger ($14,000 tuition fee, $2,000 paid, $12,000 balance).
   - **`agent-089` (Faculty Affairs HR Agent):** Verifies faculty advisor endorsement.
   - **`agent-099` (Evidence Aggregator Agent):** Compiles evidence records into a verifiable dossier.
5. **Human-in-the-Loop Gate:** The workflow pauses cleanly in `pending_approval`.
6. Click the **⚖️ Human Approvals Queue** tab in the top navigation.
7. Review the structured evidence dossier and click **"✓ Approve & Advance"**.
8. Observe the finalization:
   - Tuition ledger is credited ($6,000 grant applied).
   - **`agent-002` (Official Notice Agent)** generates and dispatches the award notification email.
   - Dual cryptographic signatures are recorded in the immutable audit trail.

---

## 2. Exploring the 100-Agent Educational Workforce

1. Click the **`🎓 Educational Workforce (100 Agents)`** tab.
2. Filter agents by the **10 Functional Domains**:
   - *Student Services, Admissions, Academics, Document Intelligence, Finance, Faculty/HR, Administration, Communication, Analytics, Workflow Intelligence*.
3. Search for any capability or tool (e.g. `transcript`, `merit`, `attendance`, `ledger`).
4. Notice that every agent card displays:
   - **Assigned Educational Role**
   - **Allowed Tools (RBAC permissions)**
   - **Active Workflow Association**
   - **Real-Time Status (`● READY`)**

---

## 3. Failure & Data Conflict Detection Demos

To demonstrate the platform's robustness against hallucinations and corrupted inputs:
1. In the **Workflow Launcher**, select **Student Admission & Document Verification**.
2. Select or enter test applicant **`APPLICANT-TEST-001`**.
3. Test failure scenarios using the API or test suite (`node --test tests/document-failure.test.js`):
   - **Data Conflict:** When declared income ($180k) conflicts with uploaded certificate ($120k), the system flags `DATA_CONFLICT_ESCALATED` and halts for manual audit rather than guessing.
   - **Corrupted Document:** Files with invalid byte streams or missing checksums return `ERROR_UNREADABLE` without hallucinating grades.
