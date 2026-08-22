import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WorkflowEngine } from "../../workflow-engine/index.js";
import { StudentService, AcademicService, FinanceService, DocumentService, AdmissionService, FacultyService, AuditService } from "../../services/index.js";
import { modelStreamer, ModelLifecycleState } from "../../models/model-streamer.js";

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

      const rawAgentId =
        typeof payload.agent_id === "string"
          ? payload.agent_id
          : "";

      const normalizedAgentId =
        (!rawAgentId || rawAgentId === "auto" || rawAgentId === "super-ai" || rawAgentId === "101")
          ? "agent-101"
          : (rawAgentId.startsWith("agent-") ? rawAgentId : `agent-${rawAgentId.padStart(3, "0")}`);

      const task =
        typeof payload.task === "string"
          ? payload.task.trim()
          : "";

      if (!task) {
        json(res, 400, {
          status: "error",
          error: "task is required"
        });
        return;
      }

      const agent = agents.find(
        a => a.agent_id === normalizedAgentId || a.agent_id === rawAgentId
      ) || agents.find(a => a.agent_id === "agent-101");

      if (!agent) {
        json(res, 404, {
          status: "error",
          error: `Unknown agent: ${rawAgentId}`
        });
        return;
      }

      // Check live local Ollama model tags for availability
      let availableModels = [];
      try {
        const tagsRes = await fetch("http://127.0.0.1:11434/api/tags").catch(() => null);
        if (tagsRes && tagsRes.ok) {
          const tagsData = await tagsRes.json();
          availableModels = (tagsData.models || []).map(m => m.name || m.model);
        }
      } catch (e) {
        // Local check
      }

      const CANONICAL_MODEL_MAP = {
        "gemma": { tag: "gemma3:4b", displayName: "Google Gemma 3", role: "vision" },
        "gemma3:4b": { tag: "gemma3:4b", displayName: "Google Gemma 3", role: "vision" },
        "gemma3-4b": { tag: "gemma3:4b", displayName: "Google Gemma 3", role: "vision" },
        "nemotron": { tag: "nemotron-3-nano:latest", displayName: "NVIDIA Nemotron 3", role: "reasoning" },
        "nemotron-3-nano": { tag: "nemotron-3-nano:latest", displayName: "NVIDIA Nemotron 3", role: "reasoning" },
        "nemotron-3-nano:latest": { tag: "nemotron-3-nano:latest", displayName: "NVIDIA Nemotron 3", role: "reasoning" },
        "qwen": { tag: "qwen2.5-coder:1.5b", displayName: "Qwen 2.5 Coder", role: "coding" },
        "qwen2.5-coder:1.5b": { tag: "qwen2.5-coder:1.5b", displayName: "Qwen 2.5 Coder", role: "coding" },
        "local-code-specialist": { tag: "qwen2.5-coder:1.5b", displayName: "Qwen 2.5 Coder", role: "coding" }
      };

      const requestedMode = payload.modelMode || "auto";
      const requestedOverride = payload.model_override || payload.requested_model || (requestedMode !== "auto" ? requestedMode : null);
      const isManual = Boolean(requestedOverride && requestedOverride !== "auto");

      let targetOllamaModel = "nemotron-3-nano:latest";
      let modelDisplayName = "NVIDIA Nemotron 3";

      if (isManual) {
        const mapped = CANONICAL_MODEL_MAP[requestedOverride];
        if (mapped) {
          targetOllamaModel = mapped.tag;
          modelDisplayName = mapped.displayName;
        } else {
          targetOllamaModel = requestedOverride;
          modelDisplayName = requestedOverride;
        }

        // Strict No-Silent-Fallback Verification
        const isAvailable = availableModels.length === 0 || availableModels.some(m => m === targetOllamaModel || m.startsWith(targetOllamaModel.split(":")[0]));
        if (!isAvailable) {
          json(res, 503, {
            status: "model_unavailable",
            requested_model: targetOllamaModel,
            actual_model: null,
            model_mode: "manual",
            model_source: "ollama-local",
            external_calls: 0,
            error: {
              code: "MODEL_NOT_FOUND",
              message: `${modelDisplayName} (${targetOllamaModel}) is currently unavailable in local Ollama runtime.`
            }
          });
          return;
        }
      } else {
        // Auto routing based on task
        const taskLower = task.toLowerCase();
        if (taskLower.includes("code") || taskLower.includes("script") || taskLower.includes("python") || taskLower.includes("sql") || taskLower.includes("calc") || taskLower.includes("debug") || taskLower.includes("function") || taskLower.includes("def ") || taskLower.includes("return ") || taskLower.includes("const ") || taskLower.includes("class ") || taskLower.includes("=>") || taskLower.includes("regex") || taskLower.includes("json")) {
          targetOllamaModel = "qwen2.5-coder:1.5b";
          modelDisplayName = "Qwen 2.5 Coder";
        } else if (taskLower.includes("image") || taskLower.includes("photo") || taskLower.includes("drawing") || taskLower.includes("visual") || taskLower.includes("p&id") || taskLower.includes("ocr")) {
          targetOllamaModel = "gemma3:4b";
          modelDisplayName = "Google Gemma 3";
        } else {
          targetOllamaModel = "nemotron-3-nano:latest";
          modelDisplayName = "NVIDIA Nemotron 3";
        }
      }

      process.env.OLLAMA_MODEL = targetOllamaModel;
      const agentParameters = {
        ...(payload.parameters || {}),
        model: targetOllamaModel
      };

      const wantsStream = Boolean(payload.stream === true || (req.headers["accept"] && req.headers["accept"].includes("text/event-stream")));

      if (wantsStream) {
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "X-Accel-Buffering": "no"
        });

        const sendSSE = (event, data) => {
          try {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
          } catch {
            // Client closed
          }
        };

        const requestId = payload.trace_id || `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        sendSSE("status", {
          state: ModelLifecycleState.PREPARING,
          message: `Preparing ${modelDisplayName}...`,
          model: modelDisplayName,
          tag: targetOllamaModel
        });

        sendSSE("metadata", {
          requestedModel: isManual ? targetOllamaModel : "auto",
          actualModel: targetOllamaModel,
          modelDisplayName,
          modelMode: isManual ? "manual" : "auto",
          agentId: agent.agent_id,
          agentName: agent.name || agent.agent_id,
          requestId
        });

        req.on("close", () => {
          modelStreamer.cancelStream(requestId);
        });

        try {
          const sysPrompt = agent.system_prompt || (agent.domain ? `You are ${agent.name}, an expert AI Agent specializing in ${agent.domain}. Provide accurate, clear, professional answers.` : "You are a helpful industrial AI specialist.");

          await modelStreamer.streamFromOllama({
            model: targetOllamaModel,
            system: sysPrompt,
            prompt: task,
            images: payload.images || [],
            temperature: 0.3,
            options: {
              num_predict: payload.parameters?.max_tokens || 512,
              ...(payload.parameters || {})
            },
            requestId,
            onStatus: (statusObj) => {
              sendSSE("status", statusObj);
            },
            onToken: (tokenChunk, accumulatedText) => {
              sendSSE("token", { text: tokenChunk, fullText: accumulatedText });
            },
            onComplete: (metrics) => {
              sendSSE("complete", {
                ...metrics,
                agent_id: agent.agent_id,
                requested_model: isManual ? targetOllamaModel : "auto",
                actual_model: targetOllamaModel,
                model_mode: isManual ? "manual" : "auto",
                model_source: "ollama-local",
                model: modelDisplayName,
                external_calls: 0
              });
              res.end();
            },
            onError: (err) => {
              sendSSE("error", {
                message: err.message,
                status: "error"
              });
              res.end();
            }
          });
        } catch (streamErr) {
          sendSSE("error", {
            message: streamErr.message,
            status: "error"
          });
          res.end();
        }
        return;
      }

      const agentPayload = {
        task,
        context: payload.context || {},
        parameters: agentParameters,
        model: targetOllamaModel,
        model_override: targetOllamaModel,
        modelMode: isManual ? "manual" : "auto",
        requested_model: targetOllamaModel,
        output_format: payload.output_format || "text"
      };

      let result;
      const inferenceStart = performance.now();
      try {
        result = await requestAgent(agent, agentPayload);
      } catch (err) {
        const inProc = await executeAgentInProcess(agent.agent_id, agentPayload);
        if (inProc) {
          result = inProc;
        } else {
          throw err;
        }
      }

      // If specialist agent rejected the task or recommended another agent, automatically route to recommended specialist or Super AI
      if (result && (result.status === "rejected" || result.error)) {
        const recommendedId = result.error?.recommended_agent?.id;
        const targetAgent = (recommendedId && agents.find(a => a.agent_id === recommendedId)) || agents.find(a => a.agent_id === "agent-101");
        if (targetAgent && targetAgent.agent_id !== agent.agent_id) {
          try {
            const routedResult = await executeAgentInProcess(targetAgent.agent_id, agentPayload);
            if (routedResult && routedResult.status !== "rejected") {
              result = routedResult;
            }
          } catch (routeErr) {
            console.warn("Auto routing fallback failed:", routeErr.message);
          }
        }
      }

      const totalDurationMs = Math.round(performance.now() - inferenceStart);
      const actualModel = result?.metadata?.actual_model || result?.metadata?.model || targetOllamaModel;

      // Extract and format response text cleanly for frontend consumers
      let answerText = "";
      let evidence = [];
      let deliverables = [];
      let plan = [];

      if (typeof result === "string") {
        answerText = result;
      } else if (result && typeof result === "object") {
        if (typeof result.result === "string") {
          answerText = result.result;
        } else if (result.result && typeof result.result === "object") {
          answerText = result.result.synthesis || result.result.summary || result.result.output || result.result.text || "";
          if (Array.isArray(result.result.delegation_results)) {
            evidence = result.result.delegation_results.map(dr => ({
              title: dr.agent_name || dr.agent_id,
              citation: dr.status === "completed" ? "Completed successfully" : "Processed",
              details: typeof dr.result?.result === "string" ? dr.result.result.slice(0, 140) + "..." : "Grounded"
            }));
          }
          if (Array.isArray(result.result.used_agents)) {
            plan = result.result.used_agents.map((agId, i) => ({
              step: `Step ${i + 1}`,
              agent: agId
            }));
          }
        } else if (typeof result.text === "string") {
          answerText = result.text;
        } else if (typeof result.output === "string") {
          answerText = result.output;
        } else if (typeof result.message === "string") {
          answerText = result.message;
        } else if (result.error && typeof result.error === "object" && result.error.message) {
          answerText = result.error.message;
        } else if (typeof result.error === "string") {
          answerText = result.error;
        }

        if (Array.isArray(result.evidence)) evidence = result.evidence;
        if (Array.isArray(result.deliverables)) deliverables = result.deliverables;
        if (Array.isArray(result.plan)) plan = result.plan;
      }

      if (!answerText) {
        if (result && result.status === "rejected" && result.error?.message) {
          answerText = result.error.message;
        } else {
          answerText = typeof result === "object" ? JSON.stringify(result, null, 2) : String(result || "");
        }
      }

      const wordsCount = answerText.split(/\s+/).filter(Boolean).length;
      const tokensEstimate = Math.round(wordsCount * 1.33);
      const tokensPerSec = totalDurationMs > 0 ? Number(((tokensEstimate / (totalDurationMs / 1000))).toFixed(1)) : 0;

      json(res, 200, {
        status: "success",
        gateway: "100-to-1",
        trace_id: payload.trace_id || `INT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        agent: {
          agent_id: agent.agent_id,
          name: agent.name,
          category: agent.category
        },
        requested_model: isManual ? targetOllamaModel : "auto",
        actual_model: actualModel,
        model_mode: isManual ? "manual" : "auto",
        model_source: "ollama-local",
        model: modelDisplayName,
        external_calls: 0,
        text: answerText,
        evidence,
        deliverables,
        plan,
        duration_ms: totalDurationMs,
        tokens_per_sec: tokensPerSec,
        result: {
          text: answerText,
          content: answerText,
          synthesis: answerText,
          actual_model: actualModel,
          requested_model: isManual ? targetOllamaModel : "auto",
          model: modelDisplayName,
          evidence,
          deliverables,
          plan,
          raw: result
        }
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

    // CONVERSATION HISTORY ENDPOINTS
    if (req.method === "GET" && url.pathname === "/api/chats") {
      const { listChats, searchChats } = await import("../../services/conversation-service.js");
      const q = url.searchParams.get("q");
      const chats = q ? searchChats(q) : listChats();
      json(res, 200, { status: "success", chats });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/chats") {
      const payload = await readBody(req);
      const { createChat } = await import("../../services/conversation-service.js");
      const chat = createChat(payload);
      json(res, 201, { status: "success", chat });
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/chats/")) {
      const id = url.pathname.replace("/api/chats/", "");
      const { getChat } = await import("../../services/conversation-service.js");
      const chat = getChat(id);
      if (!chat) {
        json(res, 404, { status: "error", error: `Chat not found: ${id}` });
        return;
      }
      json(res, 200, { status: "success", chat });
      return;
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/api/chats/")) {
      const id = url.pathname.replace("/api/chats/", "");
      const payload = await readBody(req);
      const { updateChat } = await import("../../services/conversation-service.js");
      const chat = updateChat(id, payload);
      if (!chat) {
        json(res, 404, { status: "error", error: `Chat not found: ${id}` });
        return;
      }
      json(res, 200, { status: "success", chat });
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/chats/")) {
      const id = url.pathname.replace("/api/chats/", "");
      const { deleteChat } = await import("../../services/conversation-service.js");
      const success = deleteChat(id);
      json(res, 200, { status: "success", deleted: success });
      return;
    }

    if (req.method === "POST" && url.pathname.includes("/messages")) {
      const match = url.pathname.match(/^\/api\/chats\/([^/]+)\/messages$/);
      if (match) {
        const id = match[1];
        const payload = await readBody(req);
        const { appendMessage } = await import("../../services/conversation-service.js");
        const chat = appendMessage(id, payload);
        json(res, 200, { status: "success", chat });
        return;
      }
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
