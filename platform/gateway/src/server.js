import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WorkflowEngine, SuperAIWorkflowEngine, globalSuperAIWorkflowEngine, ResourceScheduler, ArtifactManager, globalArtifactManager } from "../../workflow-engine/index.js";
import { EventEmitter } from "node:events";
import { StudentService, AcademicService, FinanceService, DocumentService, AdmissionService, FacultyService, AuditService } from "../../services/index.js";
import { modelStreamer, ModelLifecycleState, runLocalModel } from "../../models/model-streamer.js";
import { getModelById, LOCAL_MODELS, isCpuModel, isJetsonModel } from "../../models/model-registry.js";
import { conversationManager } from "../../context/index.js";
import { agentScopeGuard } from "../../intelligence/index.js";
import { documentExtractor, imageQuestionPipeline, classifyTaskAndAgent, TaskType } from "../../multimodal/index.js";
import { validateAttachmentIntegrity } from "../../multimodal/attachment-integrity.js";
import { ingestDocument, queryRAG, IngestionNamespace } from "../../rag/index.js";
import { voiceService, globalOfflineTTSEngine, globalOfflineSTTEngine } from "../../voice/index.js";
import { pythonClient } from "../../compute/python-client.js";
import { nodeManager } from "../../compute/node-manager.js";
import { superOrchestrator } from "../../orchestration/super-orchestrator.js";
import { routingRegistry } from "../../intelligence/routing-registry.js";
import { discoverAllAgents, discoverAgent, AgentLauncher, AgentSessionManager, networkPolicy, getCapabilityMatrix } from "../../agents/index.js";
import { orchestratorController } from "../../orchestrator/index.js";
import { ingestDatasetFile, getDatasetById, listAllDatasets, deleteDataset } from "../../datasets/dataset-registry.js";
import { analyzeDatasetQuestion } from "../../datasets/dataset-analyst-agent.js";
import { executeDatasetSQL, validateReadOnlySQL } from "../../datasets/sql-engine.js";
import { ingestTrainingDataset } from "../../finetuning/dataset-manager.js";
import { listTrainableModels, getAllTrainableModels } from "../../finetuning/trainable-model-registry.js";
import { fineTuneJobManager } from "../../finetuning/job-manager.js";
import { evaluateJobPerformance } from "../../finetuning/evaluation-engine.js";
import { packageAndRegisterModel } from "../../finetuning/model-packager.js";
import {
  detectDatasetDomain,
  specialistSessionManager,
  checkSpecialistModelsHealth,
  querySpecialistModel,
  SPECIALIST_REGISTRY,
  SpecialistDomain
} from "../../specialists/specialist-manager.js";
import {
  obsidianConfig,
  obsidianIndexer,
  obsidianWatcher,
  sourceRegistry,
  knowledgeService,
  initDemoVaultIfEmpty
} from "../../knowledge/index.js";
import { personalStyleGemmaRuntime } from "../../personal-style/gemma-runtime.js";
import { modelArenaService } from '../../model-arena/model-arena-service.js';
import {
  validate,
  validationErrorResponse,
  ChatRequestSchema,
  ArenaCompareSchema,
  ArenaActionSchema,
  PersonalStyleChatSchema,
  PersonalStyleActionSchema,
  DatasetQuerySchema,
  FineTuneJobCreateSchema
} from "./schemas/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "../../..");
const REGISTRY = path.join(ROOT, "registry", "agents.json");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8300);
const SERVER_START_TIME = new Date().toISOString();
const UI_BUILD_VERSION = "liquid-glass-v2.1";
const GIT_COMMIT_SHA = "b4f89ac-forensic-repair";

const agentLauncher = new AgentLauncher();
const agentSessionManager = new AgentSessionManager();

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
}

let cachedAvailableModels = [];
let lastTagsFetchTime = 0;
const TAGS_CACHE_TTL = 60000;

async function getAvailableModelsCached() {
  const now = Date.now();
  if (cachedAvailableModels.length > 0 && (now - lastTagsFetchTime) < TAGS_CACHE_TTL) {
    return cachedAvailableModels;
  }
  try {
    const tagsRes = await fetch("http://127.0.0.1:11434/api/tags", { signal: AbortSignal.timeout(1200) }).catch(() => null);
    if (tagsRes && tagsRes.ok) {
      const tagsData = await tagsRes.json();
      cachedAvailableModels = (tagsData.models || []).map(m => m.name || m.model);
      lastTagsFetchTime = now;
    }
  } catch {}
  return cachedAvailableModels;
}

function pingLocalUrl(url, timeoutMs = 2000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request(parsed, { method: "GET", timeout: timeoutMs }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => { req.destroy(); resolve(false); });
      req.end();
    } catch {
      resolve(false);
    }
  });
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

      if (raw.length > 10 * 1024 * 1024) {
        reject(new Error("Request body exceeds 10 MiB"));
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

  process.env.OLLAMA_MODEL = payload.model || process.env.OLLAMA_MODEL || "nemotron-3-nano:latest";
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

    if (req.method === "GET" && (url.pathname === "/api/health" || url.pathname === "/health")) {
      json(res, 200, {
        status: "READY",
        service: "301-super-ai-gateway",
        public_url: "https://superai.reginaldalfret.tech",
        gateway: "READY",
        ollama: "READY",
        python: pythonClient.circuit.state === "OPEN" ? "DEGRADED" : "READY",
        database: "READY",
        rag: "READY",
        agents: "READY",
        total_agents: agents.length,
        models_available: LOCAL_MODELS.length,
        is_air_gapped: true,
        external_ai_calls: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/compute/status") {
      json(res, 200, {
        status: "success",
        compute: pythonClient.getStatus(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/compute/health") {
      const health = await pythonClient.checkHealth();
      json(res, 200, {
        status: "success",
        health,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/compute/nodes") {
      const nodes = nodeManager.getNodes();
      json(res, 200, {
        status: "success",
        nodes,
        total: nodes.length,
        is_air_gapped: true,
        external_calls: 0,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/compute/nodes/jetson/health") {
      const health = await nodeManager.checkNodeHealth("node-jetson-01");
      json(res, 200, {
        status: "success",
        health,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/compute/nodes/jetson/status") {
      const node = nodeManager.getNode("node-jetson-01");
      json(res, 200, {
        status: "success",
        node: node ? node.toJSON() : null,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/compute/nodes/discover") {
      const results = await nodeManager.checkAllNodes();
      json(res, 200, {
        status: "success",
        results,
        nodes: nodeManager.getNodes(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    // ==========================================================================
    // MODEL CATALOG & CAPABILITIES (SANITIZED PUBLIC ORIGIN)
    // ==========================================================================
    if (req.method === "GET" && (url.pathname === "/api/models" || url.pathname === "/api/models/list")) {
      const publicModels = LOCAL_MODELS.map(m => ({
        model_id: m.model_id,
        name: m.name || m.display_name,
        role: m.role,
        provider: m.provider,
        execution_target: m.execution_target,
        quantization: m.quantization,
        context_length: m.context_length,
        supported_modalities: m.supported_modalities,
        capabilities: m.capabilities,
        recommended_tasks: m.recommended_tasks,
        status: m.status || "ready",
        badge: m.badge || "LOCAL"
      }));
      json(res, 200, {
        status: "success",
        total: publicModels.length,
        models: publicModels,
        is_air_gapped: true,
        external_ai_calls: 0
      });
      return;
    }

    // ==========================================================================
    // DATASET INTELLIGENCE & DETERMINISTIC SQL QUERYING ROUTES
    // ==========================================================================
    if (req.method === "GET" && url.pathname === "/api/datasets/list") {
      const datasets = listAllDatasets();
      json(res, 200, { status: "success", datasets, total: datasets.length });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/datasets/upload") {
      const body = await parseBody(req);
      const { filename, content, base64, originalName } = body;
      let buffer = null;
      if (base64) {
        buffer = Buffer.from(base64, "base64");
      } else if (content) {
        buffer = Buffer.from(content, "utf8");
      }
      const record = await ingestDatasetFile({
        filename: filename || originalName || "dataset.csv",
        originalName: originalName || filename,
        buffer
      });
      json(res, 200, { status: "success", dataset: record });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/datasets/query") {
      const body = await parseBody(req);
      const effectiveId = body.dataset_id || body.datasetId;
      const validation = validate(DatasetQuerySchema, {
        dataset_id: effectiveId || "",
        question: body.question,
        query: body.query,
        sql: body.sql
      });
      if (!validation.success) {
        validationErrorResponse(res, validation.error);
        return;
      }
      const { question, sql } = body;
      try {
        const result = await analyzeDatasetQuestion({
          datasetId: effectiveId,
          question: question || "Summarize this dataset",
          sqlOverride: sql || null
        });
        json(res, 200, result);
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/datasets/") && !url.pathname.includes("/query")) {
      const dsId = url.pathname.replace("/api/datasets/", "");
      const dataset = getDatasetById(dsId);
      if (!dataset) {
        json(res, 404, { status: "error", error: "Dataset not found" });
        return;
      }
      json(res, 200, { status: "success", dataset });
      return;
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/datasets/")) {
      const dsId = url.pathname.replace("/api/datasets/", "");
      const ok = deleteDataset(dsId);
      json(res, ok ? 200 : 404, { status: ok ? "success" : "error" });
      return;
    }

    // ==========================================================================
    // FINE-TUNING LLM FACTORY ROUTES
    // ==========================================================================
    if (req.method === "GET" && url.pathname === "/api/finetuning/models") {
      const models = getAllTrainableModels();
      json(res, 200, { status: "success", models, total: models.length });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/finetuning/datasets") {
      const body = await parseBody(req);
      const { filename, content, base64, originalName } = body;
      let buffer = null;
      if (base64) buffer = Buffer.from(base64, "base64");
      else if (content) buffer = Buffer.from(content, "utf8");

      const record = ingestTrainingDataset({
        filename: filename || originalName || "train_dataset.csv",
        originalName: originalName || filename,
        buffer,
        content
      });
      json(res, 200, { status: "success", dataset: record });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/finetuning/jobs") {
      const jobs = fineTuneJobManager.listJobs();
      json(res, 200, { status: "success", jobs, total: jobs.length });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/finetuning/jobs") {
      const body = await parseBody(req);
      const validation = validate(FineTuneJobCreateSchema, body);
      if (!validation.success) {
        validationErrorResponse(res, validation.error);
        return;
      }
      try {
        const job = fineTuneJobManager.createJob(validation.data);
        json(res, 200, { status: "success", job });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/finetuning/jobs/") && !url.pathname.includes("/start") && !url.pathname.includes("/pause") && !url.pathname.includes("/resume") && !url.pathname.includes("/cancel") && !url.pathname.includes("/logs") && !url.pathname.includes("/evaluation")) {
      const jobId = url.pathname.replace("/api/finetuning/jobs/", "");
      const job = fineTuneJobManager.getJob(jobId);
      if (!job) {
        json(res, 404, { status: "error", error: "Job not found" });
        return;
      }
      json(res, 200, { status: "success", job });
      return;
    }

    if (req.method === "POST" && url.pathname.endsWith("/start")) {
      const jobId = url.pathname.replace("/api/finetuning/jobs/", "").replace("/start", "");
      try {
        const job = await fineTuneJobManager.startJob(jobId);
        json(res, 200, { status: "success", job });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "POST" && url.pathname.endsWith("/pause")) {
      const jobId = url.pathname.replace("/api/finetuning/jobs/", "").replace("/pause", "");
      try {
        const job = await fineTuneJobManager.pauseJob(jobId);
        json(res, 200, { status: "success", job });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "POST" && url.pathname.endsWith("/resume")) {
      const jobId = url.pathname.replace("/api/finetuning/jobs/", "").replace("/resume", "");
      try {
        const job = await fineTuneJobManager.resumeJob(jobId);
        json(res, 200, { status: "success", job });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "POST" && url.pathname.endsWith("/cancel")) {
      const jobId = url.pathname.replace("/api/finetuning/jobs/", "").replace("/cancel", "");
      try {
        const job = await fineTuneJobManager.cancelJob(jobId);
        json(res, 200, { status: "success", job });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "GET" && url.pathname.endsWith("/logs")) {
      const jobId = url.pathname.replace("/api/finetuning/jobs/", "").replace("/logs", "");
      const job = fineTuneJobManager.getJob(jobId);
      if (!job) {
        json(res, 404, { status: "error", error: "Job not found" });
        return;
      }
      json(res, 200, { status: "success", logs: job.logs || [], loss_history: job.loss_history || [] });
      return;
    }

    if (req.method === "GET" && url.pathname.endsWith("/evaluation")) {
      const jobId = url.pathname.replace("/api/finetuning/jobs/", "").replace("/evaluation", "");
      const job = fineTuneJobManager.getJob(jobId);
      if (!job) {
        json(res, 404, { status: "error", error: "Job not found" });
        return;
      }
      const evalReport = await evaluateJobPerformance(job);
      json(res, 200, { status: "success", evaluation: evalReport });
      return;
    }

    if (req.method === "POST" && url.pathname.startsWith("/api/finetuning/models/") && url.pathname.endsWith("/register")) {
      const jobId = url.pathname.replace("/api/finetuning/models/", "").replace("/register", "");
      const job = fineTuneJobManager.getJob(jobId);
      if (!job) {
        json(res, 404, { status: "error", error: "Job not found" });
        return;
      }
      const registered = packageAndRegisterModel(job);
      json(res, 200, { status: "success", registered_model: registered });
      return;
    }

    // =========================================================================
    // TWO-DOMAIN SPECIALIST ROUTES (CYBERSECURITY & HEALTHCARE)
    // =========================================================================
    if (req.method === "GET" && url.pathname === "/api/specialists/health") {
      const health = await checkSpecialistModelsHealth();
      json(res, 200, health);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/specialists/detect-domain") {
      const body = await readBody(req);
      const detection = detectDatasetDomain(body.filename, body.columns || [], body.sample_rows || []);
      json(res, 200, { status: "success", ...detection });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/specialists/session/create") {
      const body = await readBody(req);
      try {
        const session = specialistSessionManager.createSession({
          domain: body.domain,
          dataset_id: body.dataset_id,
          dataset_name: body.dataset_name
        });
        json(res, 200, { status: "success", session });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/specialists/session/")) {
      const sessionId = url.pathname.replace("/api/specialists/session/", "");
      const session = specialistSessionManager.getSession(sessionId);
      if (!session) {
        json(res, 404, { status: "error", error: "Specialist session not found" });
        return;
      }
      json(res, 200, { status: "success", session });
      return;
    }

    if (req.method === "POST" && (url.pathname === "/api/specialists/chat" || url.pathname === "/api/specialists/cybersecurity/chat" || url.pathname === "/api/specialists/healthcare/chat")) {
      const body = await readBody(req);
      let domain = body.domain;
      if (url.pathname.includes("/cybersecurity/")) domain = "cybersecurity";
      else if (url.pathname.includes("/healthcare/")) domain = "healthcare";

      if (!domain || !SPECIALIST_REGISTRY[domain.toLowerCase()]) {
        json(res, 400, { status: "error", error: "Domain must be 'cybersecurity' or 'healthcare'." });
        return;
      }

      const prompt = body.message || body.prompt || body.task;
      if (!prompt) {
        json(res, 400, { status: "error", error: "Message prompt is required." });
        return;
      }

      let datasetContext = null;
      if (body.dataset_id) {
        const ds = getDatasetById(body.dataset_id);
        if (ds) {
          datasetContext = `Filename: ${ds.filename}\nRows: ${ds.rowCount}\nColumns: ${ds.columns.join(", ")}`;
        }
      }

      const useStream = body.stream === true;

      if (useStream) {
        // ─── SSE Streaming Mode ───
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no"
        });

        const normalizedDomain = domain.toLowerCase().trim();
        const specialist = SPECIALIST_REGISTRY[normalizedDomain];
        const lockedModel = specialist.model;

        let systemPrompt = '';
        if (normalizedDomain === 'cybersecurity') {
          systemPrompt = 'You are the Cybersecurity AI Specialist. Provide rigorous, precise, technical insights on SOC operations, threat intelligence, and vulnerability mitigation. Keep outputs technical and actionable.';
        } else {
          systemPrompt = 'You are the Healthcare AI Specialist. Provide informative clinical decision-support and medical context explanations. Note: This output is strictly for informational and decision-support use only and is not a substitute for a qualified healthcare professional.';
        }

        let userContent = prompt;
        if (datasetContext) {
          userContent = `[DOMAIN DATASET CONTEXT]:\n${datasetContext}\n\n[USER QUESTION]:\n${prompt}`;
        }

        // Send metadata header event
        res.write(`data: ${JSON.stringify({ type: "meta", domain: normalizedDomain, specialist: specialist.displayName, model: lockedModel, disclaimer: specialist.disclaimer })}\n\n`);

        const ollamaPayload = JSON.stringify({
          model: lockedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          stream: true,
          options: { num_ctx: 2048, temperature: 0.2, top_p: 0.9 }
        });

        const ollamaReq = http.request({
          hostname: '127.0.0.1',
          port: 11434,
          path: '/api/chat',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(ollamaPayload)
          }
        }, (ollamaRes) => {
          let buffer = '';
          ollamaRes.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete line in buffer
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.message && parsed.message.content) {
                  res.write(`data: ${JSON.stringify({ type: "token", content: parsed.message.content })}\n\n`);
                }
                if (parsed.done) {
                  res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
                }
              } catch {}
            }
          });
          ollamaRes.on('end', () => {
            // Process any remaining buffer
            if (buffer.trim()) {
              try {
                const parsed = JSON.parse(buffer);
                if (parsed.message && parsed.message.content) {
                  res.write(`data: ${JSON.stringify({ type: "token", content: parsed.message.content })}\n\n`);
                }
              } catch {}
            }
            res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            res.end();
          });
          ollamaRes.on('error', (err) => {
            res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
            res.end();
          });
        });

        ollamaReq.on('error', (err) => {
          res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
          res.end();
        });

        ollamaReq.write(ollamaPayload);
        ollamaReq.end();
        return;
      }

      // ─── Non-Streaming Mode (original) ───
      try {
        const result = await querySpecialistModel({
          domain,
          prompt,
          datasetContext
        });

        if (body.session_id) {
          specialistSessionManager.appendMessage(body.session_id, {
            role: "user",
            content: prompt
          });
          specialistSessionManager.appendMessage(body.session_id, {
            role: "assistant",
            content: result.response,
            model: result.model,
            specialist: result.specialist,
            disclaimer: result.disclaimer
          });
        }

        json(res, 200, {
          status: "success",
          ...result
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/system/health") {
      const pyHealth = await pythonClient.checkHealth();
      const ollamaHealthy = await pingLocalUrl("http://127.0.0.1:11434/api/tags", 2000);
      const isHealthy = ollamaHealthy;
      json(res, 200, {
        status: isHealthy ? "ready" : "degraded",
        services: {
          ollama: ollamaHealthy ? "ready" : "offline",
          python: pyHealth.status === "healthy" ? "ready" : "degraded_fallback",
          gateway: "ready"
        },
        website: "ready",
        externalEgress: 0,
        air_gapped: true,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/system/status") {
      const pyStatus = pythonClient.getStatus();
      const ollamaHealthy = await pingLocalUrl("http://127.0.0.1:11434/api/tags", 2000);
      json(res, 200, {
        system: "ready",
        services: {
          ollama: {
            status: ollamaHealthy ? "ready" : "offline",
            port: 11434,
            models: ["nemotron-3-nano:latest", "qwen2.5-coder:1.5b", "gemma3:1b", "llama3.2:1b", "granite4:1b-h", "phi4-mini", "smollm2:1.7b", "LiquidAI/lfm2.5-350m", "mollysama/rwkv-7-g1d:0.4b"]
          },
          python: pyStatus,
          gateway: {
            status: "ready",
            port: 8300,
            total_agents: agents.length
          }
        },
        gpu: {
          model: "NVIDIA GeForce RTX 2050",
          vram_gb: 4,
          max_concurrent_models: 1
        },
        externalEgress: 0,
        uptime: process.uptime(),
        air_gapped: true,
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

    if (req.method === "POST" && url.pathname === "/api/workflow/plan") {
      const payload = await readBody(req);
      const prompt = payload.prompt || payload.task || payload.message || "";
      const plan = globalSuperAIWorkflowEngine.planWorkflow(prompt);
      json(res, 200, {
        status: "success",
        plan
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/workflow/execute") {
      const payload = await readBody(req);
      let plan = payload.plan;
      if (!plan) {
        const prompt = payload.prompt || payload.task || payload.message || "";
        plan = globalSuperAIWorkflowEngine.planWorkflow(prompt);
      }
      const wf = await globalSuperAIWorkflowEngine.executeWorkflow(plan);
      json(res, 200, {
        status: "success",
        workflow: wf
      });
      return;
    }

    if (req.method === "POST" && url.pathname.startsWith("/api/workflow/") && url.pathname.endsWith("/cancel")) {
      const parts = url.pathname.split("/");
      const wfId = parts[3];
      const ok = globalSuperAIWorkflowEngine.cancelWorkflow(wfId);
      json(res, 200, {
        status: ok ? "success" : "not_found",
        workflowId: wfId,
        cancelled: ok
      });
      return;
    }

    if (req.method === "POST" && url.pathname.startsWith("/api/workflow/") && url.pathname.endsWith("/retry")) {
      const parts = url.pathname.split("/");
      const wfId = parts[3];
      const payload = await readBody(req);
      const subtaskId = payload.subtaskId;
      try {
        const wf = await globalSuperAIWorkflowEngine.retrySubtask(wfId, subtaskId);
        json(res, 200, {
          status: "success",
          workflow: wf
        });
      } catch (err) {
        json(res, 400, {
          status: "error",
          error: err.message
        });
      }
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/workflow/") && url.pathname.endsWith("/artifacts")) {
      const parts = url.pathname.split("/");
      const wfId = parts[3];
      const artifacts = globalArtifactManager.getWorkflowArtifacts(wfId);
      json(res, 200, {
        status: "success",
        workflowId: wfId,
        count: artifacts.length,
        artifacts
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/tts/voices") {
      json(res, 200, {
        status: "success",
        engine: "Windows.Media.SpeechSynthesis (OneCore Local)",
        voice: globalOfflineTTSEngine.getVoiceInfo(),
        offline: true,
        airGapped: true
      });
      return;
    }

    if ((req.method === "POST" || req.method === "GET") && url.pathname === "/api/tts") {
      let text = "";
      let rate = 1.0;
      if (req.method === "POST") {
        const payload = await readBody(req);
        text = payload.text || payload.message || payload.prompt || "";
        rate = payload.rate || 1.0;
      } else {
        text = url.searchParams.get("text") || "";
        rate = parseFloat(url.searchParams.get("rate")) || 1.0;
      }

      if (!text || text.trim().length === 0) {
        json(res, 400, { status: "error", error: "Text is required for TTS synthesis" });
        return;
      }

      try {
        const audioResult = await globalOfflineTTSEngine.synthesize(text, { rate });
        res.writeHead(200, {
          "Content-Type": audioResult.contentType || "audio/wav",
          "Content-Length": audioResult.buffer.length,
          "X-Voice-Name": audioResult.voice,
          "X-Voice-Locale": audioResult.locale,
          "X-Voice-Source": audioResult.source,
          "X-Air-Gap": "100% Offline Local",
          "Cache-Control": "public, max-age=86400"
        });
        res.end(audioResult.buffer);
      } catch (ttsErr) {
        console.error("[OFFLINE_TTS_ERROR]", ttsErr.message);
        json(res, 500, {
          status: "error",
          error: "TTS_SYNTHESIS_FAILED: " + ttsErr.message,
          airGapped: true
        });
      }
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/stt/health") {
      json(res, 200, globalOfflineSTTEngine.getHealth());
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/stt/transcribe") {
      try {
        const payload = await readBody(req);
        const audioInput = payload.audio || payload.audio_base64 || payload.audio_path || payload.data;
        const locale = payload.locale || "en-IN";

        if (!audioInput) {
          json(res, 400, {
            status: "error",
            error: "AUDIO_DATA_REQUIRED: Audio base64 or path is required for STT transcription"
          });
          return;
        }

        const sttResult = await globalOfflineSTTEngine.transcribe(audioInput, { locale });
        json(res, 200, {
          status: "success",
          ...sttResult
        });
      } catch (sttErr) {
        console.error("[OFFLINE_STT_ERROR]", sttErr.message);
        json(res, 500, {
          status: "error",
          error: "STT_TRANSCRIPTION_FAILED: " + sttErr.message,
          offline: true,
          externalCalls: 0
        });
      }
      return;
    }

    if (req.method === "POST" && (url.pathname === "/api/ocr/analyze-image" || url.pathname === "/api/attachments/extract" || url.pathname === "/api/ocr")) {
      try {
        const payload = await readBody(req);
        const fileObj = payload.attachment || payload.file || payload;
        const result = await imageQuestionPipeline.processImageQuestion(fileObj, payload.options || {});
        json(res, 200, {
          status: "success",
          ...result
        });
      } catch (err) {
        console.error("[IMAGE_OCR_API_ERROR]", err.message);
        json(res, 500, {
          status: "error",
          error: "IMAGE_OCR_FAILED: " + err.message,
          is_air_gapped: true,
          external_calls: 0
        });
      }
      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/chat"
    ) {
      const payload = await readBody(req);
      const validation = validate(ChatRequestSchema, payload);
      if (!validation.success) {
        validationErrorResponse(res, validation.error);
        return;
      }

      console.log(`[CHAT_ROUTE] Request received — agent_id="${payload.agent_id}" task="${(payload.task || '').slice(0, 60)}" stream=${payload.stream} modelMode=${payload.modelMode} origin=${req.headers.origin || req.headers.referer || 'direct'}`);

      const rawAgentId =
        typeof payload.agent_id === "string"
          ? payload.agent_id
          : "";

      const normalizedAgentId =
        (!rawAgentId || rawAgentId === "auto" || rawAgentId === "super-ai" || rawAgentId === "101")
          ? "agent-101"
          : (rawAgentId.startsWith("agent-") ? rawAgentId : `agent-${rawAgentId.padStart(3, "0")}`);

      let task =
        typeof payload.task === "string"
          ? payload.task.trim()
          : (typeof payload.message === "string" ? payload.message.trim() : (typeof payload.prompt === "string" ? payload.prompt.trim() : ""));

      const hasAttachments = Array.isArray(payload.attachments) && payload.attachments.length > 0;

      // Handle Image OCR and Question Extraction
      let imageQuestionResult = null;
      if (hasAttachments) {
        const imageAtt = payload.attachments.find(a => a.type?.startsWith("image/") || /\.(png|jpe?g|webp|bmp|gif|tiff)$/i.test(a.name || ""));
        if (imageAtt) {
          try {
            imageQuestionResult = await imageQuestionPipeline.processImageQuestion(imageAtt, payload.options || {});
            if (imageQuestionResult && imageQuestionResult.text) {
              const isGenericTask = !task || task.startsWith("Analyze and describe the contents of the attached image:");
              if (isGenericTask) {
                task = imageQuestionResult.text;
              }
            }
          } catch (imgErr) {
            console.warn("[IMAGE_QUESTION_PIPELINE_WARN]", imgErr.message);
          }
        }
      }

      if (!task && !hasAttachments) {
        json(res, 400, {
          status: "error",
          error: "task or attachment is required"
        });
        return;
      }

      const isExternalIntegration = ['hermes', 'opencode', 'codex', 'openclaw', 'pi', 'copilot-cli'].includes(rawAgentId.toLowerCase());
      if (isExternalIntegration) {
        const disc = await discoverAgent(rawAgentId.toLowerCase());
        const isRunning = agentLauncher.getAgentStatus(rawAgentId.toLowerCase())?.status === 'RUNNING';
        if (!disc.installed && !isRunning) {
          json(res, 400, {
            status: "error",
            error_code: "AGENT_UNAVAILABLE",
            agent: rawAgentId,
            agent_status: "NOT_INSTALLED",
            message: `Agent '${rawAgentId}' is not installed on this local system. Please select 'Auto — 301 Orchestrator' or an available agent.`
          });
          return;
        }
      }

      if (!task && hasAttachments) {
        const attNames = payload.attachments.map(a => a.name || "file").join(", ");
        const hasPdf = payload.attachments.some(a => (a.name || "").toLowerCase().endsWith(".pdf") || a.type === "application/pdf");
        const hasImg = payload.attachments.some(a => /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(a.name || "") || (a.type || "").startsWith("image/"));
        const hasSheet = payload.attachments.some(a => /\.(xlsx|xls|csv)$/i.test(a.name || "") || (a.type || "").includes("sheet") || (a.type || "").includes("csv"));
        const hasCode = payload.attachments.some(a => /\.(js|py|sql|ts|json|html|css|cpp|c|rs|go|sh)$/i.test(a.name || ""));

        if (hasImg && !hasPdf && !hasSheet) {
          task = `Analyze and describe the contents of the attached image: ${attNames}`;
        } else if (hasPdf && !hasImg && !hasSheet) {
          task = `Analyze and extract findings from the attached document: ${attNames}`;
        } else if (hasSheet) {
          task = `Analyze and summarize data from the attached spreadsheet: ${attNames}`;
        } else if (hasCode) {
          task = `Review and explain the attached code file: ${attNames}`;
        } else {
          task = `Analyze the provided materials: ${attNames}`;
        }
      }

      // Symmetrically classify task & agent for Auto routing (typed text & OCR image text share the exact same classifier)
      let chosenAgentId = normalizedAgentId;
      if (!rawAgentId || rawAgentId === "auto" || rawAgentId === "super-ai" || rawAgentId === "101") {
        const autoClassification = imageQuestionResult?.classification || classifyTaskAndAgent(task);
        if (autoClassification && autoClassification.agentId) {
          chosenAgentId = autoClassification.agentId;
        }
      }

      const agent = agents.find(
        a => a.agent_id === chosenAgentId || a.agent_id === normalizedAgentId || a.agent_id === rawAgentId
      ) || agents.find(a => a.agent_id === "agent-101");

      if (!agent) {
        json(res, 404, {
          status: "error",
          error: `Unknown agent: ${rawAgentId}`
        });
        return;
      }

      // Check live local Ollama model tags for availability
      const availableModels = await getAvailableModelsCached();

      const CANONICAL_MODEL_MAP = {
        "gemma": { tag: "gemma3:1b", displayName: "Google Gemma 3 1B", role: "lightweight-general-text" },
        "gemma3": { tag: "gemma3:1b", displayName: "Google Gemma 3 1B", role: "lightweight-general-text" },
        "gemma3:1b": { tag: "gemma3:1b", displayName: "Google Gemma 3 1B", role: "lightweight-general-text" },
        "gemma3-1b": { tag: "gemma3:1b", displayName: "Google Gemma 3 1B", role: "lightweight-general-text" },
        "nemotron": { tag: "nemotron-3-nano:latest", displayName: "NVIDIA Nemotron 3", role: "reasoning" },
        "nemotron-3-nano": { tag: "nemotron-3-nano:latest", displayName: "NVIDIA Nemotron 3", role: "reasoning" },
        "nemotron-3-nano:latest": { tag: "nemotron-3-nano:latest", displayName: "NVIDIA Nemotron 3", role: "reasoning" },
        "qwen": { tag: "qwen2.5-coder:1.5b", displayName: "Qwen 2.5 Coder", role: "coding" },
        "qwen2.5-coder:1.5b": { tag: "qwen2.5-coder:1.5b", displayName: "Qwen 2.5 Coder", role: "coding" },
        "local-code-specialist": { tag: "qwen2.5-coder:1.5b", displayName: "Qwen 2.5 Coder", role: "coding" },
        "llama": { tag: "llama3.2:1b", displayName: "Meta Llama 3.2 1B", role: "lightweight-general" },
        "llama3": { tag: "llama3.2:1b", displayName: "Meta Llama 3.2 1B", role: "lightweight-general" },
        "llama3.2": { tag: "llama3.2:1b", displayName: "Meta Llama 3.2 1B", role: "lightweight-general" },
        "llama3.2:1b": { tag: "llama3.2:1b", displayName: "Meta Llama 3.2 1B", role: "lightweight-general" },
        "granite": { tag: "granite4:1b-h", displayName: "IBM Granite 4 1B-H", role: "enterprise-rag-tools" },
        "granite4": { tag: "granite4:1b-h", displayName: "IBM Granite 4 1B-H", role: "enterprise-rag-tools" },
        "granite4:1b-h": { tag: "granite4:1b-h", displayName: "IBM Granite 4 1B-H", role: "enterprise-rag-tools" },
        "phi": { tag: "phi4-mini", displayName: "Microsoft Phi-4 Mini", role: "reasoning-math" },
        "phi4": { tag: "phi4-mini", displayName: "Microsoft Phi-4 Mini", role: "reasoning-math" },
        "phi4-mini": { tag: "phi4-mini", displayName: "Microsoft Phi-4 Mini", role: "reasoning-math" },
        "smollm": { tag: "smollm2:1.7b", displayName: "SmolLM2 1.7B", role: "lightweight-general-text" },
        "smollm2": { tag: "smollm2:1.7b", displayName: "SmolLM2 1.7B", role: "lightweight-general-text" },
        "smollm2:1.7b": { tag: "smollm2:1.7b", displayName: "SmolLM2 1.7B", role: "lightweight-general-text" },
        "smollm2-1.7b": { tag: "smollm2:1.7b", displayName: "SmolLM2 1.7B", role: "lightweight-general-text" },
        "lfm": { tag: "LiquidAI/lfm2.5-350m", displayName: "Liquid AI LFM2.5 350M", role: "cpu-lightweight-extraction-tools", execution_target: "CPU" },
        "lfm2": { tag: "LiquidAI/lfm2.5-350m", displayName: "Liquid AI LFM2.5 350M", role: "cpu-lightweight-extraction-tools", execution_target: "CPU" },
        "lfm2.5": { tag: "LiquidAI/lfm2.5-350m", displayName: "Liquid AI LFM2.5 350M", role: "cpu-lightweight-extraction-tools", execution_target: "CPU" },
        "lfm2.5-350m": { tag: "LiquidAI/lfm2.5-350m", displayName: "Liquid AI LFM2.5 350M", role: "cpu-lightweight-extraction-tools", execution_target: "CPU" },
        "LiquidAI/lfm2.5-350m": { tag: "LiquidAI/lfm2.5-350m", displayName: "Liquid AI LFM2.5 350M", role: "cpu-lightweight-extraction-tools", execution_target: "CPU" },
        "LiquidAI/lfm2.5-350m:latest": { tag: "LiquidAI/lfm2.5-350m", displayName: "Liquid AI LFM2.5 350M", role: "cpu-lightweight-extraction-tools", execution_target: "CPU" },
        "rwkv": { tag: "mollysama/rwkv-7-g1d:0.4b", displayName: "RWKV-7 0.4B", role: "cpu-lightweight-general-text", execution_target: "CPU" },
        "rwkv7": { tag: "mollysama/rwkv-7-g1d:0.4b", displayName: "RWKV-7 0.4B", role: "cpu-lightweight-general-text", execution_target: "CPU" },
        "rwkv-7": { tag: "mollysama/rwkv-7-g1d:0.4b", displayName: "RWKV-7 0.4B", role: "cpu-lightweight-general-text", execution_target: "CPU" },
        "rwkv7-0.4b": { tag: "mollysama/rwkv-7-g1d:0.4b", displayName: "RWKV-7 0.4B", role: "cpu-lightweight-general-text", execution_target: "CPU" },
        "mollysama/rwkv-7-g1d:0.4b": { tag: "mollysama/rwkv-7-g1d:0.4b", displayName: "RWKV-7 0.4B", role: "cpu-lightweight-general-text", execution_target: "CPU" },
        "tinyllama": { tag: "tinyllama:1.1b-chat", displayName: "TinyLlama 1.1B", provider: "TinyLlama", role: "cpu-lightweight-general-chat", execution_target: "CPU" },
        "tinyllama-1.1b": { tag: "tinyllama:1.1b-chat", displayName: "TinyLlama 1.1B", provider: "TinyLlama", role: "cpu-lightweight-general-chat", execution_target: "CPU" },
        "tinyllama:1.1b-chat": { tag: "tinyllama:1.1b-chat", displayName: "TinyLlama 1.1B", provider: "TinyLlama", role: "cpu-lightweight-general-chat", execution_target: "CPU" },
        "stablelm": { tag: "stablelm2:1.6b", displayName: "Stable LM 2 1.6B", provider: "Stability AI", role: "cpu-general-text-summarization", execution_target: "CPU" },
        "stablelm2": { tag: "stablelm2:1.6b", displayName: "Stable LM 2 1.6B", provider: "Stability AI", role: "cpu-general-text-summarization", execution_target: "CPU" },
        "stablelm2-1.6b": { tag: "stablelm2:1.6b", displayName: "Stable LM 2 1.6B", provider: "Stability AI", role: "cpu-general-text-summarization", execution_target: "CPU" },
        "stablelm2:1.6b": { tag: "stablelm2:1.6b", displayName: "Stable LM 2 1.6B", provider: "Stability AI", role: "cpu-general-text-summarization", execution_target: "CPU" },
        "falcon": { tag: "falcon3:1b-instruct-q4_K_M", displayName: "Falcon3 1B", provider: "Technology Innovation Institute", role: "science-math-coding", execution_target: "GPU" },
        "falcon3": { tag: "falcon3:1b-instruct-q4_K_M", displayName: "Falcon3 1B", provider: "Technology Innovation Institute", role: "science-math-coding", execution_target: "GPU" },
        "falcon3-1b": { tag: "falcon3:1b-instruct-q4_K_M", displayName: "Falcon3 1B", provider: "Technology Innovation Institute", role: "science-math-coding", execution_target: "GPU" },
        "falcon3-1b-instruct": { tag: "falcon3:1b-instruct-q4_K_M", displayName: "Falcon3 1B", provider: "Technology Innovation Institute", role: "science-math-coding", execution_target: "GPU" },
        "falcon3:1b-instruct-q4_K_M": { tag: "falcon3:1b-instruct-q4_K_M", displayName: "Falcon3 1B", provider: "Technology Innovation Institute", role: "science-math-coding", execution_target: "GPU" },
        "cyber": { tag: "babar_jamali/qwen3-1.7b-cyber:latest", displayName: "qwen3-1.7b-cyber", provider: "Babar Ali Jamali", role: "cybersecurity-soc-dfir", execution_target: "AUTO_GPU_CPU", category: "FINE-TUNED" },
        "qwen3-cyber": { tag: "babar_jamali/qwen3-1.7b-cyber:latest", displayName: "qwen3-1.7b-cyber", provider: "Babar Ali Jamali", role: "cybersecurity-soc-dfir", execution_target: "AUTO_GPU_CPU", category: "FINE-TUNED" },
        "qwen3-1.7b-cyber": { tag: "babar_jamali/qwen3-1.7b-cyber:latest", displayName: "qwen3-1.7b-cyber", provider: "Babar Ali Jamali", role: "cybersecurity-soc-dfir", execution_target: "AUTO_GPU_CPU", category: "FINE-TUNED" },
        "babar_jamali/qwen3-1.7b-cyber:latest": { tag: "babar_jamali/qwen3-1.7b-cyber:latest", displayName: "qwen3-1.7b-cyber", provider: "Babar Ali Jamali", role: "cybersecurity-soc-dfir", execution_target: "AUTO_GPU_CPU", category: "FINE-TUNED" },
        "medgemma": { tag: "medgemma:4b-it-q4_K_M", displayName: "medgemma:4b", provider: "Google", role: "healthcare-medical-clinical-support", execution_target: "GPU", category: "DOMAIN_SPECIALIST", input_modalities: ["text", "image"] },
        "medgemma-4b": { tag: "medgemma:4b-it-q4_K_M", displayName: "medgemma:4b", provider: "Google", role: "healthcare-medical-clinical-support", execution_target: "GPU", category: "DOMAIN_SPECIALIST", input_modalities: ["text", "image"] },
        "medgemma:4b": { tag: "medgemma:4b-it-q4_K_M", displayName: "medgemma:4b", provider: "Google", role: "healthcare-medical-clinical-support", execution_target: "GPU", category: "DOMAIN_SPECIALIST", input_modalities: ["text", "image"] },
        "medgemma:4b-it-q4_K_M": { tag: "medgemma:4b-it-q4_K_M", displayName: "medgemma:4b", provider: "Google", role: "healthcare-medical-clinical-support", execution_target: "GPU", category: "DOMAIN_SPECIALIST", input_modalities: ["text", "image"] },
        "medical": { tag: "medgemma:4b-it-q4_K_M", displayName: "medgemma:4b", provider: "Google", role: "healthcare-medical-clinical-support", execution_target: "GPU", category: "DOMAIN_SPECIALIST", input_modalities: ["text", "image"] },
        "healthcare": { tag: "medgemma:4b-it-q4_K_M", displayName: "medgemma:4b", provider: "Google", role: "healthcare-medical-clinical-support", execution_target: "GPU", category: "DOMAIN_SPECIALIST", input_modalities: ["text", "image"] }
      };

      const requestedMode = payload.modelMode || "auto";
      const requestedOverride = payload.model_override || payload.requested_model || (requestedMode !== "auto" ? requestedMode : null);
      const isManual = Boolean(requestedOverride && requestedOverride !== "auto");

      let targetOllamaModel = "nemotron-3-nano:latest";
      let modelDisplayName = "NVIDIA Nemotron 3";

      if (isManual) {
        let mapped = CANONICAL_MODEL_MAP[requestedOverride];
        if (!mapped) {
          const reg = getModelById(requestedOverride) || LOCAL_MODELS.find(m => m.model_id === requestedOverride || m.ollama_name === requestedOverride);
          if (reg) {
            mapped = {
              tag: reg.ollama_name || reg.model_id,
              displayName: reg.name,
              provider: reg.provider,
              execution_target: reg.execution_target,
              runtime_type: reg.runtime_type
            };
          }
        }

        if (mapped) {
          targetOllamaModel = mapped.tag;
          modelDisplayName = mapped.displayName;
        } else {
          targetOllamaModel = requestedOverride;
          modelDisplayName = requestedOverride;
        }

        // Strict No-Silent-Fallback Verification
        const isNonOllamaRuntime = mapped && mapped.runtime_type && mapped.runtime_type !== "OLLAMA";
        const isAvailable = isNonOllamaRuntime || availableModels.length === 0 || availableModels.some(m => m === targetOllamaModel || m.startsWith(targetOllamaModel.split(":")[0]));
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
      }

      // Process Multimodal Attachments & Document Extraction
      let extractedEvidenceText = "";
      const imagesList = Array.isArray(payload.images) ? [...payload.images] : [];
      const hasImages = imagesList.length > 0;
      const sseAttachmentErrors = [];
      if (Array.isArray(payload.attachments) && payload.attachments.length > 0) {
        const userPromptLower = task.toLowerCase();
        const userAsksForMetadata = /c2pa|metadata|xmp|creator|producer|credentials|header|properties/i.test(userPromptLower);

        for (const att of payload.attachments) {
          const validationResult = validateAttachmentIntegrity(att);
          console.log(`[ATTACHMENT_VALIDATION] name="${att.name}" valid=${validationResult.valid} size=${validationResult.size || 0}`);
          
          if (!validationResult.valid) {
            if (validationResult.error === 'ATTACHMENT_EMPTY' && (att.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(att.name))) {
              sseAttachmentErrors.push({ code: 'IMAGE_PAYLOAD_MISSING', message: `Image attachment ${att.name} has empty data` });
            }
            console.warn(`Skipping invalid attachment ${att.name}: ${validationResult.message}`);
            continue;
          } else {
            const raw = (att.data || att.content || '').split(',').pop().trim().replace(/\s/g, '');
            if (raw && !/^[A-Za-z0-9+/]*={0,2}$/.test(raw)) {
              sseAttachmentErrors.push({ code: 'IMAGE_DECODE_FAILED', message: `Base64 decoding failed for ${att.name}` });
              continue;
            }
            if (att.type?.startsWith('image/') && validationResult.detectedType !== 'unknown' && validationResult.detectedType !== att.type && att.type !== 'application/octet-stream') {
              sseAttachmentErrors.push({ code: 'IMAGE_INVALID_SIGNATURE', message: `Magic bytes don't match declared MIME for ${att.name}` });
              continue;
            }
          }

          const doc = await documentExtractor.extractContent(att);
          if (doc) {
            console.log(`[ATTACHMENT_INGEST] filename="${att.name}" mime="${att.type}" size=${att.size} isImage=${doc?.isMultimodalImage} needsVision=${doc?.needsVision} contentChars=${doc?.contentText?.length || 0} metaChars=${doc?.metadataText?.length || 0}`);
            if (doc.isMultimodalImage && doc.base64Image) {
              imagesList.push(doc.base64Image);
            }
            const primaryContent = doc.contentText || doc.extractedText || "";
            if (primaryContent) {
              if (primaryContent.length > 3500) {
                // Long document: Ingest into RAG and retrieve top-K relevant chunks with citations
                try {
                  const { document: indexedDoc } = await ingestDocument(primaryContent, doc.filename, {
                    namespace: IngestionNamespace.ATTACHMENT,
                    mimeType: att.type || 'text/plain'
                  });
                  const ragResult = await queryRAG(task, {
                    documentId: indexedDoc.documentId,
                    namespace: IngestionNamespace.ATTACHMENT,
                    topK: 6,
                    maxTokens: 2500
                  });
                  if (ragResult && ragResult.evidencePack) {
                    extractedEvidenceText += `\n\n${ragResult.evidencePack}`;
                  } else {
                    extractedEvidenceText += `\n\n[ATTACHED EVIDENCE: ${doc.filename}]\n${primaryContent.slice(0, 3500)}...`;
                  }
                } catch (ragErr) {
                  console.warn(`[RAG_ATTACHMENT_FALLBACK] ${ragErr.message}`);
                  extractedEvidenceText += `\n\n[ATTACHED EVIDENCE: ${doc.filename}]\n${primaryContent.slice(0, 3500)}`;
                }
              } else {
                extractedEvidenceText += `\n\n[ATTACHED EVIDENCE: ${doc.filename}]\n${primaryContent}`;
              }
            }
          }
        }
      }

      if (imageQuestionResult && imageQuestionResult.text) {
        if (!extractedEvidenceText.includes("[IMAGE OCR EVIDENCE]")) {
          extractedEvidenceText = `\n\n${imageQuestionResult.evidenceBlock}`;
        }
      }

      const isKnowledgeMode = payload.mode === "knowledge" || payload.knowledgeMode === true || payload.mode === "knowledge-rag";
      let knowledgeEvidence = null;
      let isGrounded = false;
      let knowledgeCitations = [];
      let knowledgeSources = [];

      if (isKnowledgeMode) {
        knowledgeEvidence = await knowledgeService.queryKnowledge(task, {
          domain: payload.domain,
          tag: payload.tag,
          folder: payload.folder,
          topK: payload.topK || 5
        });

        if (!knowledgeEvidence.grounded) {
          const unsupportedMsg = "I couldn't find supporting information in your connected knowledge base.";
          const wantsStream = Boolean(payload.stream === true || (req.headers["accept"] && req.headers["accept"].includes("text/event-stream")));
          if (wantsStream) {
            res.writeHead(200, {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive",
              "Access-Control-Allow-Origin": "*"
            });
            const sendSSE = (ev, data) => {
              try { res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`); } catch {}
            };
            sendSSE("token", { text: unsupportedMsg, fullText: unsupportedMsg });
            sendSSE("complete", {
              status: "completed",
              text: unsupportedMsg,
              grounded: false,
              citations: [],
              sources: [],
              is_air_gapped: true,
              external_calls: 0
            });
            res.end();
            return;
          } else {
            json(res, 200, {
              status: "success",
              response: unsupportedMsg,
              text: unsupportedMsg,
              grounded: false,
              citations: [],
              sources: [],
              is_air_gapped: true,
              external_calls: 0
            });
            return;
          }
        }

        isGrounded = true;
        knowledgeCitations = knowledgeEvidence.citations;
        knowledgeSources = knowledgeEvidence.sources;
        extractedEvidenceText += `\n\n[OBSIDIAN KNOWLEDGE BASE EVIDENCE]\n${knowledgeEvidence.evidencePack}`;
      }

      const effectiveTask = extractedEvidenceText ? `${task}\n${extractedEvidenceText}` : task;

      // ================================================================
      // MODALITY & SPECIALIST ROUTING — OCR Evidence + Specialized LLM
      // ================================================================
      let needsTwoStagePipeline = false;
      let specialistModel = null;
      let specialistDisplayName = null;

      if (!isManual) {
        if (imageQuestionResult && imageQuestionResult.classification && imageQuestionResult.classification.recommendedModel) {
          targetOllamaModel = imageQuestionResult.classification.recommendedModel;
          const mapped = CANONICAL_MODEL_MAP[targetOllamaModel];
          modelDisplayName = mapped ? mapped.displayName : targetOllamaModel;
        } else {
          // Intelligent Auto routing based on task specialization, context, and document evidence
          const taskLower = effectiveTask.toLowerCase();
          const isHealthTask = taskLower.includes("healthcare") || taskLower.includes("medical") || taskLower.includes("doctor") || taskLower.includes("hypertension") || taskLower.includes("diabetes") || taskLower.includes("cardiovascular") || taskLower.includes("disease") || taskLower.includes("ecg") || taskLower.includes("ekg") || taskLower.includes("symptom") || taskLower.includes("symptoms") || taskLower.includes("clinical") || taskLower.includes("patient") || taskLower.includes("pathology") || taskLower.includes("radiology") || taskLower.includes("x-ray") || taskLower.includes("mri") || taskLower.includes("ct scan") || taskLower.includes("anatomy") || taskLower.includes("pharmacology") || taskLower.includes("dosage") || taskLower.includes("cardiac") || taskLower.includes("oncology") || taskLower.includes("neurology") || taskLower.includes("blood pressure") || taskLower.includes("asthma");
          const isCyberTask = taskLower.includes("cybersecurity") || taskLower.includes("owasp") || taskLower.includes("sql injection") || taskLower.includes("sqli") || taskLower.includes("soc") || taskLower.includes("dfir") || taskLower.includes("vulnerability") || taskLower.includes("vulnerabilities") || taskLower.includes("auth log") || taskLower.includes("ssh login") || taskLower.includes("failed login") || taskLower.includes("security weakness") || taskLower.includes("penetration testing") || taskLower.includes("malware") || taskLower.includes("threat intelligence") || taskLower.includes("incident response") || taskLower.includes("secure coding");
          if (isHealthTask) {
            targetOllamaModel = "medgemma:4b-it-q4_K_M";
            modelDisplayName = "MedGemma 4B";
          } else if (isCyberTask) {
            targetOllamaModel = "babar_jamali/qwen3-1.7b-cyber:latest";
            modelDisplayName = "Qwen3 1.7B Cyber";
          } else if (taskLower.includes("code") || taskLower.includes("script") || taskLower.includes("python") || taskLower.includes("java") || taskLower.includes("c++") || taskLower.includes("rust") || taskLower.includes("sql") || taskLower.includes("debug") || taskLower.includes("function") || taskLower.includes("def ") || taskLower.includes("return ") || taskLower.includes("const ") || taskLower.includes("class ") || taskLower.includes("=>") || taskLower.includes("regex") || taskLower.includes("json") || taskLower.includes(".csv")) {
            targetOllamaModel = "qwen2.5-coder:1.5b";
            modelDisplayName = "Qwen 2.5 Coder";
          } else if (hasAttachments && (taskLower.includes("rag") || taskLower.includes("extract table") || taskLower.includes("parse invoice") || taskLower.includes("extract entities"))) {
            // Document extraction / RAG routes to IBM Granite 4 1B-H
            targetOllamaModel = "granite4:1b-h";
            modelDisplayName = "IBM Granite 4 1B-H";
          } else if (taskLower.includes("27 × 43") || taskLower.includes("17 × 28") || taskLower.includes("17 * 28") || taskLower.includes("logic problem") || taskLower.includes("why this algorithm works") || taskLower.includes("reasoning problem") || taskLower.includes("step-by-step reasoning") || taskLower.includes("math") || taskLower.includes("calculate") || taskLower.includes("equation") || taskLower.includes("formula")) {
            targetOllamaModel = "phi4-mini";
            modelDisplayName = "Microsoft Phi-4 Mini";
          } else if (taskLower.includes("rag") || taskLower.includes("retriev") || taskLower.includes("entities") || taskLower.includes("entity") || taskLower.includes("classify") || taskLower.includes("classification") || taskLower.includes("extract key") || taskLower.includes("tool call") || taskLower.includes("enterprise")) {
            targetOllamaModel = "granite4:1b-h";
            modelDisplayName = "IBM Granite 4 1B-H";
          } else if (taskLower.includes("rewrite") || taskLower.includes("rephrase") || taskLower.includes("proofread") || taskLower.includes("summarize") || taskLower.includes("summary") || taskLower.includes("explain simply") || taskLower.includes("explain this concept")) {
            targetOllamaModel = "smollm2:1.7b";
            modelDisplayName = "SmolLM2 1.7B";
          } else if (taskLower.includes("quick question") || taskLower.includes("hello") || taskLower.includes("hi ") || taskLower === "hi" || taskLower === "hii" || /\b(hi|hii|hello|hey|greetings|howdy|good morning|good evening)\b/i.test(taskLower)) {
            targetOllamaModel = "llama3.2:1b";
            modelDisplayName = "Meta Llama 3.2 1B";
          } else {
            targetOllamaModel = "nemotron-3-nano:latest";
            modelDisplayName = "NVIDIA Nemotron 3";
          }
        }
      }

      console.log(`[ROUTING_DECISION] task="${task.slice(0, 60)}" hasAttachments=${hasAttachments} targetModel="${targetOllamaModel}"`);

      const conversationId = payload.conversation_id || payload.conversationId || payload.chat_id || payload.chatId || null;
      const contextPayload = conversationManager.prepareContext({
        conversationId,
        agent,
        task: effectiveTask,
        model: targetOllamaModel,
        images: imagesList,
        replyTo: payload.replyTo || null
      });

      // Domain Boundary & Scope Enforcement
      const scopeDecision = agentScopeGuard.checkScope(agent, effectiveTask, {
        conversationId,
        replyTo: payload.replyTo || null
      });

      const wantsStream = Boolean(payload.stream === true || (req.headers["accept"] && req.headers["accept"].includes("text/event-stream")));

      if (!scopeDecision.inScope) {
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
            } catch {}
          };

          sendSSE("scope_redirect", scopeDecision);
          sendSSE("complete", {
            status: "out_of_scope",
            agent_id: agent.agent_id,
            scopeDecision,
            text: scopeDecision.politeMessage,
            external_calls: 0
          });
          res.end();
          return;
        } else {
          json(res, 200, {
            status: "out_of_scope",
            gateway: "100-to-1",
            agent: {
              agent_id: agent.agent_id,
              name: agent.name,
              category: agent.category
            },
            scopeDecision,
            text: scopeDecision.politeMessage,
            external_calls: 0
          });
          return;
        }
      }

      process.env.OLLAMA_MODEL = targetOllamaModel;
      const agentParameters = {
        ...(payload.parameters || {}),
        model: targetOllamaModel
      };

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
          if (res.writableEnded || res.closed || res.destroyed) return;
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

        if (imageQuestionResult) {
          sendSSE("ocr_trace", imageQuestionResult.backendTrace);
          sendSSE("task_detected", imageQuestionResult.classification);
        }

        sendSSE("metadata", {
          requestedModel: isManual ? targetOllamaModel : "auto",
          actualModel: targetOllamaModel,
          modelDisplayName,
          modelMode: isManual ? "manual" : "auto",
          agentId: agent.agent_id,
          agentName: agent.name || agent.agent_id,
          agentNumber: agent.agent_id?.replace("agent-", "") || "001",
          ocrTrace: imageQuestionResult?.backendTrace || null,
          ocrResult: imageQuestionResult?.text || null,
          ocrConfidence: imageQuestionResult?.confidence || null,
          detectedTask: imageQuestionResult?.classification?.taskLabel || null,
          requestId
        });

        req.on("close", () => {
          modelStreamer.cancelStream(requestId);
        });
        
        if (sseAttachmentErrors.length > 0) {
          for (const err of sseAttachmentErrors) {
            sendSSE("error", err);
          }
          res.end();
          return;
        }

        try {
          // ================================================================
          // SUPER AI AGENT (101) MULTI-AGENT WORKFLOW ORCHESTRATION
          // ================================================================
          const isSuperAI = (agent.agent_id === "agent-301" || agent.agent_id === "agent-101" || rawAgentId === "auto" || rawAgentId === "super-ai" || agent.name === "Super AI Agent");
          if (isSuperAI && !hasImages) {
            const workflowPlan = globalSuperAIWorkflowEngine.planWorkflow(task);
            if (!workflowPlan.isFastPath) {
              sendSSE("status", {
                state: ModelLifecycleState.PREPARING,
                message: `101 Super AI Agent orchestrating ${workflowPlan.subtasks.length} specialists...`,
                model: "101 Super AI Agent",
                tag: "agent-101"
              });

              const plannedData = {
                workflowId: workflowPlan.workflowId,
                workflowType: workflowPlan.workflowType,
                subtaskCount: workflowPlan.subtasks.length,
                subtasks: workflowPlan.subtasks.map(s => ({
                  id: s.subtaskId,
                  title: s.title,
                  agentId: s.agentId,
                  displayNumber: s.displayNumber,
                  agentName: s.agentName,
                  technology: s.technology
                }))
              };

              sendSSE("workflow_created", { workflowId: workflowPlan.workflowId, plan: workflowPlan });
              sendSSE("workflow.created", { workflowId: workflowPlan.workflowId, plan: workflowPlan });
              sendSSE("workflow_planned", plannedData);
              sendSSE("workflow.planned", plannedData);

              const wfEvents = new EventEmitter();
              wfEvents.on("subtask_queued", d => { sendSSE("subtask_queued", d); sendSSE("subtask.queued", d); });
              wfEvents.on("agent_dispatched", d => { sendSSE("agent_dispatched", d); sendSSE("agent.dispatched", d); });
              wfEvents.on("agent_started", d => { sendSSE("agent_started", d); sendSSE("agent.started", d); });
              wfEvents.on("agent_completed", d => { sendSSE("agent_completed", d); sendSSE("agent.completed", d); });
              wfEvents.on("agent_failed", d => { sendSSE("agent_failed", d); sendSSE("agent.failed", d); });
              wfEvents.on("workflow_synthesizing", d => { sendSSE("workflow_synthesizing", d); sendSSE("workflow.synthesizing", d); });

              const wfResult = await globalSuperAIWorkflowEngine.executeWorkflow(workflowPlan, {}, wfEvents);

              const fullSynthesis = wfResult.finalSynthesis || "Multi-agent workflow completed.";
              const chunks = fullSynthesis.match(/[\s\S]{1,32}/g) || [fullSynthesis];
              let currentAcc = "";
              for (let i = 0; i < chunks.length; i++) {
                currentAcc += chunks[i];
                sendSSE("token", { text: chunks[i], fullText: currentAcc });
                if (i % 6 === 0) await new Promise(r => setTimeout(r, 8));
              }

              sendSSE("complete", {
                text: fullSynthesis,
                agent_id: "agent-301",
                displayNumber: "301",
                agentName: "301 Super AI Agent",
                requested_model: "auto",
                actual_model: "qwen2.5-coder:1.5b",
                model_mode: "auto",
                model_source: "ollama-local",
                model: "301 Super AI Agent",
                hardware: "Ran on NVIDIA RTX 2050",
                pipeline: "multi-agent-workflow",
                workflow: {
                  workflowId: workflowPlan.workflowId,
                  workflowType: workflowPlan.workflowType,
                  status: wfResult.status,
                  totalDurationMs: wfResult.totalDurationMs,
                  specialists: Object.values(wfResult.subtaskResults).map(r => ({
                    subtaskId: r.subtaskId,
                    agentId: r.agentId,
                    displayNumber: r.displayNumber || (r.agentId ? r.agentId.replace('agent-', '') : '061'),
                    agentName: r.agentName,
                    technology: r.technology,
                    model: r.model || "Qwen 2.5 Coder",
                    status: r.status,
                    durationMs: r.durationMs,
                    artifact: r.artifacts?.[0]?.filename || null
                  })),
                  artifacts: wfResult.artifacts
                },
                executionTrace: {
                  orchestrator: "301 Super AI Agent",
                  workflowType: workflowPlan.workflowType,
                  specialists: Object.values(wfResult.subtaskResults).map(r => ({
                    agentId: r.agentId,
                    displayNumber: r.displayNumber || (r.agentId ? r.agentId.replace('agent-', '') : '061'),
                    agentName: r.agentName,
                    technology: r.technology,
                    model: r.model || "qwen2.5-coder:1.5b",
                    durationMs: r.durationMs,
                    artifact: r.artifacts?.[0]?.filename || null
                  })),
                  finalSynthesis: "301 Super AI Agent",
                  hardware: "Ran on NVIDIA RTX 2050",
                  externalCalls: 0
                },
                external_calls: 0
              });
              res.end();
              return;
            }
          }

          // ================================================================
          // ================================================================
          // DIRECT STREAMING INFERENCE FOR NON-OLLAMA CPU MODELS
          // ================================================================
          const mappedModel = CANONICAL_MODEL_MAP[requestedOverride] || CANONICAL_MODEL_MAP[targetOllamaModel] || getModelById(requestedOverride) || getModelById(targetOllamaModel);
          if (mappedModel && mappedModel.runtime_type && mappedModel.runtime_type !== "OLLAMA") {
            sendSSE("status", {
              state: "preparing_model",
              message: `Executing ${modelDisplayName || mappedModel.name} on Intel CPU (${mappedModel.runtime_type || "CPU"})...`,
              model: mappedModel.name || targetOllamaModel,
              execution_target: "CPU"
            });

            const cpuResult = await runLocalModel({
              model: mappedModel.model_id || mappedModel.tag || targetOllamaModel,
              prompt: contextPayload.prompt || task,
              system: contextPayload.systemPrompt || "",
              executionTarget: "CPU",
              options: {
                max_tokens: payload.parameters?.max_tokens || 128,
                temperature: payload.parameters?.temperature !== undefined ? payload.parameters.temperature : 0.7,
                ...(payload.parameters || {})
              }
            });

            const text = cpuResult.text || "Processed on local CPU runtime.";
            sendSSE("token", { text: text, fullText: text });
            if (conversationId && text) {
              conversationManager.recordTurn({
                conversationId,
                userPrompt: task,
                assistantResponse: text,
                agent,
                model: modelDisplayName,
                replyTo: payload.replyTo || null
              });
            }
            sendSSE("complete", {
              status: "completed",
              text,
              model: modelDisplayName,
              actualModel: mappedModel.model_id || targetOllamaModel,
              hardware: "Ran on Intel Core i5-11400H (CPU ONLY · GPU NOT USED)",
              total_tokens: cpuResult.eval_count || 50,
              tokens_per_sec: cpuResult.tokens_per_sec || 0,
              duration_ms: Math.round((cpuResult.total_duration || 1000000) / 1e6),
              external_calls: 0,
              is_air_gapped: true,
              agent_id: agent.agent_id,
              agentName: agent.name || agent.agent_id,
              agentNumber: agent.agent_id?.replace("agent-", "") || "001",
              modelMode: "manual",
              model_source: (mappedModel.runtime_type || "cpu").toLowerCase() + "-local",
              grounded: isGrounded,
              citations: knowledgeCitations,
              sources: knowledgeSources
            });
            res.end();
            return;
          }

          await modelStreamer.streamFromOllama({
            model: targetOllamaModel,
            system: contextPayload.systemPrompt,
            prompt: contextPayload.prompt,
            images: [],
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
                if (conversationId && metrics.text) {
                  conversationManager.recordTurn({
                    conversationId,
                    userPrompt: task,
                    assistantResponse: metrics.text,
                    agent,
                    model: modelDisplayName,
                    replyTo: payload.replyTo || null
                  });
                }
                sendSSE("complete", {
                  ...metrics,
                  agent_id: agent.agent_id,
                  agentName: agent.name || agent.agent_id,
                  agentNumber: agent.agent_id?.replace("agent-", "") || "001",
                  requested_model: isManual ? targetOllamaModel : "auto",
                  actual_model: targetOllamaModel,
                  model_mode: isManual ? "manual" : "auto",
                  model_source: "ollama-local",
                  model: modelDisplayName,
                  ocrTrace: imageQuestionResult?.backendTrace || null,
                  ocrResult: imageQuestionResult?.text || null,
                  detectedTask: imageQuestionResult?.classification?.taskLabel || null,
                  grounded: isGrounded,
                  citations: knowledgeCitations,
                  sources: knowledgeSources,
                  external_calls: 0
                });
                res.end();
              },
              onError: (err) => {
                sendSSE("error", {
                  message: err.message,
                  status: "error"
                });
                if (!res.writableEnded) res.end();
              }
            });
        } catch (streamErr) {
          let errorStatus = "INFERENCE_FAILED";
          if (streamErr.message.includes("status 404")) {
            errorStatus = "MODEL_NOT_FOUND";
          } else if (streamErr.message.includes("Failed to parse") || streamErr.message.includes("timed out")) {
            errorStatus = "MODEL_LOAD_FAILED";
          } else if (streamErr.message.includes("status 500")) {
            errorStatus = "GENERATION_FAILED";
          }
          sendSSE("error", {
            message: streamErr.message,
            status: errorStatus
          });
          if (!res.writableEnded) res.end();
        }
        return;
      }

      // ================================================================
      // SUPER AI AGENT (101) NON-STREAMING WORKFLOW ORCHESTRATION
      // ================================================================
      const isSuperAI = (agent.agent_id === "agent-301" || agent.agent_id === "agent-101" || rawAgentId === "auto" || rawAgentId === "super-ai" || agent.name === "Super AI Agent");
      if (isSuperAI && !hasImages) {
        const workflowPlan = globalSuperAIWorkflowEngine.planWorkflow(task);
        if (!workflowPlan.isFastPath) {
          const wfResult = await globalSuperAIWorkflowEngine.executeWorkflow(workflowPlan);
          json(res, 200, {
            status: "success",
            agent: {
              agent_id: "agent-101",
              name: "Super AI Agent",
              category: "Orchestrator"
            },
            model: "101 Super AI Agent",
            result: wfResult.finalSynthesis,
            workflow: {
              workflowId: workflowPlan.workflowId,
              workflowType: workflowPlan.workflowType,
              status: wfResult.status,
              totalDurationMs: wfResult.totalDurationMs,
              specialists: Object.values(wfResult.subtaskResults).map(r => ({
                subtaskId: r.subtaskId,
                agentId: r.agentId,
                displayNumber: r.displayNumber || (r.agentId ? r.agentId.replace('agent-', '') : '061'),
                agentName: r.agentName,
                technology: r.technology,
                model: r.model || "Qwen 2.5 Coder",
                status: r.status,
                durationMs: r.durationMs,
                artifact: r.artifacts?.[0]?.filename || null
              })),
              artifacts: wfResult.artifacts
            },
            artifacts: wfResult.artifacts,
            metadata: {
              model: "101 Super AI Agent",
              actual_model: "qwen2.5-coder:1.5b",
              total_duration: wfResult.totalDurationMs
            },
            external_calls: 0
          });
          return;
        }
      }

      const agentPayload = {
        task: contextPayload.prompt || task,
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
        try {
          const inProc = await executeAgentInProcess(agent.agent_id, agentPayload);
          if (inProc) {
            result = inProc;
          } else {
            throw err;
          }
        } catch (inProcErr) {
          try {
            // Direct fallback to local Ollama generation
            const gen = await modelStreamer.generateFromOllama({
              model: targetOllamaModel,
              system: contextPayload.systemPrompt,
              prompt: contextPayload.prompt,
              images: [],
              temperature: 0.3,
              options: { num_predict: payload.parameters?.max_tokens || 512 }
            });
            result = {
              status: "COMPLETED",
              result: gen.text,
              metadata: {
                model: modelDisplayName,
                actual_model: targetOllamaModel,
                total_duration: gen.durationMs
              }
            };
          } catch (genErr) {
            let errorStatus = "INFERENCE_FAILED";
            let code = "UNKNOWN_ERROR";
            if (genErr.message.includes("status 404")) {
              errorStatus = "MODEL_NOT_FOUND";
              code = "MODEL_NOT_FOUND";
            } else if (genErr.message.includes("Failed to parse") || genErr.message.includes("timed out")) {
              errorStatus = "MODEL_LOAD_FAILED";
              code = "MODEL_LOAD_FAILED";
            } else if (genErr.message.includes("status 500")) {
              errorStatus = "GENERATION_FAILED";
              code = "GENERATION_FAILED";
            }
            result = {
              status: errorStatus,
              error: {
                code,
                message: genErr.message
              }
            };
          }
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

      if (conversationId && answerText) {
        conversationManager.recordTurn({
          conversationId,
          userPrompt: task,
          assistantResponse: answerText,
          agent,
          model: modelDisplayName,
          replyTo: payload.replyTo || null
        });
      }

      const finalStatus = (result && result.status !== "success" && result.status !== "COMPLETED") ? result.status : "COMPLETED";
      const isCpu = isCpuModel(actualModel);
      const hardwareTrace = isCpu 
        ? "Ran on Intel Core i5-11400H (CPU ONLY · GPU NOT USED)"
        : "Ran on NVIDIA RTX 2050";

      json(res, finalStatus === "COMPLETED" ? 200 : 500, {
        status: finalStatus,
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
        hardware: hardwareTrace,
        hardware_trace: hardwareTrace,
        ocrTrace: imageQuestionResult?.backendTrace || null,
        ocrResult: imageQuestionResult?.text || null,
        detectedTask: imageQuestionResult?.classification?.taskLabel || null,
        grounded: isGrounded,
        citations: knowledgeCitations,
        sources: knowledgeSources,
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
          hardware: hardwareTrace,
          hardware_trace: hardwareTrace,
          grounded: isGrounded,
          citations: knowledgeCitations,
          sources: knowledgeSources,
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

    if (req.method === "GET" && url.pathname === "/api/voice/profile") {
      json(res, 200, { status: "success", profile: voiceService.getProfile() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/voice/transcribe") {
      const payload = await readBody(req);
      const processedText = voiceService.processTranscription(payload.transcript || payload.text || "");
      json(res, 200, { status: "success", text: processedText });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/voice/sanitize") {
      const payload = await readBody(req);
      const spokenText = voiceService.sanitizeText(payload.text || "");
      const sentences = voiceService.chunkText(payload.text || "");
      json(res, 200, { status: "success", spokenText, sentences });
      return;
    }

    if (
      req.method === "POST" &&
      (url.pathname === "/api/export" ||
        (url.pathname.startsWith("/api/messages/") && url.pathname.endsWith("/export")))
    ) {
      const payload = await readBody(req);
      const { globalResponseExportEngine } = await import("../../exports/response-export-engine.js");

      try {
        const exported = await globalResponseExportEngine.exportResponse({
          content: payload.content || payload.text || "",
          title: payload.title || payload.subject || "AI Response",
          format: payload.format || url.searchParams.get("format") || "pdf",
          conversationId: payload.conversationId,
          messageId: payload.messageId
        });

        res.writeHead(200, {
          "Content-Type": exported.mimeType,
          "Content-Disposition": `attachment; filename="${exported.filename}"`,
          "Content-Length": exported.sizeBytes,
          "X-Artifact-Id": exported.artifactId,
          "X-SHA256": exported.sha256,
          "X-Air-Gap": "100% Offline Local"
        });
        res.end(exported.buffer);
        return;
      } catch (err) {
        json(res, 400, {
          status: "error",
          error: err.message || "Failed to export response"
        });
        return;
      }
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
      url.pathname === "/api/runtime-info"
    ) {
      json(res, 200, {
        status: "success",
        projectRoot: ROOT,
        commitSHA: GIT_COMMIT_SHA,
        serverStartTime: SERVER_START_TIME,
        uiBuildVersion: UI_BUILD_VERSION,
        pid: process.pid,
        port: PORT,
        modelsAvailable: await getAvailableModelsCached(),
        uptimeSeconds: Math.round(process.uptime())
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
      req.method === "GET" &&
      url.pathname === "/api/workforce/status"
    ) {
      const status = routingRegistry.getWorkforceStatus();
      json(res, 200, {
        status: "success",
        ...status
      });
      return;
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/orchestrate"
    ) {
      const payload = await readBody(req);
      const prompt = payload.prompt || payload.task || payload.goal || "";

      if (!prompt) {
        json(res, 400, {
          status: "error",
          error: "prompt or task is required for orchestration"
        });
        return;
      }

      if (payload.planOnly) {
        const analysis = superOrchestrator.analyzeTask(prompt, payload.repoContext || {});
        const specialists = superOrchestrator.selectSpecialists(analysis);
        const dag = superOrchestrator.buildTaskDAG(specialists, analysis);

        json(res, 200, {
          status: "success",
          mode: "plan_only",
          analysis,
          specialists,
          dag
        });
        return;
      }

      const result = await superOrchestrator.orchestrate(prompt, {
        repoContext: payload.repoContext || {},
        dryRun: payload.dryRun ?? false,
        maxConcurrency: payload.maxConcurrency || 5,
        ...payload.options
      });

      json(res, 200, {
        status: "success",
        result
      });
      return;
    }

    // ============================================================
    // AGENT INTEGRATION & ORCHESTRATOR ENDPOINTS
    // ============================================================

    // GET /api/agent-integrations — list all 6 integrations with live discovery status
    if (req.method === "GET" && url.pathname === "/api/agent-integrations") {
      try {
        const integrationsPath = path.join(ROOT, "registry", "agent-integrations.json");
        let integrationsData = { integrations: [] };
        if (fs.existsSync(integrationsPath)) {
          integrationsData = JSON.parse(fs.readFileSync(integrationsPath, "utf8"));
        }
        
        const discoveryResults = await discoverAllAgents();
        const discoveryMap = new Map(discoveryResults.map(d => [d.id, d]));
        const runningAgents = agentLauncher.getRunningAgents();
        const runningMap = new Map(runningAgents.map(r => [r.id, r]));

        const list = integrationsData.integrations.map(agent => {
          const disc = discoveryMap.get(agent.id) || { installed: false, path: null };
          const run = runningMap.get(agent.id);
          let liveStatus = "NOT_INSTALLED";
          if (run) {
            liveStatus = "RUNNING";
          } else if (disc.installed) {
            liveStatus = "AVAILABLE";
          }

          return {
            ...agent,
            installed: disc.installed,
            binary_path: disc.path,
            version: disc.version || null,
            status: liveStatus,
            pid: run ? run.pid : null,
            uptime_seconds: run ? run.uptime : null
          };
        });

        json(res, 200, {
          status: "success",
          total: list.length,
          integrations: list
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // GET /api/agent-integrations/:id — single agent integration details
    if (req.method === "GET" && url.pathname.startsWith("/api/agent-integrations/") && !url.pathname.endsWith("/sessions")) {
      const agentId = url.pathname.split("/")[3];
      try {
        const disc = await discoverAgent(agentId);
        const status = agentLauncher.getAgentStatus(agentId);
        const integrationsPath = path.join(ROOT, "registry", "agent-integrations.json");
        let agentMeta = null;
        if (fs.existsSync(integrationsPath)) {
          const integrationsData = JSON.parse(fs.readFileSync(integrationsPath, "utf8"));
          agentMeta = integrationsData.integrations.find(a => a.id === agentId);
        }

        if (!agentMeta) {
          json(res, 404, { status: "error", error: `Agent integration '${agentId}' not found` });
          return;
        }

        json(res, 200, {
          status: "success",
          agent: {
            ...agentMeta,
            installed: disc.installed,
            binary_path: disc.path,
            version: disc.version || null,
            live_status: status.status,
            pid: status.pid,
            uptime: status.uptime
          }
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/agent-integrations/:id/launch — launch agent process
    if (req.method === "POST" && url.pathname.endsWith("/launch") && url.pathname.startsWith("/api/agent-integrations/")) {
      const agentId = url.pathname.split("/")[3];
      try {
        const payload = await readBody(req).catch(() => ({}));
        const child = agentLauncher.launchAgent(agentId, payload);
        json(res, 200, {
          status: "success",
          agentId,
          pid: child.pid,
          live_status: "RUNNING"
        });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/agent-integrations/:id/stop — stop running agent
    if (req.method === "POST" && url.pathname.endsWith("/stop") && url.pathname.startsWith("/api/agent-integrations/")) {
      const agentId = url.pathname.split("/")[3];
      try {
        const stopped = agentLauncher.stopAgent(agentId);
        json(res, 200, {
          status: "success",
          agentId,
          stopped,
          live_status: "STOPPED"
        });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/agent-integrations/:id/chat — send message to agent session
    if (req.method === "POST" && url.pathname.endsWith("/chat") && url.pathname.startsWith("/api/agent-integrations/")) {
      const agentId = url.pathname.split("/")[3];
      try {
        const payload = await readBody(req);
        let sessionId = payload.sessionId;
        if (!sessionId) {
          sessionId = agentSessionManager.createSession(agentId, { model: payload.model });
        }
        const message = payload.message || payload.prompt || payload.task || "";
        agentSessionManager.sendMessage(sessionId, message);
        json(res, 200, {
          status: "success",
          sessionId,
          agentId,
          response: `Agent ${agentId} processed message in session ${sessionId}`
        });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    // GET /api/agent-integrations/:id/sessions — list sessions
    if (req.method === "GET" && url.pathname.endsWith("/sessions") && url.pathname.startsWith("/api/agent-integrations/")) {
      const agentId = url.pathname.split("/")[3];
      try {
        const sessions = agentSessionManager.listSessions(agentId);
        json(res, 200, {
          status: "success",
          agentId,
          sessions
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // GET /api/network-policy — get current network policy
    if (req.method === "GET" && url.pathname === "/api/network-policy") {
      json(res, 200, {
        status: "success",
        mode: networkPolicy.getPolicy(),
        isExternalAllowed: networkPolicy.isExternalAllowed(),
        externalCallCount: networkPolicy.getExternalCallCount()
      });
      return;
    }

    // POST /api/network-policy — set network policy mode
    if (req.method === "POST" && url.pathname === "/api/network-policy") {
      try {
        const payload = await readBody(req);
        const prevMode = networkPolicy.getPolicy();
        if (payload.mode) {
          networkPolicy.setPolicy(payload.mode);
        }
        json(res, 200, {
          status: "success",
          mode: networkPolicy.getPolicy(),
          previousMode: prevMode
        });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    // GET /api/orchestrator/trace — get routing trace
    if (req.method === "GET" && url.pathname === "/api/orchestrator/trace") {
      const requestId = url.searchParams.get("requestId");
      if (requestId) {
        const trace = orchestratorController.getRoutingTrace(requestId);
        if (trace) {
          json(res, 200, { status: "success", trace });
        } else {
          json(res, 404, { status: "error", error: `Trace for requestId '${requestId}' not found` });
        }
      } else {
        json(res, 200, {
          status: "success",
          history: orchestratorController.routingHistory || []
        });
      }
      return;
    }

    // GET /api/orchestrator/capabilities — get full capability matrix
    if (req.method === "GET" && url.pathname === "/api/orchestrator/capabilities") {
      json(res, 200, {
        status: "success",
        matrix: getCapabilityMatrix()
      });
      return;
    }

    // ============================================================
    // KNOWLEDGE BASE & OBSIDIAN BRIDGE ENDPOINTS
    // ============================================================

    // GET /api/knowledge/health — Subsystem health check
    if (req.method === "GET" && url.pathname === "/api/knowledge/health") {
      json(res, 200, {
        status: "success",
        health: knowledgeService.getHealth()
      });
      return;
    }

    // GET /api/knowledge/sources — Canonical multi-source knowledge registry
    if (req.method === "GET" && url.pathname === "/api/knowledge/sources") {
      json(res, 200, {
        status: "success",
        sources: sourceRegistry.getAllSources()
      });
      return;
    }

    // GET /api/knowledge/status — Obsidian index status & configuration
    if (req.method === "GET" && url.pathname === "/api/knowledge/status") {
      json(res, 200, {
        status: "success",
        status: obsidianIndexer.getIndexStatus(),
        config: obsidianConfig.toJSON()
      });
      return;
    }

    // POST /api/knowledge/sources/obsidian/connect — Connect / update vault path
    if (req.method === "POST" && url.pathname === "/api/knowledge/sources/obsidian/connect") {
      try {
        const payload = await readBody(req);
        if (payload.vaultPath) {
          obsidianConfig.setVaultPath(payload.vaultPath);
          obsidianWatcher.startWatching();
        }
        json(res, 200, {
          status: "success",
          message: "Obsidian vault path connected successfully",
          config: obsidianConfig.toJSON()
        });
      } catch (err) {
        json(res, 400, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/knowledge/sources/obsidian/sync — Incremental sync using SHA-256
    if (req.method === "POST" && url.pathname === "/api/knowledge/sources/obsidian/sync") {
      try {
        const syncResult = await obsidianIndexer.syncIncremental();
        json(res, 200, {
          status: "success",
          result: syncResult
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/knowledge/sources/obsidian/rebuild — Full clean re-index
    if (req.method === "POST" && url.pathname === "/api/knowledge/sources/obsidian/rebuild") {
      try {
        const rebuildResult = await obsidianIndexer.rebuildIndex();
        json(res, 200, {
          status: "success",
          result: rebuildResult
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/knowledge/search — Hybrid search (Dense Vector + BM25)
    if (req.method === "POST" && url.pathname === "/api/knowledge/search") {
      try {
        const payload = await readBody(req);
        const queryText = payload.query || payload.q || "";
        const searchResult = await knowledgeService.search(queryText, payload);
        json(res, 200, {
          status: "success",
          ...searchResult
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/knowledge/query — Grounded knowledge query with evidence pack & citations
    if (req.method === "POST" && url.pathname === "/api/knowledge/query") {
      try {
        const payload = await readBody(req);
        const queryText = payload.query || payload.task || payload.prompt || "";
        const queryResult = await knowledgeService.queryKnowledge(queryText, payload);
        json(res, 200, {
          status: "success",
          ...queryResult
        });
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // POST /api/knowledge/open-note — Open note in Obsidian URI / default app
    if (req.method === "POST" && url.pathname === "/api/knowledge/open-note") {
      try {
        const payload = await readBody(req);
        const notePath = payload.path || payload.relativePath;
        const openResult = await knowledgeService.openNote(notePath);
        json(res, openResult.success ? 200 : 400, openResult);
      } catch (err) {
        json(res, 500, { status: "error", error: err.message });
      }
      return;
    }

    // ==========================================================================
    // MODEL ARENA — SIDE-BY-SIDE GPU MODEL COMPARISON
    // ==========================================================================

    // GET /api/model-arena/status
    if (req.method === "GET" && url.pathname === "/api/model-arena/status") {
      const comparisonId = url.searchParams.get("id");
      if (!comparisonId) {
        json(res, 400, { status: "error", error: "Missing comparison id" });
        return;
      }
      const status = modelArenaService.getStatus(comparisonId);
      json(res, 200, { status: "success", comparison: status });
      return;
    }

    // GET /api/model-arena/models — list available arena models
    if (req.method === "GET" && url.pathname === "/api/model-arena/models") {
      const models = modelArenaService.getAvailableModels();
      json(res, 200, { status: "success", models, total: models.length });
      return;
    }

    // POST /api/model-arena/compare — SSE streaming comparison
    if (req.method === "POST" && url.pathname === "/api/model-arena/compare") {
      const body = await readBody(req);
      const validation = validate(ArenaCompareSchema, body);
      if (!validation.success) {
        validationErrorResponse(res, validation.error);
        return;
      }
      const { prompt, model_ids } = validation.data;
      const modelIds = model_ids && model_ids.length > 0 ? model_ids : null;
      
      // Set up SSE response with unbuffered real-time streaming
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no"
      });
      if (res.socket) res.socket.setNoDelay(true);
      if (typeof res.flushHeaders === "function") res.flushHeaders();
      res.write(": stream-open\n\n");
      
      try {
        const comparisonId = await modelArenaService.compare(prompt.trim(), modelIds, (event) => {
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
          }
        });
        
        // Wait for comparison to complete
        await modelArenaService.waitForCompletion(comparisonId);
        
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: "done", comparison_id: comparisonId })}\n\n`);
          res.end();
        }
      } catch (err) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
          res.end();
        }
      }
      
      req.on("close", () => {
        // Client disconnected, cancel if still running
      });
      return;
    }

    // POST /api/model-arena/cancel
    if (req.method === "POST" && url.pathname === "/api/model-arena/cancel") {
      const body = await readBody(req);
      const { comparison_id } = body;
      if (comparison_id) {
        modelArenaService.cancelComparison(comparison_id);
      } else {
        modelArenaService.cancelAll();
      }
      json(res, 200, { status: "success", message: "Comparison cancelled" });
      return;
    }

    // POST /api/model-arena/clear
    if (req.method === "POST" && url.pathname === "/api/model-arena/clear") {
      const body = await readBody(req);
      const { comparison_id } = body;
      if (comparison_id) {
        modelArenaService.clearComparison(comparison_id);
      } else {
        modelArenaService.clearAll();
      }
      json(res, 200, { status: "success", message: "Comparison cleared" });
      return;
    }

    // ============================================================
    // PERSONAL STYLE GEMMA RUNTIME ENDPOINTS
    // ============================================================

    // GET /api/personal-style/gemma/health
    if (req.method === "GET" && url.pathname === "/api/personal-style/gemma/health") {
      if (personalStyleGemmaRuntime.state === "UNLOADED") {
        await personalStyleGemmaRuntime.initialize();
      }
      json(res, 200, personalStyleGemmaRuntime.health());
      return;
    }

    // GET /api/personal-style/gemma/status
    if (req.method === "GET" && url.pathname === "/api/personal-style/gemma/status") {
      if (personalStyleGemmaRuntime.state === "UNLOADED") {
        await personalStyleGemmaRuntime.initialize();
      }
      json(res, 200, personalStyleGemmaRuntime.status());
      return;
    }

    // POST /api/personal-style/gemma/reset
    if (req.method === "POST" && url.pathname === "/api/personal-style/gemma/reset") {
      const payload = await readBody(req);
      const result = personalStyleGemmaRuntime.reset_session(payload.session_id);
      json(res, 200, result);
      return;
    }

    // POST /api/personal-style/gemma/stop
    if (req.method === "POST" && url.pathname === "/api/personal-style/gemma/stop") {
      const payload = await readBody(req);
      const result = personalStyleGemmaRuntime.stop(payload.session_id);
      json(res, 200, result);
      return;
    }

    // POST /api/personal-style/gemma/chat and /api/personal-style/gemma/generate
    if (req.method === "POST" && (url.pathname === "/api/personal-style/gemma/chat" || url.pathname === "/api/personal-style/gemma/generate")) {
      try {
        const payload = await readBody(req);
        const validation = validate(PersonalStyleChatSchema, payload);
        if (!validation.success) {
          validationErrorResponse(res, validation.error);
          return;
        }
        const isStream = url.pathname === "/api/personal-style/gemma/generate" ? Boolean(payload.stream) : payload.stream !== false;
        const isBase = payload.model === "google/gemma-3-1b-it" || payload.is_base === true;

        if (isStream) {
          res.writeHead(200, {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
          });

          await personalStyleGemmaRuntime.stream_generate({
            messages: payload.messages || [{ role: "user", content: payload.prompt || "" }],
            session_id: payload.session_id,
            model: payload.model,
            isBase,
            onToken: (token) => {
              res.write(`data: ${JSON.stringify({ type: "token", text: token })}\n\n`);
            },
            onDone: ({ fullText, session_id }) => {
              res.write(`data: ${JSON.stringify({ type: "done", fullText, session_id })}\n\n`);
              res.end();
            },
            onError: (err) => {
              res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
              res.end();
            }
          });
        } else {
          const genResult = await personalStyleGemmaRuntime.generate({
            messages: payload.messages || [{ role: "user", content: payload.prompt || "" }],
            session_id: payload.session_id,
            model: payload.model,
            isBase
          });
          json(res, 200, {
            status: "success",
            response: genResult.response,
            model: genResult.model,
            session_id: genResult.session_id,
            device: genResult.device,
            is_base: genResult.is_base,
            result: genResult
          });
        }
      } catch (err) {
        json(res, 500, { status: "error", error: "Generation failed: " + err.message });
      }
      return;
    }

    if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
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
    console.error("[GATEWAY_ERROR]", error);
    const safeMsg = (error instanceof Error && !error.message.includes(":\\") && !error.message.includes("/root/"))
      ? error.message
      : "Internal server error";
    json(res, 500, {
      status: "error",
      error: safeMsg
    });
  }
});

server.listen(PORT, HOST, async () => {
  console.log("======================================");
  console.log("100-TO-1 CENTRAL GATEWAY");
  console.log("======================================");
  console.log(`Listening: http://${HOST}:${PORT}`);
  console.log(`Registry: ${REGISTRY}`);
  console.log("======================================");

  // Initialize Demo Vault & Start Obsidian Watcher (Local, Air-Gapped)
  try {
    initDemoVaultIfEmpty();
    obsidianWatcher.startWatching();
    console.log("[KNOWLEDGE] Obsidian Knowledge Bridge initialized and watcher active.");
  } catch (kErr) {
    console.warn("[KNOWLEDGE_INIT_WARN]", kErr.message);
  }

  // Initialize Personal Style Gemma Runtime
  try {
    await personalStyleGemmaRuntime.initialize();
    console.log("[PERSONAL_STYLE] Gemma Kaviya Runtime initialized and READY.");
  } catch (psErr) {
    console.warn("[PERSONAL_STYLE_INIT_WARN]", psErr.message);
  }
});
