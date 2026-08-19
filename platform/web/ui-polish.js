/**
 * Educational Intelligent Workflow Management Platform (SA-S03)
 * Core Frontend Controller & API Gateway Integration
 */

(function () {
  "use strict";

  // Determine Gateway API Base URL (default port 8300 or current origin)
  const API_BASE = window.location.port === "8300" || window.location.port === ""
    ? window.location.origin
    : (window.location.protocol + "//" + window.location.hostname + ":8300");

  // State Management
  const state = {
    currentMainTab: "workflow-center", // 'workflow-center' | 'approvals-queue' | 'institutional-records' | 'agent-fleet'
    currentRecordSubTab: "students", // 'students' | 'courses' | 'scholarships' | 'audit'
    workflows: [],
    instances: [],
    selectedInstanceId: null,
    institutionData: {
      students: [],
      courses: [],
      scholarshipSchemes: [],
      auditLogs: []
    },
    agents: [],
    selectedAgent: null,
    agentCategory: "all",
    agentSearchQuery: "",
    agentSubTab: "chat", // 'chat' | 'about' | 'capabilities' | 'examples'
    pollingInterval: null,
    isLoadingWorkflow: false,
    decisionInProgress: false
  };

  // Utility: HTML Escaping
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Utility: Format Date
  function formatDate(isoString) {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  }

  // Utility: Show Toast Notification
  function showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.style.cssText = "position:fixed; bottom:24px; right:24px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const bgColors = {
      success: "linear-gradient(135deg, rgba(0,245,160,0.9), rgba(0,180,120,0.95))",
      error: "linear-gradient(135deg, rgba(255,64,96,0.9), rgba(200,20,50,0.95))",
      info: "linear-gradient(135deg, rgba(0,234,255,0.9), rgba(40,123,255,0.95))",
      warning: "linear-gradient(135deg, rgba(255,184,0,0.95), rgba(220,140,0,0.95))"
    };

    toast.style.cssText = `
      background: ${bgColors[type] || bgColors.info};
      color: ${type === 'success' || type === 'warning' ? '#050b14' : '#ffffff'};
      font-weight: 700;
      font-size: 13px;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.3s ease;
    `;

    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // =========================================================
  // API CLIENT
  // =========================================================
  const api = {
    async getWorkflows() {
      const res = await fetch(`${API_BASE}/api/workflows`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async startWorkflow(payload) {
      const res = await fetch(`${API_BASE}/api/workflows/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    },

    async getInstances() {
      const res = await fetch(`${API_BASE}/api/workflows/instances`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getInstance(id) {
      const res = await fetch(`${API_BASE}/api/workflows/instances/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async submitDecision(instanceId, decision, notes = "") {
      const res = await fetch(`${API_BASE}/api/workflows/instances/${encodeURIComponent(instanceId)}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    },

    async getWorkforce() {
      const res = await fetch(`${API_BASE}/api/workforce`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getInstitutionData() {
      const res = await fetch(`${API_BASE}/api/institution/data`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getAuditLogs() {
      const res = await fetch(`${API_BASE}/api/institution/audit`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getAgents() {
      const res = await fetch(`${API_BASE}/api/agents`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getAgentsHealth() {
      const res = await fetch(`${API_BASE}/api/agents/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async sendChat(agentId, task, context = {}) {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, task, context })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    }
  };

  // =========================================================
  // NAVIGATION & TAB SWITCHING
  // =========================================================
  function initNavigation() {
    const navTabs = document.querySelectorAll(".top-nav-tab");
    navTabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = tab.getAttribute("data-tab");
        switchMainTab(targetView);
      });
    });

    const recordTabs = document.querySelectorAll(".records-subtab");
    recordTabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const subTab = tab.getAttribute("data-subtab");
        switchRecordSubTab(subTab);
      });
    });
  }

  function switchMainTab(tabId) {
    state.currentMainTab = tabId;

    // Update Top Nav
    document.querySelectorAll(".top-nav-tab").forEach(tab => {
      const isActive = tab.getAttribute("data-tab") === tabId;
      tab.classList.toggle("active", isActive);
    });

    // Update Views
    document.querySelectorAll(".app-view").forEach(view => {
      const isActive = view.id === `view-${tabId}`;
      view.classList.toggle("active", isActive);
      view.style.display = isActive ? "flex" : "none";
    });

    // Action on tab switch
    if (tabId === "workflow-center") {
      refreshWorkflowData();
    } else if (tabId === "agent-workforce") {
      refreshWorkforceData();
    } else if (tabId === "approvals-queue") {
      refreshApprovalsQueue();
    } else if (tabId === "institutional-records") {
      refreshInstitutionData();
    } else if (tabId === "agent-fleet") {
      if (state.agents.length === 0) loadAgentFleet();
    }
  }

  function switchRecordSubTab(subTab) {
    state.currentRecordSubTab = subTab;
    document.querySelectorAll(".records-subtab").forEach(tab => {
      tab.classList.toggle("active", tab.getAttribute("data-subtab") === subTab);
    });
    renderInstitutionalTable();
  }

  // =========================================================
  // VIEW 1: WORKFLOW AUTOMATION CENTER
  // =========================================================
  async function refreshWorkflowData() {
    try {
      const [wfRes, instRes] = await Promise.all([
        api.getWorkflows().catch(() => ({ workflows: [] })),
        api.getInstances().catch(() => ({ instances: [] }))
      ]);

      state.workflows = wfRes.workflows || [];
      state.instances = instRes.instances || [];

      renderWorkflowStats();
      renderWorkflowLauncherDropdown();
      renderInstanceList();

      // If an instance was selected or none is, pick first
      if (state.instances.length > 0) {
        if (!state.selectedInstanceId || !state.instances.find(i => i.id === state.selectedInstanceId)) {
          state.selectedInstanceId = state.instances[0].id;
        }
        loadAndRenderInstanceDetails(state.selectedInstanceId);
      } else {
        renderEmptyVisualizer();
      }

      updatePendingBadge();
    } catch (err) {
      console.warn("Workflow data fetch failed:", err);
    }
  }

  function renderWorkflowStats() {
    const total = state.instances.length;
    const running = state.instances.filter(i => i.status === "running").length;
    const pending = state.instances.filter(i => i.status === "pending_approval").length;
    const completed = state.instances.filter(i => i.status === "completed").length;

    const elTotal = document.getElementById("statTotalWorkflows");
    const elActive = document.getElementById("statActivePipelines");
    const elPending = document.getElementById("statPendingApprovals");
    const elCompleted = document.getElementById("statCompletedWorkflows");

    if (elTotal) elTotal.textContent = String(total);
    if (elActive) elActive.textContent = String(running);
    if (elPending) elPending.textContent = String(pending);
    if (elCompleted) elCompleted.textContent = String(completed);
  }

  function renderWorkflowLauncherDropdown() {
    const select = document.getElementById("workflowSelect");
    if (!select || select.options.length > 1) return; // already loaded

    select.innerHTML = '<option value="" disabled selected>-- Select Academic Workflow Pipeline --</option>';
    state.workflows.forEach(w => {
      const opt = document.createElement("option");
      opt.value = w.id;
      opt.textContent = `${w.name} (${w.category} · ${w.totalSteps} steps)`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      const selectedWf = state.workflows.find(w => w.id === select.value);
      updateLauncherFormFields(selectedWf);
    });
  }

  function updateLauncherFormFields(wf) {
    const descEl = document.getElementById("workflowDesc");
    const dynamicFields = document.getElementById("workflowDynamicFields");
    if (!wf) return;

    if (descEl) {
      descEl.textContent = wf.description || "";
      descEl.style.display = "block";
    }

    if (!dynamicFields) return;
    dynamicFields.innerHTML = "";

    // Common Student Selector
    const studentGroup = document.createElement("div");
    studentGroup.className = "form-group";
    studentGroup.innerHTML = `
      <label class="form-label">Target Student Profile</label>
      <select id="launchStudentId" class="form-select">
        <option value="STU-1001">STU-1001 · Aarav Sharma (GPA 3.85, CS)</option>
        <option value="STU-1002">STU-1002 · Priya Patel (GPA 3.92, AI)</option>
        <option value="STU-1003">STU-1003 · Rohan Mehta (GPA 2.30, Data Science · At Risk)</option>
        <option value="STU-1004">STU-1004 · Ananya Rao (GPA 3.78, M.S. Software Eng)</option>
        <option value="STU-1005">STU-1005 · Vikram Sengupta (Applicant · GPA 3.60)</option>
      </select>
    `;
    dynamicFields.appendChild(studentGroup);

    // Context-specific inputs based on workflow ID
    if (wf.id === "scholarship-eligibility") {
      const schemeGroup = document.createElement("div");
      schemeGroup.className = "form-group";
      schemeGroup.innerHTML = `
        <label class="form-label">Scholarship Scheme</label>
        <select id="launchSchemeId" class="form-select">
          <option value="SCH-MERIT">Presidential Merit Scholarship ($6,000)</option>
          <option value="SCH-NEED">Institutional Need-Based Grant ($8,000)</option>
          <option value="SCH-STEM">Future AI &amp; Technology Fellowship ($5,000)</option>
        </select>
      `;
      dynamicFields.appendChild(schemeGroup);
    } else if (wf.id === "course-override") {
      const courseGroup = document.createElement("div");
      courseGroup.className = "form-group";
      courseGroup.innerHTML = `
        <label class="form-label">Override Target Course</label>
        <select id="launchCourseCode" class="form-select">
          <option value="CS201">CS201 · Data Structures &amp; Algorithms</option>
          <option value="CS301">CS301 · Operating Systems</option>
          <option value="AI401">AI401 · Advanced Machine Learning &amp; Neural Nets</option>
        </select>
      `;
      dynamicFields.appendChild(courseGroup);

      const reasonGroup = document.createElement("div");
      reasonGroup.className = "form-group";
      reasonGroup.innerHTML = `
        <label class="form-label">Override Justification / Prerequisite Waiver Reason</label>
        <input type="text" id="launchOverrideReason" class="form-input" placeholder="e.g. Industry equivalent work experience or self-study" value="Completed equivalent online specialization with distinction." />
      `;
      dynamicFields.appendChild(reasonGroup);
    }

    // Additional Notes field
    const notesGroup = document.createElement("div");
    notesGroup.className = "form-group";
    notesGroup.innerHTML = `
      <label class="form-label">Administrative Notes (Optional)</label>
      <input type="text" id="launchNotes" class="form-input" placeholder="Optional initiation notes or reference ticket" />
    `;
    dynamicFields.appendChild(notesGroup);
  }

  async function handleLaunchWorkflow() {
    const select = document.getElementById("workflowSelect");
    if (!select || !select.value) {
      showToast("Please select a workflow to launch", "warning");
      return;
    }

    const workflowId = select.value;
    const studentId = document.getElementById("launchStudentId")?.value || "STU-1001";
    const schemeId = document.getElementById("launchSchemeId")?.value || undefined;
    const courseCode = document.getElementById("launchCourseCode")?.value || undefined;
    const reason = document.getElementById("launchOverrideReason")?.value || undefined;
    const notes = document.getElementById("launchNotes")?.value || undefined;

    const payload = {
      workflow_id: workflowId,
      studentId,
      schemeId,
      courseCode,
      reason,
      notes
    };

    const btn = document.getElementById("btnLaunchWorkflow");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Starting Pipeline...';
    }

    try {
      const res = await api.startWorkflow(payload);
      showToast(`Workflow initiated: ${res.instance?.id || 'Started'}`, "success");
      await refreshWorkflowData();
      if (res.instance?.id) {
        state.selectedInstanceId = res.instance.id;
        loadAndRenderInstanceDetails(res.instance.id);
      }
    } catch (err) {
      showToast(`Failed to start workflow: ${err.message}`, "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>⚡</span> Launch Autonomous Workflow';
      }
    }
  }

  function renderInstanceList() {
    const container = document.getElementById("instanceListContainer");
    if (!container) return;

    if (state.instances.length === 0) {
      container.innerHTML = `
        <div style="padding:30px; text-align:center; color:var(--text-muted); font-size:12px;">
          No active or previous workflow runs found. Launch one above!
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    state.instances.forEach(inst => {
      const card = document.createElement("div");
      card.className = `instance-card ${inst.id === state.selectedInstanceId ? 'active' : ''}`;
      
      const progressPercent = Math.round(((inst.currentStepIndex || 0) / (inst.totalSteps || 1)) * 100);
      const studentName = inst.context?.studentName || inst.context?.studentId || "Student";
      
      card.innerHTML = `
        <div class="instance-card-top">
          <span class="instance-title">${escapeHtml(inst.workflowName)}</span>
          <span class="badge-status ${inst.status}">${escapeHtml(inst.status.replace('_', ' '))}</span>
        </div>
        <div class="instance-meta">
          <span class="instance-id">${escapeHtml(inst.id)}</span>
          <span>👤 ${escapeHtml(studentName)}</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="instance-meta">
          <span>Step ${(inst.currentStepIndex || 0) + (inst.status === 'completed' ? 0 : 1)} of ${inst.totalSteps}</span>
          <span>${formatDate(inst.createdAt)}</span>
        </div>
      `;

      card.addEventListener("click", () => {
        state.selectedInstanceId = inst.id;
        renderInstanceList();
        loadAndRenderInstanceDetails(inst.id);
      });

      container.appendChild(card);
    });
  }

  async function loadAndRenderInstanceDetails(instanceId) {
    try {
      const res = await api.getInstance(instanceId);
      const inst = res.instance;
      if (!inst) return;
      renderStepVisualizer(inst);
    } catch (err) {
      console.warn("Error fetching instance details:", err);
    }
  }

  function renderEmptyVisualizer() {
    const container = document.getElementById("stepVisualizerContent");
    if (!container) return;
    container.innerHTML = `
      <div style="padding:60px 20px; text-align:center; color:var(--text-muted);">
        <div style="font-size:32px; margin-bottom:10px;">⚡</div>
        <div style="font-size:15px; font-weight:700; color:#fff;">No Pipeline Selected</div>
        <div style="font-size:12px; margin-top:6px;">Select a pipeline from the left panel or launch a new workflow to inspect its execution steps in real time.</div>
      </div>
    `;
  }

  // Visualizer with ZERO RAW JSON
  function renderStepVisualizer(inst) {
    const container = document.getElementById("stepVisualizerContent");
    if (!container) return;

    const currentStepIndex = inst.currentStepIndex || 0;
    const history = inst.stepHistory || [];
    const wfDef = state.workflows.find(w => w.id === inst.workflowId);

    // Top Header info
    let html = `
      <div class="inspector-header-box">
        <div class="inspector-title-group">
          <h3>${escapeHtml(inst.workflowName)}</h3>
          <div class="inspector-context-pills">
            <span class="context-pill">ID: <strong>${escapeHtml(inst.id)}</strong></span>
            <span class="context-pill">Student: <strong>${escapeHtml(inst.context?.studentName || inst.context?.studentId || 'N/A')}</strong></span>
            <span class="context-pill">Program: <strong>${escapeHtml(inst.context?.program || 'Academic')}</strong></span>
            <span class="badge-status ${inst.status}">${escapeHtml(inst.status.replace('_', ' '))}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <button id="btnManualRefresh" class="preset-chip" style="color:var(--cyan); border-color:rgba(0,234,255,0.3);" title="Refresh pipeline state">
            ↻ Refresh
          </button>
        </div>
      </div>
    `;

    // Step Timeline
    html += `<div class="step-timeline">`;

    const allSteps = wfDef ? wfDef.steps : [];
    
    // Iterate through all defined steps
    allSteps.forEach((step, idx) => {
      const historyItem = history.find(h => h.stepId === step.id);
      const isPast = idx < currentStepIndex || inst.status === "completed";
      const isCurrent = idx === currentStepIndex && inst.status !== "completed";
      const isPendingApproval = isCurrent && inst.status === "pending_approval";
      const isRejected = historyItem?.status === "rejected" || (isCurrent && inst.status === "rejected");

      let cardClass = "timeline-step-card";
      let statusLabel = "Waiting";
      let dotContent = idx + 1;

      if (isPast && historyItem?.status !== "rejected") {
        cardClass += " completed-step";
        statusLabel = "Completed";
        dotContent = "✓";
      } else if (isPendingApproval) {
        cardClass += " approval-needed";
        statusLabel = "Requires Approval";
        dotContent = "⚠️";
      } else if (isRejected) {
        cardClass += " rejected-step";
        statusLabel = "Rejected";
        dotContent = "✕";
      } else if (isCurrent) {
        cardClass += " active-step";
        statusLabel = "In Progress";
        dotContent = "⏳";
      }

      const typeClass = step.type === "service_check" ? "type-service" : step.type === "agent_task" ? "type-agent" : "type-human";
      const typeName = step.type === "service_check" ? "Service Verification" : step.type === "agent_task" ? "AI Agent Task" : "Human Approval Gate";

      html += `
        <div class="${cardClass}">
          <div class="step-node-dot">${dotContent}</div>
          <div class="step-card-header">
            <div class="step-name-box">
              <span class="step-type-pill ${typeClass}">${typeName}</span>
              <span class="step-name-title">${escapeHtml(step.name)}</span>
            </div>
            <span class="badge-status ${isPendingApproval ? 'pending_approval' : isRejected ? 'rejected' : isPast ? 'completed' : isCurrent ? 'running' : ''}">
              ${escapeHtml(statusLabel)}
            </span>
          </div>
      `;

      // Render Clean Output if Available
      if (historyItem?.output || isPendingApproval) {
        const outputData = historyItem?.output || inst.pendingDecision?.data || {};
        html += renderCleanStepOutput(step, outputData, historyItem);
      }

      // If pending approval, provide inline actions
      if (isPendingApproval) {
        html += `
          <div class="approval-action-console" style="margin-top:14px;">
            <div style="font-size:12px; color:var(--amber); font-weight:700;">
              ⚠️ Decision required by Committee / Dean before workflow can proceed.
            </div>
            <div class="approval-buttons-row">
              <button class="btn-approve" onclick="window.platformSubmitDecision('${inst.id}', 'approved')">
                <span>✓</span> Approve &amp; Continue
              </button>
              <button class="btn-reject" onclick="window.platformSubmitDecision('${inst.id}', 'rejected')">
                <span>✕</span> Reject
              </button>
            </div>
          </div>
        `;
      }

      html += `</div>`;
    });

    html += `</div>`;

    container.innerHTML = html;

    // Attach manual refresh handler
    const btnRefresh = document.getElementById("btnManualRefresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        loadAndRenderInstanceDetails(inst.id);
        showToast("Pipeline reloaded", "info");
      });
    }
  }

  // Format any output object into clean structured tiles - ZERO RAW JSON!
  function renderCleanStepOutput(step, data, historyItem) {
    if (!data || typeof data !== "object") return "";

    let html = `<div class="step-output-grid">`;

    for (const [key, value] of Object.entries(data)) {
      if (key === "agentPrompt" || key === "notificationDispatched" || key === "raw") continue;

      let displayValue = "";
      let statusClass = "";

      if (typeof value === "boolean") {
        displayValue = value ? "Passed / Verified" : "Failed / Missing";
        statusClass = value ? "output-status-pass" : "output-status-fail";
      } else if (typeof value === "number") {
        displayValue = key.toLowerCase().includes("rate") ? `${value}%` : key.toLowerCase().includes("amount") || key.toLowerCase().includes("balance") ? `$${value.toLocaleString()}` : String(value);
      } else if (Array.isArray(value)) {
        displayValue = value.length > 0 ? value.map(v => typeof v === 'object' ? (v.name || v.code || JSON.stringify(v)) : v).join(", ") : "None";
      } else if (typeof value === "object" && value !== null) {
        // Nested sub-object: format as badge summary
        displayValue = Object.entries(value).map(([k, v]) => `${k}: ${typeof v === 'object' ? '...' : v}`).join(" · ");
      } else {
        displayValue = String(value);
      }

      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());

      html += `
        <div class="output-metric-card">
          <span class="output-metric-label">${escapeHtml(formattedKey)}</span>
          <span class="output-metric-value ${statusClass}">${escapeHtml(displayValue)}</span>
        </div>
      `;
    }

    html += `</div>`;

    // If step was an AI Agent task (e.g. email or writing dispatch), render agent communication box
    if (historyItem?.agentName || step.agentName) {
      html += `
        <div class="agent-output-block">
          <div class="agent-output-header">
            <span>🤖 AI Dispatch: ${escapeHtml(historyItem?.agentName || step.agentName)}</span>
          </div>
          <div>Task dispatched and recorded in student ledger and institutional communication system.</div>
        </div>
      `;
    }

    return html;
  }

  // =========================================================
  // VIEW 2: EDUCATIONAL AGENT WORKFORCE MATRIX
  // =========================================================
  let workforceData = [];
  let selectedWorkforceDomain = "all";
  let workforceSearchQuery = "";

  async function refreshWorkforceData() {
    try {
      const res = await api.getWorkforce();
      workforceData = res.agents || [];
      renderWorkforceCards();
    } catch (err) {
      console.warn("Failed to load workforce:", err);
    }
  }

  function renderWorkforceCards() {
    const grid = document.getElementById("workforceAgentsGrid");
    if (!grid) return;

    const filtered = workforceData.filter(agent => {
      const matchDomain = selectedWorkforceDomain === "all" || agent.educational_domain === selectedWorkforceDomain;
      const query = workforceSearchQuery.toLowerCase().trim();
      const matchQuery = !query || 
        agent.agent_id.toLowerCase().includes(query) ||
        agent.educational_name.toLowerCase().includes(query) ||
        agent.original_name.toLowerCase().includes(query) ||
        (agent.domain_name || '').toLowerCase().includes(query) ||
        (agent.allowed_tools || []).some(t => t.toLowerCase().includes(query)) ||
        (agent.educational_capabilities || []).some(c => c.toLowerCase().includes(query));
      return matchDomain && matchQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 15px; font-weight: 700; color: #fff;">No Workforce Agents Found</div>
          <div style="font-size: 13px; margin-top: 4px;">Try searching for a different keyword or select another domain filter.</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(agent => {
      const domainColors = {
        "student-services": "#00eaff",
        "admission": "#ff007a",
        "academic": "#00f5a0",
        "document-intelligence": "#8b3dff",
        "finance": "#ffb800",
        "faculty-hr": "#ff5c00",
        "administration": "#0099ff",
        "communication": "#00d2ff",
        "analytics": "#a855f7",
        "workflow-intelligence": "#3b82f6",
        "master-orchestration": "#eab308"
      };

      const domainColor = domainColors[agent.educational_domain] || "#00eaff";

      const toolsBadges = (agent.allowed_tools || []).map(t => 
        `<span style="background: rgba(255,255,255,0.06); color: #cbd5e1; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-family: monospace;">${escapeHtml(t)}</span>`
      ).join(" ");

      const capsBadges = (agent.educational_capabilities || []).slice(0, 3).map(c => 
        `<span style="background: rgba(0,234,255,0.08); color: #7dd3fc; border: 1px solid rgba(0,234,255,0.2); padding: 2px 7px; border-radius: 6px; font-size: 10.5px;">${escapeHtml(c)}</span>`
      ).join(" ");

      const workflowsList = (agent.workflow_roles || []).join(", ");

      return `
        <div class="wf-panel" style="display: flex; flex-direction: column; gap: 12px; padding: 18px; border-left: 3px solid ${domainColor};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <div>
              <span style="font-family: monospace; font-size: 11px; color: ${domainColor}; font-weight: 800; text-transform: uppercase;">
                ${escapeHtml(agent.agent_id)}
              </span>
              <div style="font-size: 15px; font-weight: 800; color: #fff; margin-top: 2px;">
                ${escapeHtml(agent.educational_name)}
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                Base: ${escapeHtml(agent.original_name)}
              </div>
            </div>
            <span class="badge-status completed" style="font-size: 10.5px; padding: 3px 8px;">
              ● READY
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background: ${domainColor}20; color: ${domainColor}; border: 1px solid ${domainColor}40; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;">
              ${escapeHtml(agent.domain_name || agent.educational_domain)}
            </span>
            <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
              Port :${agent.port}
            </span>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">
              Allowed Tools (${(agent.allowed_tools || []).length})
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${toolsBadges}
            </div>
          </div>

          <div>
            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">
              Capabilities
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${capsBadges}
            </div>
          </div>

          <div style="margin-top: auto; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11.5px; color: var(--text-muted);">
            <strong style="color: #cbd5e1;">Workflows:</strong> ${escapeHtml(workflowsList)}
          </div>
        </div>
      `;
    }).join("");
  }

  function initWorkforceFilters() {
    const filters = document.querySelectorAll("#workforceDomainFilters .preset-chip");
    filters.forEach(btn => {
      btn.addEventListener("click", () => {
        filters.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedWorkforceDomain = btn.getAttribute("data-domain") || "all";
        renderWorkforceCards();
      });
    });

    const search = document.getElementById("workforceSearchInput");
    if (search) {
      search.addEventListener("input", (e) => {
        workforceSearchQuery = e.target.value;
        renderWorkforceCards();
      });
    }
  }

  // =========================================================
  // VIEW 3: HUMAN APPROVALS QUEUE
  // =========================================================
  async function refreshApprovalsQueue() {
    try {
      const res = await api.getInstances();
      state.instances = res.instances || [];
      updatePendingBadge();
      renderApprovalsQueue();
    } catch (err) {
      console.warn("Failed to fetch approvals:", err);
    }
  }

  function updatePendingBadge() {
    const pendingCount = state.instances.filter(i => i.status === "pending_approval").length;
    const badge = document.getElementById("pendingApprovalsBadge");
    if (badge) {
      badge.textContent = String(pendingCount);
      badge.style.display = pendingCount > 0 ? "inline-flex" : "none";
    }
  }

  function renderApprovalsQueue() {
    const container = document.getElementById("approvalsQueueList");
    if (!container) return;

    const pendingInstances = state.instances.filter(i => i.status === "pending_approval");

    if (pendingInstances.length === 0) {
      container.innerHTML = `
        <div class="empty-queue-box">
          <div class="empty-queue-icon">✓</div>
          <div style="font-size:18px; font-weight:750; color:#fff;">Approvals Queue is Clear</div>
          <div style="font-size:13px; color:var(--text-muted); max-width:450px;">
            There are currently no workflows awaiting Academic Committee or Dean reviews. All automated checks and prior decisions are up to date.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    pendingInstances.forEach(inst => {
      const card = document.createElement("div");
      card.className = "approval-card-item";

      const studentName = inst.context?.studentName || inst.context?.studentId || "Student";
      const studentId = inst.context?.studentId || "N/A";
      const pendingData = inst.pendingDecision?.data || {};

      card.innerHTML = `
        <div class="approval-card-header">
          <div>
            <div style="font-size:17px; font-weight:750; color:#fff;">${escapeHtml(inst.workflowName)}</div>
            <div style="font-size:11px; color:var(--cyan); margin-top:4px; font-family:monospace;">Pipeline ID: ${escapeHtml(inst.id)}</div>
          </div>
          <span class="approval-role-badge">Committee &amp; Dean Review</span>
        </div>

        <div class="approval-details-grid">
          <div class="approval-info-box">
            <h4>Student Dossier</h4>
            <div style="font-size:14px; font-weight:700; color:#fff;">${escapeHtml(studentName)}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">ID: ${escapeHtml(studentId)}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Program: ${escapeHtml(inst.context?.program || 'Academic')}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">GPA: ${inst.context?.gpa || '3.80+'}</div>
          </div>

          <div class="approval-info-box">
            <h4>Evaluation Criteria &amp; Summary</h4>
            <div style="font-size:12.5px; color:#e2e8f0; line-height:1.6;">
              ${Object.entries(pendingData).map(([k, v]) => `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</div>`).join('') || 'Evaluation complete and ready for signature.'}
            </div>
          </div>

          <div class="approval-info-box">
            <h4>Workflow Checkpoint</h4>
            <div style="font-size:13px; font-weight:700; color:var(--amber);">${escapeHtml(inst.pendingDecision?.stepName || 'Human Decision Gate')}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${escapeHtml(inst.pendingDecision?.description || 'Review candidate eligibility and sign off.')}</div>
            <div style="font-size:11px; color:var(--text-dim); margin-top:8px;">Initiated: ${formatDate(inst.createdAt)}</div>
          </div>
        </div>

        <div class="approval-action-console">
          <div class="form-group">
            <label class="form-label">Review Rationale / Decision Notes</label>
            <input type="text" id="notes-${inst.id}" class="form-input" placeholder="Enter optional justification or select preset below..." />
          </div>

          <div class="preset-notes-chips">
            <span class="preset-chip" onclick="document.getElementById('notes-${inst.id}').value = 'Approved per academic senate merit guidelines.'">Approved on Merit</span>
            <span class="preset-chip" onclick="document.getElementById('notes-${inst.id}').value = 'Prerequisites verified through department equivalency.'">Prerequisites Verified</span>
            <span class="preset-chip" onclick="document.getElementById('notes-${inst.id}').value = 'Financial need criteria fully validated.'">Need-Based Validated</span>
            <span class="preset-chip" onclick="document.getElementById('notes-${inst.id}').value = 'Rejected due to unmet eligibility threshold.'">Threshold Unmet</span>
          </div>

          <div class="approval-buttons-row">
            <button class="btn-approve" onclick="window.platformSubmitDecision('${inst.id}', 'approved')">
              <span>✓</span> Approve &amp; Execute Next Steps
            </button>
            <button class="btn-reject" onclick="window.platformSubmitDecision('${inst.id}', 'rejected')">
              <span>✕</span> Reject Application
            </button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Global Decision Handler (callable from HTML onclick)
  window.platformSubmitDecision = async function (instanceId, decision) {
    if (state.decisionInProgress) return;
    state.decisionInProgress = true;

    const notesInput = document.getElementById(`notes-${instanceId}`);
    const notes = notesInput ? notesInput.value : "";

    try {
      showToast(`Submitting ${decision.toUpperCase()} decision...`, "info");
      await api.submitDecision(instanceId, decision, notes);
      showToast(`Decision recorded: ${decision.toUpperCase()}`, "success");
      
      await refreshApprovalsQueue();
      await refreshWorkflowData();
    } catch (err) {
      showToast(`Failed to record decision: ${err.message}`, "error");
    } finally {
      state.decisionInProgress = false;
    }
  };

  // =========================================================
  // VIEW 3: INSTITUTIONAL RECORDS & AUDIT
  // =========================================================
  async function refreshInstitutionData() {
    try {
      const data = await api.getInstitutionData();
      state.institutionData = data || {};
      renderInstitutionalTable();
    } catch (err) {
      console.warn("Failed to load institutional records:", err);
    }
  }

  function renderInstitutionalTable() {
    const tableHeader = document.getElementById("recordsTableHeader");
    const tableBody = document.getElementById("recordsTableBody");
    const searchInput = document.getElementById("recordsSearchInput");
    const query = (searchInput?.value || "").toLowerCase();

    if (!tableHeader || !tableBody) return;

    if (state.currentRecordSubTab === "students") {
      tableHeader.innerHTML = `
        <tr>
          <th>Student ID</th>
          <th>Full Name</th>
          <th>Program</th>
          <th>GPA</th>
          <th>Attendance</th>
          <th>Status</th>
          <th>Documents</th>
        </tr>
      `;

      const students = state.institutionData.students || [];
      const filtered = students.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.program.toLowerCase().includes(query)
      );

      tableBody.innerHTML = filtered.map(s => `
        <tr>
          <td style="font-family:monospace; color:var(--cyan); font-weight:700;">${escapeHtml(s.id)}</td>
          <td style="font-weight:700; color:#fff;">${escapeHtml(s.name)}</td>
          <td>${escapeHtml(s.program)}</td>
          <td><strong style="color:${s.gpa >= 3.5 ? 'var(--green)' : s.gpa < 2.5 ? 'var(--rose)' : '#fff'}">${s.gpa}</strong></td>
          <td><span class="badge-status ${s.attendanceRate >= 85 ? 'completed' : s.attendanceRate < 75 ? 'rejected' : 'pending_approval'}">${s.attendanceRate}%</span></td>
          <td><span class="badge-status ${s.status === 'enrolled' ? 'completed' : s.status === 'at_risk' ? 'rejected' : 'pending_approval'}">${escapeHtml(s.status)}</span></td>
          <td>${(s.documents || []).map(d => `<span style="font-size:10.5px; padding:2px 6px; border-radius:4px; background:rgba(255,255,255,0.06); margin-right:4px;">${escapeHtml(d.type)}: ${d.status === 'verified' ? '✓' : '…'}</span>`).join('')}</td>
        </tr>
      `).join('') || `<tr><td colspan="7" style="text-align:center; padding:30px;">No students match your query.</td></tr>`;

    } else if (state.currentRecordSubTab === "courses") {
      tableHeader.innerHTML = `
        <tr>
          <th>Course Code</th>
          <th>Title</th>
          <th>Credits</th>
          <th>Prerequisites</th>
          <th>Enrollment Capacity</th>
          <th>Schedule</th>
        </tr>
      `;

      const courses = state.institutionData.courses || [];
      const filtered = courses.filter(c =>
        c.code.toLowerCase().includes(query) ||
        c.title.toLowerCase().includes(query)
      );

      tableBody.innerHTML = filtered.map(c => `
        <tr>
          <td style="font-family:monospace; color:var(--cyan); font-weight:700;">${escapeHtml(c.code)}</td>
          <td style="font-weight:700; color:#fff;">${escapeHtml(c.title)}</td>
          <td>${c.credits} Credits</td>
          <td>${(c.prerequisites || []).length > 0 ? c.prerequisites.map(p => `<span class="context-pill">${escapeHtml(p)}</span>`).join(' ') : '<span style="color:var(--text-muted);">None</span>'}</td>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span>${c.enrolled} / ${c.capacity}</span>
              <div class="progress-bar-wrap" style="width:70px;"><div class="progress-bar-fill" style="width:${Math.round((c.enrolled/c.capacity)*100)}%;"></div></div>
            </div>
          </td>
          <td>${escapeHtml(c.schedule || 'TBA')}</td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align:center; padding:30px;">No courses found.</td></tr>`;

    } else if (state.currentRecordSubTab === "scholarships") {
      tableHeader.innerHTML = `
        <tr>
          <th>Scheme ID</th>
          <th>Scheme Name</th>
          <th>Min GPA</th>
          <th>Min Attendance</th>
          <th>Income Cap</th>
          <th>Award Amount</th>
          <th>Description</th>
        </tr>
      `;

      const schemes = state.institutionData.scholarshipSchemes || [];
      tableBody.innerHTML = schemes.map(sc => `
        <tr>
          <td style="font-family:monospace; color:var(--cyan); font-weight:700;">${escapeHtml(sc.id)}</td>
          <td style="font-weight:700; color:#fff;">${escapeHtml(sc.name)}</td>
          <td>${sc.minGpa}</td>
          <td>${sc.minAttendance}%</td>
          <td>${sc.maxIncome === Infinity ? 'No Cap' : `$${sc.maxIncome.toLocaleString()}`}</td>
          <td><strong style="color:var(--green); font-size:14px;">$${sc.awardAmount.toLocaleString()}</strong></td>
          <td style="font-size:12px; color:var(--text-muted);">${escapeHtml(sc.description)}</td>
        </tr>
      `).join('') || `<tr><td colspan="7" style="text-align:center; padding:30px;">No scholarship schemes found.</td></tr>`;

    } else if (state.currentRecordSubTab === "audit") {
      tableHeader.innerHTML = `
        <tr>
          <th>Timestamp</th>
          <th>Workflow ID</th>
          <th>Action</th>
          <th>Actor</th>
          <th>Status</th>
          <th>Action Details</th>
        </tr>
      `;

      const logs = state.institutionData.auditLogs || [];
      const filtered = logs.filter(l =>
        l.action.toLowerCase().includes(query) ||
        (l.workflowId && l.workflowId.toLowerCase().includes(query)) ||
        (l.actor && l.actor.toLowerCase().includes(query))
      );

      tableBody.innerHTML = filtered.map(l => `
        <tr>
          <td style="font-size:11.5px; color:var(--text-muted);">${formatDate(l.timestamp)}</td>
          <td style="font-family:monospace; color:var(--cyan);">${escapeHtml(l.workflowId || '-')}</td>
          <td><strong style="color:#fff;">${escapeHtml(l.action)}</strong></td>
          <td><span class="context-pill">${escapeHtml(l.actor || 'System')}</span></td>
          <td><span class="badge-status ${l.status || 'completed'}">${escapeHtml(l.status || 'OK')}</span></td>
          <td style="font-size:12px; color:#c7d2fe;">${Object.entries(l.details || {}).map(([k, v]) => `${k}: ${v}`).join(' · ') || '-'}</td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align:center; padding:30px;">No audit records found.</td></tr>`;
    }
  }

  // =========================================================
  // VIEW 4: 100 AI AGENT FLEET CHAT
  // =========================================================
  async function loadAgentFleet() {
    try {
      const [agentsRes, healthRes] = await Promise.all([
        api.getAgents().catch(() => ({ agents: [] })),
        api.getAgentsHealth().catch(() => ({ online: 101, total: 101 }))
      ]);

      state.agents = agentsRes.agents || [];
      renderAgentCategories();
      renderAgentList();

      if (state.agents.length > 0 && !state.selectedAgent) {
        selectAgent(state.agents[0]);
      }
    } catch (err) {
      console.warn("Failed to load agent fleet:", err);
    }
  }

  function renderAgentCategories() {
    const container = document.getElementById("fleetCategories");
    if (!container) return;

    const cats = ["all", "foundation", "coding", "productivity", "academic", "data", "business"];
    container.innerHTML = cats.map(cat => `
      <div class="category ${state.agentCategory === cat ? 'active' : ''}" data-category="${cat}">
        <span>${cat === 'all' ? '◈' : '✦'}</span>
        <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
      </div>
    `).join('');

    container.querySelectorAll(".category").forEach(el => {
      el.addEventListener("click", () => {
        state.agentCategory = el.getAttribute("data-category");
        renderAgentCategories();
        renderAgentList();
      });
    });
  }

  function renderAgentList() {
    const list = document.getElementById("fleetAgentList");
    if (!list) return;

    const query = state.agentSearchQuery.toLowerCase();
    const filtered = state.agents.filter(a => {
      const matchCat = state.agentCategory === "all" || a.category === state.agentCategory;
      const matchQuery = !query || a.name.toLowerCase().includes(query) || a.agent_id.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });

    list.innerHTML = filtered.map(a => `
      <div class="agent-item ${state.selectedAgent?.agent_id === a.agent_id ? 'active' : ''}" data-id="${a.agent_id}">
        <div class="agent-item-avatar">✦</div>
        <div class="agent-item-info">
          <div class="agent-item-name">${escapeHtml(a.name)}</div>
          <div class="agent-item-desc">${escapeHtml(a.agent_id)} · ${escapeHtml(a.category)}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll(".agent-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        const ag = state.agents.find(a => a.agent_id === id);
        if (ag) selectAgent(ag);
      });
    });
  }

  function selectAgent(agent) {
    state.selectedAgent = agent;
    renderAgentList();

    const titleEl = document.getElementById("chatHeaderTitle");
    const metaEl = document.getElementById("chatHeaderMeta");
    const nemotronEl = document.getElementById("chatHeaderNemotron");

    if (titleEl) titleEl.textContent = agent.name;
    if (metaEl) metaEl.textContent = `${agent.agent_id} · Category: ${agent.category}`;
    if (nemotronEl) nemotronEl.textContent = `⚡ Model: ${agent.model || 'nemotron-3-nano'}`;

    renderAgentSubTabs();
  }

  function renderAgentSubTabs() {
    const tabs = document.querySelectorAll(".chat-agent-subtab");
    tabs.forEach(t => {
      const tabKey = t.getAttribute("data-subtab");
      t.classList.toggle("active", tabKey === state.agentSubTab);
    });

    const chatArea = document.getElementById("fleetMessages");
    const infoPanel = document.getElementById("fleetInfoPanel");

    if (state.agentSubTab === "chat") {
      if (chatArea) chatArea.style.display = "block";
      if (infoPanel) infoPanel.style.display = "none";
    } else {
      if (chatArea) chatArea.style.display = "none";
      if (infoPanel) {
        infoPanel.style.display = "block";
        renderAgentInfoContent(infoPanel);
      }
    }
  }

  function renderAgentInfoContent(panel) {
    const ag = state.selectedAgent;
    if (!ag) return;

    if (state.agentSubTab === "about") {
      panel.innerHTML = `
        <div style="max-width:800px; margin:0 auto; padding:20px;">
          <div class="agent-panel-kicker">${escapeHtml(ag.agent_id)} · ${escapeHtml(ag.category)}</div>
          <h2 style="font-size:28px; margin:8px 0 16px; color:#fff;">${escapeHtml(ag.name)}</h2>
          <div class="agent-detail-grid">
            <div class="agent-detail-card"><span>Agent ID</span><strong>${escapeHtml(ag.agent_id)}</strong></div>
            <div class="agent-detail-card"><span>Category</span><strong>${escapeHtml(ag.category)}</strong></div>
            <div class="agent-detail-card"><span>Model Engine</span><strong>${escapeHtml(ag.model || 'nemotron-3-nano')}</strong></div>
            <div class="agent-detail-card"><span>API Gateway Port</span><strong>${ag.port || 8101}</strong></div>
          </div>
          <div style="margin-top:24px; line-height:1.7; color:var(--text-muted);">
            ${escapeHtml(ag.name)} is a dedicated Nemotron-powered agent specialized in educational and operational intelligent workflow execution.
          </div>
        </div>
      `;
    } else if (state.agentSubTab === "capabilities") {
      const caps = ag.capabilities || ["Autonomous Workflow Execution", "Natural Language Reasoning", "Structured JSON Synthesis", "Institutional Service Invocation"];
      panel.innerHTML = `
        <div style="max-width:800px; margin:0 auto; padding:20px;">
          <div class="agent-panel-kicker">Operational Scope</div>
          <h2 style="font-size:28px; margin:8px 0 16px; color:#fff;">Capabilities</h2>
          <div class="agent-capability-grid">
            ${caps.map(c => `<div class="agent-capability-chip">✦ ${escapeHtml(c)}</div>`).join('')}
          </div>
        </div>
      `;
    } else if (state.agentSubTab === "examples") {
      panel.innerHTML = `
        <div style="max-width:800px; margin:0 auto; padding:20px;">
          <div class="agent-panel-kicker">Sample Invocations</div>
          <h2 style="font-size:28px; margin:8px 0 16px; color:#fff;">Example Prompts</h2>
          <div class="agent-example-list">
            <button class="agent-example-card" onclick="window.platformUsePrompt('Evaluate the prerequisite clearance for CS301')">
              <span>Academic Evaluation</span>
              <strong>Evaluate the prerequisite clearance for CS301</strong>
            </button>
            <button class="agent-example-card" onclick="window.platformUsePrompt('Draft an official approval letter for the Presidential Merit Scholarship')">
              <span>Document Generation</span>
              <strong>Draft an official approval letter for the Presidential Merit Scholarship</strong>
            </button>
            <button class="agent-example-card" onclick="window.platformUsePrompt('Generate a student attendance intervention plan')">
              <span>Advising Strategy</span>
              <strong>Generate a student attendance intervention plan</strong>
            </button>
          </div>
        </div>
      `;
    }
  }

  window.platformUsePrompt = function(promptText) {
    const input = document.getElementById("fleetInput");
    if (input) {
      input.value = promptText;
      input.focus();
    }
    state.agentSubTab = "chat";
    renderAgentSubTabs();
  };

  async function handleSendChatMessage() {
    const input = document.getElementById("fleetInput");
    const messages = document.getElementById("fleetMessages");
    if (!input || !input.value.trim() || !state.selectedAgent) return;

    const text = input.value.trim();
    input.value = "";

    // Append User Message
    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.innerHTML = `
      <div class="bubble">${escapeHtml(text)}</div>
      <div class="message-avatar">YOU</div>
    `;
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    // Loading Bubble
    const aiMsg = document.createElement("div");
    aiMsg.className = "message ai";
    aiMsg.innerHTML = `
      <div class="message-avatar">✦</div>
      <div class="bubble"><span class="typing"><span></span><span></span><span></span></span></div>
    `;
    messages.appendChild(aiMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await api.sendChat(state.selectedAgent.agent_id, text);
      const outputText = res.result?.response || res.result?.result || res.result?.message || (typeof res.result === 'string' ? res.result : JSON.stringify(res.result));
      aiMsg.querySelector(".bubble").textContent = outputText;
    } catch (err) {
      aiMsg.querySelector(".bubble").textContent = `Error connecting to ${state.selectedAgent.name}: ${err.message}`;
    }
    messages.scrollTop = messages.scrollHeight;
  }

  // =========================================================
  // INITIALIZATION & POLLING
  // =========================================================
  function init() {
    initNavigation();

    // Launcher submit
    const btnLaunch = document.getElementById("btnLaunchWorkflow");
    if (btnLaunch) btnLaunch.addEventListener("click", handleLaunchWorkflow);

    // Records search
    const recordsSearch = document.getElementById("recordsSearchInput");
    if (recordsSearch) recordsSearch.addEventListener("input", renderInstitutionalTable);

    // Fleet search & chat
    const fleetSearch = document.getElementById("fleetAgentSearch");
    if (fleetSearch) {
      fleetSearch.addEventListener("input", (e) => {
        state.agentSearchQuery = e.target.value;
        renderAgentList();
      });
    }

    const fleetSend = document.getElementById("fleetSendBtn");
    if (fleetSend) fleetSend.addEventListener("click", handleSendChatMessage);

    const fleetInput = document.getElementById("fleetInput");
    if (fleetInput) {
      fleetInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendChatMessage();
        }
      });
    }

    // Subtabs in Chat Header
    document.querySelectorAll(".chat-agent-subtab").forEach(tab => {
      tab.addEventListener("click", () => {
        state.agentSubTab = tab.getAttribute("data-subtab");
        renderAgentSubTabs();
      });
    });

    initWorkforceFilters();

    // Initial Data Load
    refreshWorkflowData();
    refreshWorkforceData();
    refreshApprovalsQueue();
    refreshInstitutionData();

    // Background live polling every 3.5s for real-time tracking
    state.pollingInterval = setInterval(() => {
      if (state.currentMainTab === "workflow-center") {
        api.getInstances().then(res => {
          state.instances = res.instances || [];
          renderWorkflowStats();
          renderInstanceList();
          updatePendingBadge();
          if (state.selectedInstanceId) {
            const currentInst = state.instances.find(i => i.id === state.selectedInstanceId);
            if (currentInst && (currentInst.status === 'running' || currentInst.status === 'pending_approval')) {
              loadAndRenderInstanceDetails(state.selectedInstanceId);
            }
          }
        }).catch(() => {});
      } else if (state.currentMainTab === "approvals-queue") {
        refreshApprovalsQueue();
      }
    }, 3500);
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
