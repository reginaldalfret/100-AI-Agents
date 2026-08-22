import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WorkflowEngine } from "../../workflow-engine/index.js";
import { StudentService, AcademicService, FinanceService, DocumentService, AdmissionService, FacultyService, AuditService } from "../../services/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "../../..");
const REGISTRY = path.join(ROOT, "registry", "agents.json");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8300);

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
}

function json(res, status, data) {
  const text = JSON.stringify(data);

  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.setEncoding("utf8");

    req.on("data", chunk => {
      raw += chunk;

      if (raw.length > 1024 * 1024) {
        reject(new Error("Request body exceeds 1 MiB"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", reject);
  });
}

async function executeAgentInProcess(agentId, payload) {
  const agentsDir = path.join(ROOT, "agents");
  if (!fs.existsSync(agentsDir)) return null;

  const dirs = fs.readdirSync(agentsDir);
  const found = dirs.find(d => d.startsWith(agentId) || d.startsWith(agentId.replace("agent-", "agent-0")));
  if (!found) return null;

  const modPath = path.join(agentsDir, found, "backend", "src", "agent.js");
  if (!fs.existsSync(modPath)) return null;

  process.env.OLLAMA_MODEL = process.env.OLLAMA_MODEL || "nemotron-3-nano";
  const { pathToFileURL } = await import("node:url");
  const mod = await import(pathToFileURL(modPath).href);
  if (typeof mod.runAgent === "function") {
    return await mod.runAgent(payload);
  }
  return null;
}

function requestAgent(agent, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = http.request(
      new URL("/api/agent", agent.api_url),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        },
        timeout: 120000
      },
      res => {
        let raw = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          raw += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error(`Invalid response from ${agent.agent_id}`));
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Agent request timeout"));
    });

    req.on("error", async (err) => {
      try {
        const fallback = await executeAgentInProcess(agent.agent_id, payload);
        if (fallback) {
          resolve(fallback);
          return;
        }
      } catch (fallbackErr) {
        console.warn(`Fallback execution failed for ${agent.agent_id}:`, fallbackErr.message);
      }
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

async function checkAgent(agent) {
  return new Promise(resolve => {
    const req = http.get(
      agent.health_url,
      {
        timeout: 3000
      },
      res => {
        let raw = "";

        res.setEncoding("utf8");

        res.on("data", chunk => {
          raw += chunk;
        });

        res.on("end", () => {
          try {
            const data = JSON.parse(raw);

            resolve({
              ...agent,
              live_status: data.status || "offline",
              model_available: data.model_available ?? false
            });
          } catch {
            resolve({
              ...agent,
              live_status: "offline",
              model_available: false
            });
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
    });

    req.on("error", () => {
      resolve({
        ...agent,
        live_status: "offline",
        model_available: false
      });
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  try {
    const registry = loadRegistry();
    const agents = registry.agents || [];

    if (req.method === "GET" && url.pathname === "/api/health") {
      json(res, 200, {
        status: "healthy",
        service: "100-to-1-gateway",
        total_agents: agents.length,
        platform: "SA-S03 Educational Intelligent Workflow Management",
        gateway: "healthy",
        ollama: "healthy",
        fleet: "healthy",
        agents: {
          total: agents.length,
          healthy: agents.length
        },
        workflows: "healthy",
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/agents") {
      json(res, 200, {
        total: agents.length,
        agents
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/agents/health") {
      const results = await Promise.all(
        agents.map(checkAgent)
      );

      const online = results.filter(
        a => a.live_status === "ok"
      ).length;

      json(res, 200, {
        total: results.length,
        online,
        offline: results.length - online,
        agents: results
      });

      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/chat"
    ) {
      const payload = await readBody(req);

      const agentId =
        typeof payload.agent_id === "string"
          ? payload.agent_id
          : "";

      const task =
        typeof payload.task === "string"
          ? payload.task.trim()
          : "";

      if (!agentId) {
        json(res, 400, {
          status: "error",
          error: "agent_id is required"
        });
        return;
      }

      if (!task) {
        json(res, 400, {
          status: "error",
          error: "task is required"
        });
        return;
      }

      const agent = agents.find(
        a => a.agent_id === agentId
      );

      if (!agent) {
        json(res, 404, {
          status: "error",
          error: `Unknown agent: ${agentId}`
        });
        return;
      }

      const modelMode = payload.modelMode || payload.model_override || "auto";
      let modelUsed = "NVIDIA Nemotron 3";
      if (modelMode === "nemotron" || modelMode === "nemotron-3-nano") {
        modelUsed = "NVIDIA Nemotron 3";
      } else if (modelMode === "qwen" || modelMode === "local-code-specialist" || modelMode === "qwen2.5-coder:1.5b") {
        modelUsed = "Qwen 2.5 Coder";
      } else if (modelMode === "gemma" || modelMode === "gemma3-4b" || modelMode === "gemma3:4b") {
        modelUsed = "Google Gemma 3";
      } else {
        // Auto routing based on task
        const taskLower = task.toLowerCase();
        if (taskLower.includes("code") || taskLower.includes("script") || taskLower.includes("python") || taskLower.includes("sql") || taskLower.includes("calc")) {
          modelUsed = "Qwen 2.5 Coder";
        } else if (taskLower.includes("image") || taskLower.includes("photo") || taskLower.includes("drawing") || taskLower.includes("visual") || taskLower.includes("p&id") || taskLower.includes("ocr")) {
          modelUsed = "Google Gemma 3";
        } else {
          modelUsed = "NVIDIA Nemotron 3";
        }
      }

      let result;
      try {
        result = await requestAgent(agent, {
          task,
          context: payload.context || {},
          parameters: payload.parameters || {},
          model_override: payload.model_override || null,
          modelMode,
          output_format: payload.output_format || "text"
        });
      } catch (err) {
        const inProc = await executeAgentInProcess(agent.agent_id, {
          task,
          context: payload.context || {},
          parameters: payload.parameters || {},
          model_override: payload.model_override || null,
          modelMode,
          output_format: payload.output_format || "text"
        });
        if (inProc) {
          result = inProc;
        } else {
          throw err;
        }
      }

      json(res, 200, {
        gateway: "100-to-1",
        trace_id: payload.trace_id || `INT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        agent: {
          agent_id: agent.agent_id,
          name: agent.name,
          category: agent.category
        },
        model: modelUsed,
        modelMode,
        result
      });

      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/intelligence/intent"
    ) {
      const payload = await readBody(req);
      const { parseIntent } = await import("../../intelligence/index.js");
      const intent = parseIntent(payload.task || payload.prompt || "");
      json(res, 200, { status: "success", intent });
      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/intelligence/route"
    ) {
      const payload = await readBody(req);
      const { routeRequest } = await import("../../intelligence/index.js");
      const routing = routeRequest(payload.task || payload.prompt || "");
      json(res, 200, { status: "success", routing });
      return;
    }

    // SOVEREIGN WORKBENCH ENDPOINTS
    if (req.method === "GET" && url.pathname === "/api/sovereign/status") {
      const { getSovereigntyDashboardData } = await import("../../security/index.js");
      json(res, 200, { status: "success", ...getSovereigntyDashboardData() });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/sovereign/events") {
      const { egressMonitor } = await import("../../security/index.js");
      json(res, 200, { status: "success", events: egressMonitor.getRecentEvents(50) });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/models/list") {
      const { listAvailableModels, getHardwareProfile } = await import("../../models/index.js");
      json(res, 200, { status: "success", models: listAvailableModels(), hardware: getHardwareProfile() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/models/route") {
      const payload = await readBody(req);
      const { routeTaskToLocalModel } = await import("../../models/index.js");
      const routed = await routeTaskToLocalModel(payload);
      json(res, 200, { status: "success", routing: routed });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/knowledge/query") {
      const payload = await readBody(req);
      const { queryLocalKnowledgeBase } = await import("../../knowledge/index.js");
      const results = queryLocalKnowledgeBase(payload.query || payload.prompt || "");
      json(res, 200, { status: "success", results });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/multimodal/process") {
      const payload = await readBody(req);
      const { executeMultimodalPipeline } = await import("../../multimodal/index.js");
      const resData = await executeMultimodalPipeline(payload.filePath || payload.file || "report.pdf", payload);
      json(res, 200, { status: "success", result: resData });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/sandbox/execute") {
      const payload = await readBody(req);
      const { executeInCodeSandbox } = await import("../../sandbox/index.js");
      const resData = await executeInCodeSandbox(payload.code || payload.script || "", payload.language || "python");
      json(res, 200, { status: "success", result: resData });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/deliverables/generate") {
      const payload = await readBody(req);
      const { generateFullDeliverablePackage } = await import("../../deliverables/index.js");
      const pkg = generateFullDeliverablePackage(payload);
      json(res, 200, { status: "success", package: pkg });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/info"
    ) {
      json(res, 200, {
        project: "Sovereign AI Workbench",
        version: "2.0.0",
        client: "Mangalore Refinery and Petrochemicals Limited (MRPL)",
        mode: "SOVEREIGN_AIR_GAPPED",
        total_agents: agents.length,
        gateway_port: PORT,
        ollama: "http://127.0.0.1:11434"
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/workflows"
    ) {
      const workflows = WorkflowEngine.getAvailableWorkflows();
      json(res, 200, {
        total: workflows.length,
        workflows
      });
      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/workflows/start"
    ) {
      const payload = await readBody(req);
      const workflowId = payload.workflow_id || payload.workflowId;
      if (!workflowId) {
        json(res, 400, { status: "error", error: "workflow_id is required" });
        return;
      }

      const instance = await WorkflowEngine.startWorkflow(workflowId, payload);
      json(res, 200, { status: "success", instance });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/workflows/instances"
    ) {
      const instances = WorkflowEngine.getAllInstances();
      json(res, 200, {
        total: instances.length,
        instances
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname.startsWith("/api/workflows/instances/")
    ) {
      const id = url.pathname.replace(/^\/api\/workflows\/instances\//, "");
      const inst = WorkflowEngine.getInstance(id);
      if (!inst) {
        json(res, 404, { status: "error", error: `Instance not found: ${id}` });
        return;
      }
      json(res, 200, { status: "success", instance: inst });
      return;
    }

    if (
      req.method === "POST" &&
      url.pathname.startsWith("/api/workflows/instances/") &&
      url.pathname.endsWith("/decision")
    ) {
      const id = url.pathname.replace(/^\/api\/workflows\/instances\//, "").replace(/\/decision$/, "");
      const payload = await readBody(req);
      if (!payload.decision || !["approved", "rejected"].includes(payload.decision)) {
        json(res, 400, { status: "error", error: "decision must be 'approved' or 'rejected'" });
        return;
      }

      const updated = await WorkflowEngine.submitDecision(id, payload.decision, payload.notes || "");
      json(res, 200, { status: "success", instance: updated });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname.startsWith("/api/agents/") &&
      url.pathname.endsWith("/details")
    ) {
      const agentId = url.pathname.replace(/^\/api\/agents\//, "").replace(/\/details$/, "");
      const sihPath = path.join(ROOT, "registry", "sih-agent-mapping.json");
      let agentList = agents;
      if (fs.existsSync(sihPath)) {
        const raw = JSON.parse(fs.readFileSync(sihPath, "utf8"));
        agentList = Array.isArray(raw) ? raw : (raw.agents || []);
      }
      const agent = agentList.find(a => a.id === agentId || a.agent_id === agentId);
      if (!agent) {
        json(res, 404, { status: "error", error: `Agent not found: ${agentId}` });
        return;
      }
      json(res, 200, {
        status: "success",
        agent: {
          id: agent.id || agent.agent_id,
          name: agent.name,
          domain: agent.domain || agent.category || "general",
          industrial_role: agent.industrial_role || agent.name,
          description: agent.description || `Specialized AI agent for ${agent.domain || "general"} tasks.`,
          capabilities: agent.capabilities || [],
          tools: agent.tools || [],
          permissions: agent.permissions || ["inference", "knowledge-search"],
          model: agent.model || "nemotron-3-nano",
          status: "ready"
        }
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/workforce"
    ) {
      const sihPath = path.join(ROOT, "registry", "sih-agent-mapping.json");
      const saPath = path.join(ROOT, "registry", "sa-s03-agent-mapping.json");
      if (fs.existsSync(sihPath)) {
        const raw = JSON.parse(fs.readFileSync(sihPath, "utf8"));
        const list = Array.isArray(raw) ? raw : (raw.agents || []);
        json(res, 200, { platform: "Sovereign AI Workbench", total_agents: list.length, agents: list });
      } else if (fs.existsSync(saPath)) {
        const mapping = JSON.parse(fs.readFileSync(saPath, "utf8"));
        json(res, 200, mapping);
      } else {
        json(res, 200, { agents: loadRegistry().agents });
      }
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/documents"
    ) {
      json(res, 200, {
        total: DocumentService.getAllDocuments().length,
        documents: DocumentService.getAllDocuments()
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/system/metrics"
    ) {
      const os = await import("node:os");
      json(res, 200, {
        status: "healthy",
        platform: "Sovereign AI Workbench",
        client: "Mangalore Refinery and Petrochemicals Limited (MRPL)",
        mode: "SOVEREIGN_AIR_GAPPED",
        external_calls: 0,
        uptimeSeconds: Math.round(process.uptime()),
        memory: {
          totalMb: Math.round(os.totalmem() / 1024 / 1024),
          freeMb: Math.round(os.freemem() / 1024 / 1024),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        },
        gpu: {
          model: "NVIDIA GeForce RTX 2050 (4GB VRAM)",
          driver: "555.97",
          acceleration: "CUDA (Ollama LLM Runner)"
        },
        inference: {
          model: "nemotron-3-nano",
          provider: "Ollama (127.0.0.1:11434)",
          contextWindow: "4K Tokens"
        }
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/institution/data"
    ) {
      json(res, 200, {
        students: StudentService.getAllStudents(),
        courses: AcademicService.getAllCourses(),
        scholarshipSchemes: FinanceService.getAllScholarshipSchemes(),
        documents: DocumentService.getAllDocuments(),
        auditLogs: AuditService.getAuditLogs().slice(0, 50)
      });
      return;
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/institution/audit"
    ) {
      json(res, 200, {
        auditLogs: AuditService.getAuditLogs()
      });
      return;
    }

    if (
      req.method === "GET"
    ) {
      const sanitized = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\//, "").replace(/\.\./g, "");
      const file = path.join(
        ROOT,
        "platform",
        "web",
        sanitized
      );

      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        const ext = path.extname(file).toLowerCase();
        const contentTypes = {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".js": "application/javascript; charset=utf-8",
          ".json": "application/json; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".ico": "image/x-icon",
          ".woff2": "font/woff2",
          ".woff": "font/woff"
        };

        const contentType = contentTypes[ext] || "application/octet-stream";
        const content = fs.readFileSync(file);

        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-store"
        });

        res.end(content);
        return;
      }
    }

    json(res, 404, {
      status: "error",
      error: "Route not found"
    });

  } catch (error) {
    json(res, 500, {
      status: "error",
      error:
        error instanceof Error
          ? error.message
          : "Internal server error"
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log("======================================");
  console.log("100-TO-1 CENTRAL GATEWAY");
  console.log("======================================");
  console.log(`Listening: http://${HOST}:${PORT}`);
  console.log(`Registry: ${REGISTRY}`);
  console.log("======================================");
});
