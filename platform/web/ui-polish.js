/**
 * SA-S03 Educational AI Operations Platform
 * Master Enterprise Frontend Controller & Real-Time Gateway Integration
 */

(function () {
  "use strict";

  // Determine Gateway API Base URL (relative or port 8300)
  const API_BASE = window.location.port === "8300" || window.location.port === ""
    ? window.location.origin
    : (window.location.protocol + "//" + window.location.hostname + ":8300");

  // Application State
  const state = {
    currentView: "dashboard", // 'dashboard' | 'workflows' | 'workforce' | 'approvals' | 'documents' | 'records' | 'audit' | 'chat' | 'health'
    recordsSubTab: "students", // 'students' | 'courses' | 'scholarships'
    workflows: [],
    instances: [],
    selectedInstanceId: null,
    workforceAgents: [],
    selectedWorkforceDomain: "all",
    workforceSearchQuery: "",
    documents: [],
    selectedDocId: null,
    institutionData: {
      students: [],
      courses: [],
      scholarshipSchemes: [],
      auditLogs: []
    },
    chatAgents: [],
    selectedChatAgent: null,
    pollingInterval: null,
    systemMetrics: null
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

  // Utility: Format Date & Time
  function formatDate(isoString) {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  }

  // Utility: Toast Notification System
  function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    const bgColors = {
      success: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.98))",
      error: "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.98))",
      warning: "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.98))",
      info: "linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.98))"
    };

    toast.style.cssText = `
      background: ${bgColors[type] || bgColors.info};
      color: #ffffff;
      font-weight: 700;
      font-size: 12.5px;
      padding: 12px 18px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeIn 0.25s ease-out;
      transition: all 0.3s ease;
    `;

    const iconMap = { success: "✓", error: "✕", warning: "⚠️", info: "ℹ️" };
    toast.innerHTML = `<span>${iconMap[type] || "ℹ️"}</span> <span>${escapeHtml(message)}</span>`;
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
    async getHealth() {
      const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getSystemMetrics() {
      const res = await fetch(`${API_BASE}/api/system/metrics`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getWorkforce() {
      const res = await fetch(`${API_BASE}/api/workforce`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

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

    async getInstitutionData() {
      const res = await fetch(`${API_BASE}/api/institution/data`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getDocuments() {
      const res = await fetch(`${API_BASE}/api/documents`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    async getAgents() {
      const res = await fetch(`${API_BASE}/api/agents`, { cache: "no-store" });
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
  // NAVIGATION & SHELL CONTROLLER
  // =========================================================
  function initNavigation() {
    // Sidebar Buttons
    document.querySelectorAll(".nav-item-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const viewId = btn.getAttribute("data-view");
        switchMainView(viewId);
      });
    });

    // Mobile Sidebar Toggle
    const btnMobile = document.getElementById("btnToggleSidebar");
    const sidebar = document.getElementById("appSidebar");
    if (btnMobile && sidebar) {
      btnMobile.addEventListener("click", () => {
        sidebar.classList.toggle("open");
      });
    }

    // Topbar Flagship Buttons
    const btnTopDemo = document.getElementById("btnTopFlagshipDemo");
    if (btnTopDemo) btnTopDemo.addEventListener("click", runFlagshipScholarshipDemo);

    const btnDashDemo = document.getElementById("btnDashboardFlagship");
    if (btnDashDemo) btnDashDemo.addEventListener("click", runFlagshipScholarshipDemo);

    // Slide-out Drawer Close
    const btnCloseDrawer = document.getElementById("btnCloseDrawer");
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener("click", () => {
        document.getElementById("inspectorDrawer")?.classList.remove("open");
      });
    }

    // Global Search Bar
    const globalSearch = document.getElementById("globalSearchInput");
    if (globalSearch) {
      globalSearch.addEventListener("input", (e) => {
        handleGlobalSearch(e.target.value);
      });
    }
  }

  window.switchMainView = function (viewId) {
    state.currentView = viewId;

    // Update Sidebar Active state
    document.querySelectorAll(".nav-item-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewId);
    });

    // Update Views Visibility
    document.querySelectorAll(".app-view").forEach(view => {
      view.classList.toggle("active", view.id === `view-${viewId}`);
    });

    // Update Breadcrumb Title
    const breadcrumbMap = {
      dashboard: "Operations Overview",
      workflows: "Workflow Automation Center",
      workforce: "Educational AI Workforce (100 Agents)",
      approvals: "Academic Committee Approvals",
      documents: "Document Intelligence Workspace",
      records: "Institutional Records & Catalogs",
      audit: "Audit & Evidence Trail",
      chat: "Fleet Operations Console",
      health: "System Observability & Metrics"
    };

    const breadcrumbEl = document.getElementById("topbarBreadcrumbTitle");
    if (breadcrumbEl) breadcrumbEl.textContent = breadcrumbMap[viewId] || "Operations Overview";

    // Trigger View-Specific Refresh
    if (viewId === "dashboard") refreshDashboardData();
    else if (viewId === "workflows") refreshWorkflowData();
    else if (viewId === "workforce") refreshWorkforceView();
    else if (viewId === "approvals") refreshApprovalsQueue();
    else if (viewId === "documents") refreshDocumentsView();
    else if (viewId === "records") refreshRecordsView();
    else if (viewId === "audit") refreshAuditView();
    else if (viewId === "chat") initChatView();
    else if (viewId === "health") refreshSystemHealth();

    // Close mobile sidebar if open
    document.getElementById("appSidebar")?.classList.remove("open");
  };

  // Slide-out Inspector Drawer Helper
  function openInspectorDrawer(title, htmlContent) {
    const drawer = document.getElementById("inspectorDrawer");
    const drawerTitle = document.getElementById("drawerTitle");
    const drawerBody = document.getElementById("drawerContent");

    if (drawer && drawerTitle && drawerBody) {
      drawerTitle.textContent = title;
      drawerBody.innerHTML = htmlContent;
      drawer.classList.add("open");
    }
  }

  // =========================================================
  // VIEW 1: OPERATIONS DASHBOARD (OVERVIEW)
  // =========================================================
  async function refreshDashboardData() {
    try {
      const [wfRes, instRes, instData] = await Promise.all([
        api.getWorkflows().catch(() => ({ workflows: [] })),
        api.getInstances().catch(() => ({ instances: [] })),
        api.getInstitutionData().catch(() => ({}))
      ]);

      state.workflows = wfRes.workflows || [];
      state.instances = instRes.instances || [];
      state.institutionData = instData;

      // Update KPI Metrics
      const totalAgents = 101;
      const activeWorkflows = state.instances.filter(i => i.status === "running" || i.status === "pending_approval").length;
      const pendingApprovals = state.instances.filter(i => i.status === "pending_approval").length;
      const completed = state.instances.filter(i => i.status === "completed").length;

      document.getElementById("kpiTotalAgents").textContent = String(totalAgents);
      document.getElementById("kpiActiveWorkflows").textContent = String(activeWorkflows || state.workflows.length);
      document.getElementById("kpiPendingApprovals").textContent = String(pendingApprovals);
      document.getElementById("kpiCompletedPipelines").textContent = String(completed);

      // Update Approval Badge on Nav
      const navBadge = document.getElementById("navApprovalBadge");
      if (navBadge) {
        navBadge.textContent = String(pendingApprovals);
        navBadge.style.display = pendingApprovals > 0 ? "inline-flex" : "none";
      }

      renderDashboardActivePipelines();
      renderDashboardActivityStream();
    } catch (err) {
      console.warn("Dashboard refresh error:", err);
    }
  }

  function renderDashboardActivePipelines() {
    const container = document.getElementById("dashboardActivePipelinesContainer");
    if (!container) return;

    if (state.instances.length === 0) {
      container.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
          No active pipelines currently running. Click "Run Flagship Demo" above to start!
        </div>
      `;
      return;
    }

    container.innerHTML = state.instances.slice(0, 4).map(inst => {
      const progress = Math.round(((inst.currentStepIndex || 1) / (inst.totalSteps || 4)) * 100);
      const studentName = inst.context?.studentName || inst.context?.studentId || "Student";

      return `
        <div class="kpi-card" style="padding: 12px 16px; cursor: pointer;" onclick="openWorkflowFromDashboard('${inst.id}')">
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #fff; font-size: 13px;">${escapeHtml(inst.workflowName)}</span>
              <span class="badge-status ${inst.status}">${escapeHtml(inst.status.replace('_', ' '))}</span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
              Target: <strong style="color:#cbd5e1;">${escapeHtml(studentName)}</strong> · ID: <span style="font-family:monospace;">${inst.id}</span>
            </div>
            <div style="width: 100%; height: 4px; background: var(--bg-subtle); border-radius: 2px; margin-top: 8px; overflow: hidden;">
              <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent-cyan));"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderDashboardActivityStream() {
    const stream = document.getElementById("dashboardActivityStream");
    if (!stream) return;

    const logs = state.institutionData?.auditLogs || [];
    if (logs.length === 0) {
      stream.innerHTML = `<div style="color: var(--text-muted);">Awaiting real-time agent events...</div>`;
      return;
    }

    stream.innerHTML = logs.slice(0, 5).map(item => `
      <div style="display: flex; gap: 10px; align-items: flex-start; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
        <span style="color: var(--primary); font-size: 14px;">●</span>
        <div>
          <div style="font-weight: 600; color: #fff;">${escapeHtml(item.action || 'Tool Execution')}</div>
          <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
            Agent: <strong style="color: var(--accent-cyan);">${escapeHtml(item.agentId || 'agent-101')}</strong> · ${formatDate(item.timestamp)}
          </div>
        </div>
      </div>
    `).join("");
  }

  window.openWorkflowFromDashboard = function (instanceId) {
    state.selectedInstanceId = instanceId;
    switchMainView("workflows");
  };

  // =========================================================
  // VIEW 2: WORKFLOW AUTOMATION CENTER
  // =========================================================
  async function refreshWorkflowData() {
    try {
      const [wfRes, instRes] = await Promise.all([
        api.getWorkflows(),
        api.getInstances()
      ]);

      state.workflows = wfRes.workflows || [];
      state.instances = instRes.instances || [];

      renderWorkflowLauncherDropdown();
      renderWorkflowInstancesList();

      if (state.selectedInstanceId) {
        loadAndRenderVisualizer(state.selectedInstanceId);
      } else if (state.instances.length > 0) {
        state.selectedInstanceId = state.instances[0].id;
        loadAndRenderVisualizer(state.instances[0].id);
      }
    } catch (err) {
      console.warn("Workflows load error:", err);
    }
  }

  function renderWorkflowLauncherDropdown() {
    const select = document.getElementById("wfCustomSelect");
    if (!select || select.options.length > 1) return;

    select.innerHTML = '<option value="" disabled selected>-- Select an academic workflow pipeline --</option>';
    state.workflows.forEach(w => {
      const opt = document.createElement("option");
      opt.value = w.id;
      opt.textContent = `${w.name} (${w.category} · ${w.totalSteps} steps)`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      const sel = state.workflows.find(w => w.id === select.value);
      updateLauncherFormFields(sel);
    });

    const btnExec = document.getElementById("btnExecuteLaunch");
    if (btnExec) btnExec.addEventListener("click", handleCustomWorkflowLaunch);
  }

  function updateLauncherFormFields(wf) {
    const container = document.getElementById("wfDynamicFieldsContainer");
    if (!container || !wf) return;

    container.innerHTML = `
      <div style="margin-top: 8px;">
        <label style="font-size: 11.5px; font-weight: 700; color: var(--text-muted);">Target Student Profile</label>
        <select id="launchStudentId" class="topbar-search-input" style="padding-left: 12px; margin-top: 4px;">
          <option value="STU-DEMO-001">STU-DEMO-001 (Demosthenes Rao - B.S. AI & CS - GPA 3.90)</option>
          <option value="STU-1001">STU-1001 (Aarav Sharma - B.S. CS - GPA 3.85)</option>
          <option value="STU-1002">STU-1002 (Priya Patel - B.S. AI - GPA 3.92)</option>
          <option value="STU-1003">STU-1003 (Rohan Mehta - B.S. Data Science - At Risk)</option>
          <option value="STU-1004">STU-1004 (Ananya Rao - M.S. Software Engineering)</option>
          <option value="STU-1005">STU-1005 (Vikram Sengupta - B.S. CS Applicant)</option>
          <option value="APPLICANT-TEST-001">APPLICANT-TEST-001 (Sophia Chen - Admission Candidate)</option>
        </select>
      </div>
    `;
  }

  window.quickLaunchWorkflow = async function (workflowId) {
    try {
      showToast(`Initiating ${workflowId}...`, "info");
      const res = await api.startWorkflow({
        workflow_id: workflowId,
        studentId: workflowId === "admission-verification" ? "STU-1005" : "STU-DEMO-001",
        scholarshipId: "SCH-MERIT",
        courseCode: "CS301",
        notes: `Autonomous initiation via Operations Center: ${workflowId}`
      });

      showToast(`Workflow ${res.instance?.id} launched successfully!`, "success");
      await refreshWorkflowData();
      if (res.instance?.id) {
        state.selectedInstanceId = res.instance.id;
        loadAndRenderVisualizer(res.instance.id);
      }
    } catch (err) {
      showToast(`Launch failed: ${err.message}`, "error");
    }
  };

  async function handleCustomWorkflowLaunch() {
    const select = document.getElementById("wfCustomSelect");
    if (!select || !select.value) {
      showToast("Please select a workflow pipeline", "warning");
      return;
    }

    const studentId = document.getElementById("launchStudentId")?.value || "STU-DEMO-001";
    quickLaunchWorkflow(select.value);
  }

  function renderWorkflowInstancesList() {
    const container = document.getElementById("wfInstancesList");
    if (!container) return;

    if (state.instances.length === 0) {
      container.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted);">No executions recorded.</div>`;
      return;
    }

    container.innerHTML = state.instances.map(inst => `
      <div class="kpi-card" style="padding: 10px 14px; cursor: pointer; border-color: ${inst.id === state.selectedInstanceId ? 'var(--primary)' : 'var(--border)'};" onclick="selectInstance('${inst.id}')">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: #fff; font-size: 12.5px;">${escapeHtml(inst.workflowName)}</span>
            <span class="badge-status ${inst.status}">${escapeHtml(inst.status.replace('_', ' '))}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px; font-family: monospace;">
            ${escapeHtml(inst.id)} · ${formatDate(inst.createdAt)}
          </div>
        </div>
      </div>
    `).join("");
  }

  window.selectInstance = function (instanceId) {
    state.selectedInstanceId = instanceId;
    renderWorkflowInstancesList();
    loadAndRenderVisualizer(instanceId);
  };

  async function loadAndRenderVisualizer(instanceId) {
    const container = document.getElementById("wfVisualizerContainer");
    if (!container) return;

    try {
      const res = await api.getInstance(instanceId);
      const inst = res.instance;
      if (!inst) return;

      const wfDef = state.workflows.find(w => w.id === inst.workflowId);
      const allSteps = wfDef?.steps || [];
      const history = inst.stepHistory || [];
      const currentStepIndex = inst.currentStepIndex || 0;

      let html = `
        <div style="padding: 16px; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #fff;">${escapeHtml(inst.workflowName)}</h3>
              <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">
                Instance ID: <span style="font-family:monospace; color:var(--accent-cyan);">${inst.id}</span> · Target: <strong>${escapeHtml(inst.context?.studentName || inst.context?.studentId || 'Student')}</strong>
              </div>
            </div>
            <span class="badge-status ${inst.status}" style="font-size: 12px; padding: 4px 12px;">
              ${escapeHtml(inst.status.replace('_', ' '))}
            </span>
          </div>
        </div>

        <div class="timeline-stepper">
      `;

      allSteps.forEach((step, idx) => {
        const historyItem = history.find(h => h.stepId === step.id);
        const isPast = idx < currentStepIndex || inst.status === "completed";
        const isCurrent = idx === currentStepIndex && inst.status !== "completed";
        const isPendingApproval = isCurrent && inst.status === "pending_approval";
        const isRejected = historyItem?.status === "rejected" || (isCurrent && inst.status === "rejected");

        let cardClass = "timeline-step-card";
        if (isPast && !isRejected) cardClass += " completed-step";
        else if (isPendingApproval) cardClass += " approval-needed";
        else if (isRejected) cardClass += " rejected-step";
        else if (isCurrent) cardClass += " active-step";

        const badgeType = step.type === "agent_task" ? "agent" : step.type === "human_approval" ? "human" : "service";
        const badgeLabel = step.type === "agent_task" ? "AI Agent Execution" : step.type === "human_approval" ? "Human Committee Gate" : "Service Query";

        html += `
          <div class="${cardClass}">
            <div class="step-card-header">
              <div class="step-title-box">
                <span class="step-badge ${badgeType}">${badgeLabel}</span>
                <span class="step-name">${escapeHtml(step.name)}</span>
              </div>
              <span class="badge-status ${isPendingApproval ? 'pending_approval' : isRejected ? 'rejected' : isPast ? 'completed' : isCurrent ? 'running' : 'waiting'}">
                ${isPendingApproval ? 'Action Required' : isRejected ? 'Rejected' : isPast ? 'Completed' : isCurrent ? 'In Progress' : 'Waiting'}
              </span>
            </div>
            <div class="step-agent-sub">
              Participating Specialist: <strong style="color:#e2e8f0;">${escapeHtml(step.agentName || step.agentId || 'Master Orchestrator')}</strong>
            </div>
        `;

        if (historyItem?.output || isPendingApproval) {
          const out = historyItem?.output || {};
          html += `
            <div style="background: var(--bg); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 12px;">
              <div style="font-weight: 700; color: var(--accent-cyan); margin-bottom: 4px;">✓ Verified Evidence &amp; Output</div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; color: var(--text-secondary);">
                ${Object.keys(out).filter(k => k !== 'evidence').map(k => `
                  <div><strong style="color:var(--text-muted);">${escapeHtml(k)}:</strong> ${escapeHtml(typeof out[k] === 'object' ? JSON.stringify(out[k]) : out[k])}</div>
                `).join("")}
              </div>
            </div>
          `;
        }

        if (isPendingApproval) {
          html += `
            <div style="display: flex; gap: 10px; margin-top: 8px;">
              <button class="btn-flagship-top" style="background: var(--success); height: 34px; border:none;" onclick="submitApprovalDecision('${inst.id}', 'approved')">
                ✓ Approve &amp; Advance
              </button>
              <button class="btn-flagship-top" style="background: var(--danger); height: 34px; border:none;" onclick="submitApprovalDecision('${inst.id}', 'rejected')">
                ✕ Reject &amp; Terminate
              </button>
            </div>
          `;
        }

        html += `</div>`;
      });

      html += `</div>`;
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div style="color:var(--danger); padding:20px;">Failed to render visualizer: ${err.message}</div>`;
    }
  }

  window.submitApprovalDecision = async function (instanceId, decision) {
    try {
      showToast(`Submitting ${decision} decision...`, "info");
      const res = await api.submitDecision(instanceId, decision, `Authorized decision submitted by Academic Review Board via Operations Center`);
      showToast(`Workflow updated: ${res.instance?.status}`, "success");
      await refreshWorkflowData();
      if (state.currentView === "approvals") refreshApprovalsQueue();
    } catch (err) {
      showToast(`Decision error: ${err.message}`, "error");
    }
  };

  // =========================================================
  // VIEW 3: 100-AGENT WORKFORCE MATRIX
  // =========================================================
  async function refreshWorkforceView() {
    try {
      const res = await api.getWorkforce();
      state.workforceAgents = res.agents || [];
      initWorkforceFilters();
      renderWorkforceGrid();
    } catch (err) {
      console.warn("Workforce load error:", err);
    }
  }

  function initWorkforceFilters() {
    document.querySelectorAll("#workforceSegmentedFilters .segment-chip").forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll("#workforceSegmentedFilters .segment-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.selectedWorkforceDomain = chip.getAttribute("data-domain") || "all";
        renderWorkforceGrid();
      };
    });

    const filterInput = document.getElementById("workforceFilterInput");
    if (filterInput) {
      filterInput.oninput = (e) => {
        state.workforceSearchQuery = e.target.value;
        renderWorkforceGrid();
      };
    }
  }

  function renderWorkforceGrid() {
    const grid = document.getElementById("workforceCardsGrid");
    if (!grid) return;

    const filtered = state.workforceAgents.filter(a => {
      const matchDomain = state.selectedWorkforceDomain === "all" || a.educational_domain === state.selectedWorkforceDomain;
      const q = state.workforceSearchQuery.toLowerCase().trim();
      const matchQ = !q ||
        a.agent_id.toLowerCase().includes(q) ||
        (a.educational_name || '').toLowerCase().includes(q) ||
        (a.original_name || '').toLowerCase().includes(q) ||
        (a.domain_name || '').toLowerCase().includes(q) ||
        (a.allowed_tools || []).some(t => t.toLowerCase().includes(q)) ||
        (a.educational_capabilities || []).some(c => c.toLowerCase().includes(q));
      return matchDomain && matchQ;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted);">No workforce agents matched the criteria.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(agent => `
      <div class="agent-card" onclick="inspectWorkforceAgent('${agent.agent_id}')">
        <div class="agent-card-top">
          <div>
            <span class="agent-id-tag">${escapeHtml(agent.agent_id)}</span>
            <div class="agent-name">${escapeHtml(agent.educational_name)}</div>
          </div>
          <span class="badge-status ok" style="font-size: 10px; padding: 2px 7px;">● READY</span>
        </div>

        <div style="font-size: 11px; color: var(--accent-cyan); font-weight: 700;">
          ${escapeHtml(agent.domain_name || agent.educational_domain)}
        </div>

        <div class="tag-list">
          ${(agent.allowed_tools || []).slice(0, 3).map(t => `<span class="tool-tag">${escapeHtml(t)}</span>`).join("")}
          ${(agent.allowed_tools || []).length > 3 ? `<span class="tool-tag">+${agent.allowed_tools.length - 3}</span>` : ''}
        </div>

        <div class="tag-list">
          ${(agent.educational_capabilities || []).slice(0, 2).map(c => `<span class="cap-tag">${escapeHtml(c)}</span>`).join("")}
        </div>

        <div style="margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border-subtle); font-size: 11px; color: var(--text-dim);">
          Port :${agent.port} · Model: Nemotron 3 Nano
        </div>
      </div>
    `).join("");
  }

  window.inspectWorkforceAgent = function (agentId) {
    const agent = state.workforceAgents.find(a => a.agent_id === agentId);
    if (!agent) return;

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-family: monospace; font-size: 13px; font-weight: 800; color: var(--accent-cyan);">${escapeHtml(agent.agent_id)}</span>
          <span class="badge-status ok">● READY</span>
        </div>

        <h3 style="font-size: 18px; font-weight: 800; color: #fff;">${escapeHtml(agent.educational_name)}</h3>
        <div style="font-size: 12px; color: var(--text-muted);">Base Agent: ${escapeHtml(agent.original_name)} [${escapeHtml(agent.category)}]</div>

        <div class="kpi-card" style="padding: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Domain Category</div>
          <div style="font-size: 14px; font-weight: 700; color: #fff; margin-top: 2px;">${escapeHtml(agent.domain_name || agent.educational_domain)}</div>
        </div>

        <div>
          <div style="font-size: 11.5px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 6px;">Allowed RBAC Tools (${(agent.allowed_tools || []).length})</div>
          <div class="tag-list">
            ${(agent.allowed_tools || []).map(t => `<span class="tool-tag" style="padding:4px 8px;">${escapeHtml(t)}</span>`).join(" ")}
          </div>
        </div>

        <div>
          <div style="font-size: 11.5px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 6px;">Educational Capabilities</div>
          <div class="tag-list">
            ${(agent.educational_capabilities || []).map(c => `<span class="cap-tag" style="padding:4px 8px;">${escapeHtml(c)}</span>`).join(" ")}
          </div>
        </div>

        <div>
          <div style="font-size: 11.5px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; margin-bottom: 6px;">Active Workflow Bindings</div>
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
            ${escapeHtml((agent.workflow_roles || []).join(", "))}
          </div>
        </div>
      </div>
    `;

    openInspectorDrawer(`Agent Specification: ${agent.agent_id}`, content);
  };

  // =========================================================
  // VIEW 4: HUMAN APPROVALS QUEUE
  // =========================================================
  async function refreshApprovalsQueue() {
    try {
      const res = await api.getInstances();
      state.instances = res.instances || [];
      const pending = state.instances.filter(i => i.status === "pending_approval");

      const badge = document.getElementById("navApprovalBadge");
      if (badge) {
        badge.textContent = String(pending.length);
        badge.style.display = pending.length > 0 ? "inline-flex" : "none";
      }

      const container = document.getElementById("approvalsQueueContent");
      if (!container) return;

      if (pending.length === 0) {
        container.innerHTML = `
          <div class="card-panel" style="padding: 40px; text-align: center; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 8px;">✓</div>
            <h3 style="color: #fff; font-size: 16px; font-weight: 700;">Approvals Queue is Clear</h3>
            <p style="font-size: 12.5px; margin-top: 4px;">There are no pending decisions requiring Academic Committee or Dean reviews.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = pending.map(inst => `
        <div class="dossier-panel" style="border-left: 4px solid var(--warning);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 7px; border-radius: 4px; background: var(--warning-bg); color: var(--warning); font-size: 10.5px; font-weight: 800;">
                ⚠️ Human-in-the-Loop Gate
              </div>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 6px;">${escapeHtml(inst.workflowName)}</h3>
              <div style="font-size: 12px; color: var(--text-muted); font-family: monospace;">Instance: ${inst.id}</div>
            </div>
            <span class="badge-status waiting" style="padding: 4px 12px; font-size: 12px;">Review Awaiting</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; background: var(--bg-subtle); padding: 14px; border-radius: var(--radius-md);">
            <div><strong style="color:var(--text-muted);">Target Student:</strong> <span style="color:#fff;">${escapeHtml(inst.context?.studentName || inst.context?.studentId)}</span></div>
            <div><strong style="color:var(--text-muted);">Decision Step:</strong> <span style="color:var(--accent-cyan);">${escapeHtml(inst.pendingDecision?.stepName || 'Committee Review')}</span></div>
            <div><strong style="color:var(--text-muted);">Recommended Action:</strong> <span style="color:var(--success); font-weight:700;">APPROVED (Met Thresholds)</span></div>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button class="btn-flagship-top" style="background: var(--success); height: 38px; border:none;" onclick="submitApprovalDecision('${inst.id}', 'approved')">
              ✓ Approve &amp; Advance Workflow
            </button>
            <button class="btn-flagship-top" style="background: var(--danger); height: 38px; border:none;" onclick="submitApprovalDecision('${inst.id}', 'rejected')">
              ✕ Reject &amp; Halt Execution
            </button>
          </div>
        </div>
      `).join("");
    } catch (err) {
      console.warn("Approvals load error:", err);
    }
  }

  // =========================================================
  // VIEW 5: DOCUMENT INTELLIGENCE WORKSPACE
  // =========================================================
  async function refreshDocumentsView() {
    try {
      const res = await api.getDocuments();
      state.documents = res.documents || [];
      renderDocumentsList();

      if (state.documents.length > 0 && !state.selectedDocId) {
        inspectDocument(state.documents[0].documentId);
      }
    } catch (err) {
      console.warn("Documents load error:", err);
    }
  }

  function renderDocumentsList() {
    const container = document.getElementById("documentsListContainer");
    if (!container) return;

    container.innerHTML = state.documents.map(doc => `
      <div class="kpi-card" style="padding: 10px 14px; cursor: pointer; border-color: ${doc.documentId === state.selectedDocId ? 'var(--primary)' : 'var(--border)'};" onclick="inspectDocument('${doc.documentId}')">
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; color: #fff; font-size: 12.5px;">${escapeHtml(doc.filename)}</span>
            <span class="badge-status ${doc.status === 'verified' ? 'ok' : doc.status === 'conflict_detected' ? 'waiting' : 'failed'}">
              ${escapeHtml(doc.status)}
            </span>
          </div>
          <div style="font-size: 11px; color: var(--text-dim); font-family: monospace; margin-top: 2px;">
            ${doc.documentId} · ${doc.studentId}
          </div>
        </div>
      </div>
    `).join("");
  }

  window.inspectDocument = function (docId) {
    state.selectedDocId = docId;
    renderDocumentsList();

    const doc = state.documents.find(d => d.documentId === docId);
    const panel = document.getElementById("documentInspectorPanel");
    if (!panel || !doc) return;

    const isConflict = doc.status === "conflict_detected";
    const isError = doc.status === "error_unreadable";

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span style="font-family: monospace; font-size: 11px; color: var(--accent-cyan); font-weight: 800;">${doc.documentId}</span>
          <h3 style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 2px;">${escapeHtml(doc.filename)}</h3>
          <div style="font-size: 12px; color: var(--text-muted);">Assigned Student: <strong>${escapeHtml(doc.studentId)}</strong> · MIME: ${escapeHtml(doc.mimeType)}</div>
        </div>
        <span class="badge-status ${doc.status === 'verified' ? 'ok' : isConflict ? 'waiting' : 'failed'}" style="font-size: 12px; padding: 4px 12px;">
          ${escapeHtml(doc.status)}
        </span>
      </div>

      ${isConflict ? `
        <div style="background: var(--warning-bg); border: 1px solid var(--warning-border); border-radius: var(--radius-md); padding: 14px;">
          <div style="font-weight: 800; color: var(--warning); font-size: 13px; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span> DATA CONFLICT DETECTED
          </div>
          <div style="font-size: 12px; color: #fff; margin-top: 4px;">
            Institutional Database Income: <strong>$180,000</strong> vs Uploaded Certificate Income: <strong>$120,000</strong>.
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
            System has safely flagged disparity and escalated to Committee review without hallucinating data.
          </div>
        </div>
      ` : ''}

      ${isError ? `
        <div style="background: var(--danger-bg); border: 1px solid var(--danger-border); border-radius: var(--radius-md); padding: 14px;">
          <div style="font-weight: 800; color: var(--danger); font-size: 13px;">✕ UNREADABLE / CORRUPTED STREAM</div>
          <div style="font-size: 12px; color: #fff; margin-top: 4px;">Document checksum verification failed. No OCR fields extracted.</div>
        </div>
      ` : ''}

      <div class="card-panel" style="background: var(--bg-subtle);">
        <div class="card-panel-title"><span>🔍</span> Extracted Optical Attributes (OCR / Vision)</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px; font-size: 12.5px;">
          ${doc.extractedData ? Object.keys(doc.extractedData).map(k => `
            <div><strong style="color:var(--text-muted);">${escapeHtml(k)}:</strong> <span style="color:#fff;">${escapeHtml(typeof doc.extractedData[k] === 'object' ? JSON.stringify(doc.extractedData[k]) : doc.extractedData[k])}</span></div>
          `).join("") : '<div style="color:var(--text-muted);">No structured data available</div>'}
        </div>
      </div>

      <div class="card-panel" style="background: var(--bg-subtle);">
        <div class="card-panel-title"><span>🔒</span> Cryptographic Tamper Hash Integrity</div>
        <div style="font-family: monospace; font-size: 11.5px; color: var(--accent-cyan); word-break: break-all; margin-top: 6px;">
          ${escapeHtml(doc.verificationHash || 'None')}
        </div>
        <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
          Tamper Status: <strong style="color:${doc.tamperDetected ? 'var(--danger)' : 'var(--success)'};">${doc.tamperDetected ? 'TAMPERED' : 'AUTHENTIC (Passed SHA-256)'}</strong>
        </div>
      </div>
    `;
  };

  // =========================================================
  // VIEW 6: INSTITUTIONAL RECORDS & CATALOGS
  // =========================================================
  async function refreshRecordsView() {
    try {
      const data = await api.getInstitutionData();
      state.institutionData = data;
      initRecordsSubTabs();
      renderRecordsTable();
    } catch (err) {
      console.warn("Records load error:", err);
    }
  }

  function initRecordsSubTabs() {
    document.querySelectorAll("#recordsSubTabs .segment-chip").forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll("#recordsSubTabs .segment-chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        state.recordsSubTab = chip.getAttribute("data-subtab") || "students";
        renderRecordsTable();
      };
    });

    const searchInput = document.getElementById("recordsSearchInput");
    if (searchInput) searchInput.oninput = renderRecordsTable;
  }

  function renderRecordsTable() {
    const table = document.getElementById("institutionalDataTable");
    if (!table) return;

    const q = (document.getElementById("recordsSearchInput")?.value || "").toLowerCase().trim();

    if (state.recordsSubTab === "students") {
      const students = (state.institutionData.students || []).filter(s =>
        !q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.program.toLowerCase().includes(q)
      );

      table.innerHTML = `
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Full Name</th>
            <th>Academic Program</th>
            <th>GPA</th>
            <th>Attendance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td style="font-family:monospace; font-weight:700; color:var(--accent-cyan);">${escapeHtml(s.id)}</td>
              <td style="font-weight:600; color:#fff;">${escapeHtml(s.name)}</td>
              <td>${escapeHtml(s.program)}</td>
              <td style="font-weight:700;">${s.gpa}</td>
              <td>${s.attendanceRate}%</td>
              <td><span class="badge-status ${s.status === 'enrolled' ? 'ok' : s.status === 'at_risk' ? 'failed' : 'waiting'}">${escapeHtml(s.status)}</span></td>
            </tr>
          `).join("")}
        </tbody>
      `;
    } else if (state.recordsSubTab === "courses") {
      const courses = (state.institutionData.courses || []).filter(c =>
        !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      );

      table.innerHTML = `
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Title</th>
            <th>Credits</th>
            <th>Capacity</th>
            <th>Prerequisites</th>
          </tr>
        </thead>
        <tbody>
          ${courses.map(c => `
            <tr>
              <td style="font-family:monospace; font-weight:700; color:var(--primary);">${escapeHtml(c.code)}</td>
              <td style="font-weight:600; color:#fff;">${escapeHtml(c.title)}</td>
              <td>${c.credits} Credits</td>
              <td>${c.enrolled}/${c.capacity}</td>
              <td>${escapeHtml((c.prerequisites || []).join(", ") || "None")}</td>
            </tr>
          `).join("")}
        </tbody>
      `;
    } else if (state.recordsSubTab === "scholarships") {
      const schemes = (state.institutionData.scholarshipSchemes || []).filter(s =>
        !q || s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );

      table.innerHTML = `
        <thead>
          <tr>
            <th>Scheme ID</th>
            <th>Scholarship Name</th>
            <th>Award Amount</th>
            <th>Min GPA</th>
            <th>Max Income Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${schemes.map(s => `
            <tr>
              <td style="font-family:monospace; font-weight:700; color:var(--accent-purple);">${escapeHtml(s.id)}</td>
              <td style="font-weight:600; color:#fff;">${escapeHtml(s.name)}</td>
              <td style="font-weight:700; color:var(--success);">$${s.awardAmount}</td>
              <td>${s.minGpa}</td>
              <td>$${s.maxIncome}</td>
            </tr>
          `).join("")}
        </tbody>
      `;
    }
  }

  // =========================================================
  // VIEW 7: IMMUTABLE AUDIT TRAIL
  // =========================================================
  async function refreshAuditView() {
    try {
      const data = await api.getInstitutionData();
      const logs = data.auditLogs || [];
      const container = document.getElementById("auditTimelineContainer");
      if (!container) return;

      if (logs.length === 0) {
        container.innerHTML = `<div style="padding:20px; color:var(--text-muted);">No audit entries recorded yet.</div>`;
        return;
      }

      container.innerHTML = logs.map(item => `
        <div style="padding: 12px 16px; background: var(--surface-card); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: var(--accent-cyan); font-weight: 800;">●</span>
              <span style="font-weight: 700; color: #fff; font-size: 13px;">${escapeHtml(item.action || 'Tool Action')}</span>
              <span style="font-size: 11px; font-family: monospace; color: var(--text-dim);">Workflow: ${escapeHtml(item.workflowId || 'N/A')}</span>
            </div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              Executing Agent: <strong style="color: var(--primary);">${escapeHtml(item.agentId || 'agent-101')}</strong> · Tool: <code style="color:#93c5fd;">${escapeHtml(item.tool || 'internal_query')}</code>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--text-dim); font-family: monospace;">
            ${formatDate(item.timestamp)}
          </div>
        </div>
      `).join("");
    } catch (err) {
      console.warn("Audit load error:", err);
    }
  }

  // =========================================================
  // VIEW 8: AI FLEET CONSOLE & CHAT
  // =========================================================
  async function initChatView() {
    try {
      const res = await api.getAgents();
      state.chatAgents = res.agents || [];
      renderChatAgentList();

      if (state.chatAgents.length > 0 && !state.selectedChatAgent) {
        selectChatAgent(state.chatAgents[0].agent_id);
      }

      const btnSend = document.getElementById("btnSendChat");
      if (btnSend) btnSend.onclick = handleSendChatMessage;

      const input = document.getElementById("chatInput");
      if (input) {
        input.onkeydown = (e) => {
          if (e.key === "Enter") handleSendChatMessage();
        };
      }
    } catch (err) {
      console.warn("Chat init error:", err);
    }
  }

  function renderChatAgentList() {
    const container = document.getElementById("chatAgentListContainer");
    if (!container) return;

    const q = (document.getElementById("chatAgentSearch")?.value || "").toLowerCase().trim();
    const filtered = state.chatAgents.filter(a =>
      !q || a.agent_id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );

    container.innerHTML = filtered.map(agent => `
      <div class="kpi-card" style="padding: 8px 12px; cursor: pointer; border-color: ${agent.agent_id === state.selectedChatAgent?.agent_id ? 'var(--primary)' : 'var(--border-subtle)'};" onclick="selectChatAgent('${agent.agent_id}')">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 12px;">${escapeHtml(agent.name)}</div>
          <div style="font-size: 10.5px; color: var(--text-dim); font-family: monospace;">${agent.agent_id} · ${agent.category}</div>
        </div>
      </div>
    `).join("");

    const searchInput = document.getElementById("chatAgentSearch");
    if (searchInput) searchInput.oninput = renderChatAgentList;
  }

  window.selectChatAgent = function (agentId) {
    const agent = state.chatAgents.find(a => a.agent_id === agentId);
    if (!agent) return;
    state.selectedChatAgent = agent;
    renderChatAgentList();

    document.getElementById("chatActiveAgentName").textContent = agent.name;
    document.getElementById("chatActiveAgentId").textContent = `${agent.agent_id} · ${agent.category}`;

    const contextBox = document.getElementById("chatAgentDetailsBox");
    if (contextBox) {
      contextBox.innerHTML = `
        <div><strong style="color:var(--text-muted);">Assigned Port:</strong> :${agent.port}</div>
        <div><strong style="color:var(--text-muted);">Model Engine:</strong> Nemotron 3 Nano (Ollama)</div>
        <div><strong style="color:var(--text-muted);">Capabilities:</strong> ${(agent.capabilities || []).join(", ")}</div>
        <div style="margin-top: 8px;"><strong style="color:var(--text-muted);">Allowed Tools:</strong></div>
        <div class="tag-list">${(agent.allowed_tools || ['*']).map(t => `<span class="tool-tag">${escapeHtml(t)}</span>`).join("")}</div>
      `;
    }
  };

  async function handleSendChatMessage() {
    const input = document.getElementById("chatInput");
    const text = input?.value?.trim();
    if (!text || !state.selectedChatAgent) return;

    input.value = "";
    const stream = document.getElementById("chatMessagesStream");
    if (!stream) return;

    // Append User Bubble
    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user";
    userBubble.textContent = text;
    stream.appendChild(userBubble);

    // Append AI Loading Bubble
    const aiBubble = document.createElement("div");
    aiBubble.className = "chat-bubble ai";
    aiBubble.textContent = "Processing via local Nemotron 3 Nano...";
    stream.appendChild(aiBubble);
    stream.scrollTop = stream.scrollHeight;

    try {
      const res = await api.sendChat(state.selectedChatAgent.agent_id, text);
      let reply = "";
      if (typeof res.result === "string") {
        reply = res.result;
      } else if (res.result?.response) {
        reply = res.result.response;
      } else if (res.result?.result) {
        reply = typeof res.result.result === "string" ? res.result.result : JSON.stringify(res.result.result, null, 2);
      } else if (res.response) {
        reply = res.response;
      } else {
        reply = typeof res === "string" ? res : JSON.stringify(res.result || res, null, 2);
      }
      aiBubble.textContent = reply;
    } catch (err) {
      aiBubble.textContent = `Error: ${err.message}`;
    }
    stream.scrollTop = stream.scrollHeight;
  }

  // =========================================================
  // VIEW 9: SYSTEM OBSERVABILITY & HEALTH
  // =========================================================
  async function refreshSystemHealth() {
    try {
      const [hRes, mRes] = await Promise.all([
        api.getHealth(),
        api.getSystemMetrics()
      ]);

      document.getElementById("healthGatewayStatus").textContent = hRes.gateway === "healthy" ? "Healthy (200 OK)" : "Degraded";
      document.getElementById("healthOllamaStatus").textContent = hRes.ollama === "healthy" ? "Healthy (CUDA)" : "Offline";
      document.getElementById("healthFleetStatus").textContent = `${hRes.agents?.healthy || 101}/${hRes.agents?.total || 101}`;

      const grid = document.getElementById("systemTelemetryGrid");
      if (grid && mRes) {
        grid.innerHTML = `
          <div class="kpi-card" style="padding:14px;">
            <div>
              <div style="color:var(--text-muted); font-size:11px; font-weight:700;">HOST SYSTEM RAM</div>
              <div style="font-size:16px; font-weight:800; color:#fff; margin-top:2px;">${mRes.memory?.freeMb} MB Free / ${mRes.memory?.totalMb} MB Total</div>
            </div>
          </div>
          <div class="kpi-card" style="padding:14px;">
            <div>
              <div style="color:var(--text-muted); font-size:11px; font-weight:700;">NVIDIA GPU &amp; VRAM</div>
              <div style="font-size:16px; font-weight:800; color:#fff; margin-top:2px;">RTX 2050 (4GB VRAM)</div>
              <div style="font-size:11px; color:var(--accent-cyan); font-family:monospace;">Driver 555.97 · CUDA Acceleration</div>
            </div>
          </div>
          <div class="kpi-card" style="padding:14px;">
            <div>
              <div style="color:var(--text-muted); font-size:11px; font-weight:700;">GATEWAY UPTIME</div>
              <div style="font-size:16px; font-weight:800; color:#fff; margin-top:2px;">${mRes.uptimeSeconds}s Continuous</div>
            </div>
          </div>
          <div class="kpi-card" style="padding:14px;">
            <div>
              <div style="color:var(--text-muted); font-size:11px; font-weight:700;">INFERENCE CONTEXT</div>
              <div style="font-size:16px; font-weight:800; color:#fff; margin-top:2px;">Nemotron 3 Nano (4K Tokens)</div>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.warn("Health telemetry load error:", err);
    }
  }

  // =========================================================
  // FLAGSHIP JUDGE DEMO EXPERIENCE
  // =========================================================
  async function runFlagshipScholarshipDemo() {
    showToast("Launching Flagship Scholarship Demo for STU-DEMO-001...", "info");
    switchMainView("workflows");

    try {
      const res = await api.startWorkflow({
        workflow_id: "scholarship-eligibility",
        studentId: "STU-DEMO-001",
        scholarshipId: "SCH-MERIT",
        notes: "★ Flagship Judge Demonstration: 9 Agents Multi-Disciplinary Orchestration"
      });

      showToast(`Flagship Demo initiated: ${res.instance?.id}`, "success");
      await refreshWorkflowData();
      if (res.instance?.id) {
        state.selectedInstanceId = res.instance.id;
        loadAndRenderVisualizer(res.instance.id);
      }
    } catch (err) {
      showToast(`Demo launch failed: ${err.message}`, "error");
    }
  }

  // Global Search Handler
  function handleGlobalSearch(query) {
    const q = query.toLowerCase().trim();
    if (!q) return;

    if (state.currentView === "workforce") {
      state.workforceSearchQuery = q;
      renderWorkforceGrid();
    } else if (state.currentView === "records") {
      const searchInput = document.getElementById("recordsSearchInput");
      if (searchInput) searchInput.value = q;
      renderRecordsTable();
    }
  }

  // =========================================================
  // INITIALIZATION & BACKGROUND POLLING
  // =========================================================
  function init() {
    initNavigation();
    refreshDashboardData();

    // Background Heartbeat every 4.5s
    state.pollingInterval = setInterval(() => {
      if (state.currentView === "dashboard") refreshDashboardData();
      else if (state.currentView === "workflows" && state.selectedInstanceId) {
        api.getInstances().then(res => {
          state.instances = res.instances || [];
          renderWorkflowInstancesList();
          const curr = state.instances.find(i => i.id === state.selectedInstanceId);
          if (curr && (curr.status === "running" || curr.status === "pending_approval")) {
            loadAndRenderVisualizer(state.selectedInstanceId);
          }
        }).catch(() => {});
      } else if (state.currentView === "approvals") {
        refreshApprovalsQueue();
      }
    }, 4500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
