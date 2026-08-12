const API_BASE = window.CONTROL_PLANE_URL || "http://127.0.0.1:8200";

const state = {
  agents: [],
  selected: null
};

const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function renderStats(summary) {
  const items = [
    ["Total", summary.total_agents],
    ["Registered", summary.registered_agents],
    ["Ready", summary.ready_agents],
    ["Released", summary.released_agents],
    ["Planned", summary.planned_agents]
  ];
  $("stats").innerHTML = items.map(([label, value]) =>
    `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`
  ).join("");
}

function renderAgents() {
  const query = $("search").value.trim().toLowerCase();
  const filtered = state.agents.filter((agent) =>
    !query || `${agent.agent_id} ${agent.name} ${agent.day} ${agent.status}`.toLowerCase().includes(query)
  );

  if (!filtered.length) {
    $("agents").innerHTML = `<div class="empty">No agents match your search.</div>`;
    return;
  }

  $("agents").innerHTML = filtered.map((agent) => `
    <button class="agent-card" data-agent="${agent.agent_id}">
      <div class="agent-number">${String(agent.day).padStart(3, "0")}</div>
      <div class="agent-main">
        <strong>${escapeHtml(agent.name)}</strong>
        <span>${escapeHtml(agent.agent_id)}</span>
      </div>
      <div class="agent-status status-${escapeHtml(agent.status)}">${escapeHtml(agent.status)}</div>
    </button>
  `).join("");

  document.querySelectorAll("[data-agent]").forEach((button) => {
    button.addEventListener("click", () => selectAgent(button.dataset.agent));
  });
}

async function loadAgents() {
  $("control-status").textContent = "Loading…";
  try {
    const data = await api("/api/agents");
    state.agents = data.agents;
    renderStats(data);
    renderAgents();
    $("control-status").textContent = "Control plane online";
    $("control-status").className = "status-pill online";
  } catch (error) {
    $("control-status").textContent = `Control plane unavailable`;
    $("control-status").className = "status-pill offline";
    $("agents").innerHTML = `<div class="empty error">${escapeHtml(error.message)}</div>`;
  }
}

async function selectAgent(agentId) {
  const agent = state.agents.find((item) => item.agent_id === agentId);
  if (!agent) return;
  state.selected = agent;

  $("workspace").classList.remove("hidden");
  $("workspace-day").textContent = `DAY ${String(agent.day).padStart(3, "0")}`;
  $("workspace-name").textContent = agent.name;
  $("workspace-id").textContent = agent.agent_id;
  $("result").textContent = "Result will appear here.";
  $("workspace-health").textContent = "Checking health…";

  try {
    const health = await api(`/api/agents/${encodeURIComponent(agentId)}/health`);
    $("workspace-health").innerHTML = `<strong>${escapeHtml(health.status.toUpperCase())}</strong><span>${escapeHtml(health.reason || health.model || "Health check complete")}</span>`;
    $("workspace-health").className = `health-box ${health.status}`;
  } catch (error) {
    $("workspace-health").textContent = error.message;
    $("workspace-health").className = "health-box offline";
  }

  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

$("run-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selected) return;

  const task = $("task").value.trim();
  if (!task) {
    $("result").textContent = "Enter a task first.";
    return;
  }

  $("result").textContent = "Processing…";

  try {
    const data = await api(`/api/agents/${encodeURIComponent(state.selected.agent_id)}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task,
        context: {},
        parameters: { tone: $("tone").value },
        output_format: $("output-format").value
      })
    });
    $("result").textContent = typeof data.result === "string"
      ? data.result
      : JSON.stringify(data, null, 2);
  } catch (error) {
    $("result").textContent = `Request failed: ${error.message}`;
  }
});

$("search").addEventListener("input", renderAgents);
$("refresh").addEventListener("click", loadAgents);
$("close-workspace").addEventListener("click", () => $("workspace").classList.add("hidden"));

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

loadAgents();
