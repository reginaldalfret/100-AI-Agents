/* Agent UI polish: dynamic logo and agent-specific About / Capabilities / Examples tabs. */
(function () {
  "use strict";

  const API = window.location.origin;
  let agentMap = new Map();
  let currentTab = "chat";

  const escapeHtml = value => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const logo = document.querySelector(".logo");
  if (logo) {
    logo.setAttribute("aria-label", "100 AI Agents");
    logo.innerHTML = `
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="agentLogoGradient" x1="5" y1="5" x2="43" y2="43">
            <stop stop-color="#00eaff"/>
            <stop offset=".55" stop-color="#8b3dff"/>
            <stop offset="1" stop-color="#ff22d7"/>
          </linearGradient>
        </defs>
        <path d="M14 31 23 14l11 20" fill="none" stroke="url(#agentLogoGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="14" cy="31" r="4" fill="#00eaff"/>
        <circle cx="23" cy="14" r="4" fill="#8b3dff"/>
        <circle cx="34" cy="34" r="4" fill="#ff22d7"/>
        <circle cx="24" cy="26" r="3" fill="#ffffff"/>
      </svg>`;
  }

  const main = document.querySelector(".main");
  const messages = document.getElementById("messages");
  const tabs = [...document.querySelectorAll(".tabs .tab")];

  if (!main || !messages || tabs.length < 4) return;

  let panel = document.getElementById("agentTabPanel");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "agent-tab-panel";
    panel.id = "agentTabPanel";
    panel.hidden = true;
    main.appendChild(panel);
  }

  function currentAgent() {
    const meta = document.getElementById("headerMeta")?.textContent || "";
    const id = meta.split("·")[0].trim();
    return agentMap.get(id) || null;
  }

  function exampleFor(agent) {
    const name = agent?.name || "this agent";
    const slug = String(agent?.slug || "").toLowerCase();
    const caps = Array.isArray(agent?.capabilities) ? agent.capabilities : [];
    const text = `${name} ${slug} ${caps.join(" ")}`.toLowerCase();
    const examples = [
      [/email/, "Write a professional email for a real situation I describe."],
      [/quiz|mcq|question/, "Generate 10 multiple-choice questions on a topic I provide, with answers."],
      [/grammar|proofread|language-edit/, "Correct the grammar and improve this text without changing its meaning."],
      [/translation/, "Translate this text while preserving its meaning and tone."],
      [/resume/, "Improve my resume for a specific job description and make it ATS-friendly."],
      [/interview/, "Prepare me for an interview with likely questions and strong sample answers."],
      [/research|fact|source|literature|paper/, "Research this topic and return a clear, well-structured evidence-based answer."],
      [/code|debug|software|docker|devops|database|api|full-stack|test/, "Help me solve this software development task and explain the implementation."],
      [/image|visual/, "Analyze this image and explain the important visual details."],
      [/video/, "Analyze this video and summarize the important events and findings."],
      [/sales|lead|marketing|seo|social/, "Create a practical strategy for this business or marketing objective."],
      [/financial|accounting|invoice/, "Analyze this financial task and provide a structured result."],
      [/travel|restaurant|course|college|company|product|market/, "Help me evaluate this topic and give a focused recommendation or analysis."],
      [/goal|task|project|workflow|planning/, "Help me turn this objective into a clear, actionable plan."]
    ];
    const match = examples.find(([regex]) => regex.test(text));
    return match ? match[1] : `Ask ${name} to perform a task specifically related to its listed capabilities.`;
  }

  function render(agent, tab) {
    const caps = Array.isArray(agent?.capabilities) ? agent.capabilities : [];
    const category = agent?.category || "general";
    const id = agent?.agent_id || "unknown";
    const model = agent?.model || "qwen3.5:9b";
    const capabilityCards = caps.length
      ? caps.map(capability => `<div class="agent-capability-chip">${escapeHtml(capability)}</div>`).join("")
      : `<div class="agent-empty-state">No explicit capabilities are published for this agent.</div>`;

    let body = "";

    if (tab === "about") {
      body = `
        <div class="agent-detail-grid">
          <div class="agent-detail-card"><span>Agent ID</span><strong>${escapeHtml(id)}</strong></div>
          <div class="agent-detail-card"><span>Category</span><strong>${escapeHtml(category)}</strong></div>
          <div class="agent-detail-card"><span>Model</span><strong>${escapeHtml(model)}</strong></div>
          <div class="agent-detail-card"><span>Capabilities</span><strong>${caps.length}</strong></div>
        </div>
        <div class="agent-info-section">
          <h3>About this agent</h3>
          <p>${escapeHtml(agent?.name || "This agent")} is a specialized AI agent in the 100 AI Agents platform. It is intended to handle tasks that match its declared capabilities rather than unrelated requests.</p>
        </div>
        <div class="agent-info-section">
          <h3>Specialization</h3>
          <p>This agent focuses on <strong>${escapeHtml(category)}</strong> work and exposes the capabilities listed in the Capabilities tab.</p>
        </div>`;
    } else if (tab === "capabilities") {
      body = `
        <div class="agent-info-section">
          <h3>Core capabilities</h3>
          <p>These are the declared capabilities of ${escapeHtml(agent?.name || "this agent")}.</p>
          <div class="agent-capability-grid">${capabilityCards}</div>
        </div>`;
    } else {
      body = `
        <div class="agent-info-section">
          <h3>Example prompts</h3>
          <p>Try requests that stay inside this agent's specialization.</p>
          <div class="agent-example-list">
            ${[1, 2, 3].map(number => `
              <button class="agent-example-card" type="button">
                <span>Example ${number}</span>
                <strong>${escapeHtml(exampleFor(agent))}</strong>
              </button>`).join("")}
          </div>
        </div>`;
    }

    panel.innerHTML = `
      <div class="agent-panel-inner">
        <div class="agent-panel-kicker">${escapeHtml(id)} · ${escapeHtml(category)}</div>
        <h2>${escapeHtml(agent?.name || "AI Agent")}</h2>
        ${body}
      </div>`;

    panel.querySelectorAll(".agent-example-card").forEach(button => {
      button.addEventListener("click", () => {
        const input = document.getElementById("input");
        const prompt = button.querySelector("strong")?.textContent || "";
        if (input) {
          input.value = prompt;
          input.focus();
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
        setTab("chat");
      });
    });
  }

  function setTab(tab) {
    currentTab = tab;
    tabs.forEach((tabElement, index) => {
      const key = index === 0 ? "chat" : index === 1 ? "about" : index === 2 ? "capabilities" : "examples";
      tabElement.classList.toggle("active", key === tab);
      tabElement.setAttribute("aria-selected", key === tab ? "true" : "false");
    });

    if (tab === "chat") {
      panel.hidden = true;
      messages.style.display = "";
      return;
    }

    messages.style.display = "none";
    panel.hidden = false;
    render(currentAgent() || agentMap.values().next().value || {}, tab);
    panel.scrollTop = 0;
  }

  async function loadAgentMap() {
    try {
      const response = await fetch(API + "/api/agents", { cache: "no-store" });
      const data = await response.json();
      const list = Array.isArray(data.agents) ? data.agents : [];
      agentMap = new Map(list.map(agent => [agent.agent_id, agent]));
      if (currentTab !== "chat") render(currentAgent() || {}, currentTab);
    } catch (error) {
      console.warn("Unable to load agent details", error);
    }
  }

  tabs.forEach((tab, index) => {
    const key = index === 0 ? "chat" : index === 1 ? "about" : index === 2 ? "capabilities" : "examples";
    tab.setAttribute("role", "tab");
    tab.setAttribute("tabindex", "0");
    tab.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      setTab(key);
    };
    tab.onkeydown = event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setTab(key);
      }
    };
  });

  document.getElementById("agentList")?.addEventListener("click", () => {
    setTimeout(() => {
      if (currentTab !== "chat") render(currentAgent() || {}, currentTab);
    }, 0);
  });

  const headerMeta = document.getElementById("headerMeta");
  if (headerMeta) {
    new MutationObserver(() => {
      if (currentTab !== "chat") render(currentAgent() || {}, currentTab);
    }).observe(headerMeta, { childList: true, subtree: true, characterData: true });
  }

  loadAgentMap();
})();
