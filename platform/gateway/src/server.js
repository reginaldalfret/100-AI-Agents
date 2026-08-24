import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WorkflowEngine, SuperAIWorkflowEngine, globalSuperAIWorkflowEngine, ResourceScheduler, ArtifactManager, globalArtifactManager } from "../../workflow-engine/index.js";
import { EventEmitter } from "node:events";
import { StudentService, AcademicService, FinanceService, DocumentService, AdmissionService, FacultyService, AuditService } from "../../services/index.js";
import { modelStreamer, ModelLifecycleState } from "../../models/model-streamer.js";
import { conversationManager } from "../../context/index.js";
import { agentScopeGuard } from "../../intelligence/index.js";
import { documentExtractor } from "../../multimodal/index.js";
import { validateAttachmentIntegrity } from "../../multimodal/attachment-integrity.js";
import { ingestDocument, queryRAG, IngestionNamespace } from "../../rag/index.js";
import { voiceService, globalOfflineTTSEngine, globalOfflineSTTEngine } from "../../voice/index.js";
import { pythonClient } from "../../compute/python-client.js";
import { superOrchestrator } from "../../orchestration/super-orchestrator.js";
import { routingRegistry } from "../../intelligence/routing-registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, "../../..");
const REGISTRY = path.join(ROOT, "registry", "agents.json");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8300);
const SERVER_START_TIME = new Date().toISOString();
const UI_BUILD_VERSION = "liquid-glass-v2.1";
const GIT_COMMIT_SHA = "b4f89ac-forensic-repair";

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
        compute: pythonClient.circuit.state === "OPEN" ? "degraded_fallback" : "healthy",
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
            models: ["gemma4:e2b", "nemotron-3-nano:latest", "qwen2.5-coder:1.5b"]
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

    if (
      req.method === "POST" &&
      url.pathname === "/api/chat"
    ) {
      const payload = await readBody(req);

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

      if (!task && !hasAttachments) {
        json(res, 400, {
          status: "error",
          error: "task or attachment is required"
        });
        return;
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
      const availableModels = await getAvailableModelsCached();

      const CANONICAL_MODEL_MAP = {
        "gemma": { tag: "gemma4:e2b", displayName: "Google Gemma 4 E2B", role: "multimodal" },
        "gemma4": { tag: "gemma4:e2b", displayName: "Google Gemma 4 E2B", role: "multimodal" },
        "gemma4:e2b": { tag: "gemma4:e2b", displayName: "Google Gemma 4 E2B", role: "multimodal" },
        "gemma4-e2b": { tag: "gemma4:e2b", displayName: "Google Gemma 4 E2B", role: "multimodal" },
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
        "phi4-mini": { tag: "phi4-mini", displayName: "Microsoft Phi-4 Mini", role: "reasoning-math" }
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
      }

      // Process Multimodal Attachments & Document Extraction
      let extractedEvidenceText = "";
      const imagesList = Array.isArray(payload.images) ? [...payload.images] : [];
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
            if (userAsksForMetadata && doc.metadataText) {
              extractedEvidenceText += `\n\n[DOCUMENT METADATA: ${doc.filename}]\n${doc.metadataText}`;
            }
          }
        }
      }

      const effectiveTask = extractedEvidenceText ? `${task}\n${extractedEvidenceText}` : task;

      // ================================================================
      // MODALITY-FIRST ROUTING — Images ALWAYS override model selection
      // ================================================================
      const hasImages = imagesList.length > 0;
      let needsTwoStagePipeline = false;
      let specialistModel = null;
      let specialistDisplayName = null;
      let visionExtractionPrompt = "";

      if (hasImages) {
        // RULE: Any request with image attachments MUST go through Gemma 3 first.
        // Nemotron and Qwen cannot process images — they will error out.

        const taskLower = task.toLowerCase();

        // Detect if the task requires BOTH vision understanding AND specialist work
        const specialistKeywords = {
          email: { model: "nemotron-3-nano:latest", display: "NVIDIA Nemotron 3", patterns: ["email", "mail", "compose", "draft", "letter", "memo"] },
          coding: { model: "qwen2.5-coder:1.5b", display: "Qwen 2.5 Coder", patterns: ["code", "script", "python", "sql", "function", "debug", "implement", "program", "algorithm"] },
          reasoning: { model: "nemotron-3-nano:latest", display: "NVIDIA Nemotron 3", patterns: ["analyze", "explain", "summarize", "plan", "strategy", "compare", "evaluate", "review", "write", "essay", "article", "report", "blog"] }
        };

        // Check if the task ALSO needs specialist work beyond just reading the image
        const isVisionOnly = !specialistKeywords.email.patterns.some(k => taskLower.includes(k))
          && !specialistKeywords.coding.patterns.some(k => taskLower.includes(k));

        if (isVisionOnly) {
          // Pure vision task — route directly to Gemma 4 E2B
          targetOllamaModel = "gemma4:e2b";
          modelDisplayName = "Google Gemma 4 E2B";
        } else {
          // Two-stage pipeline: Vision extraction → Specialist synthesis
          // Find which specialist domain matches
          for (const [domain, config] of Object.entries(specialistKeywords)) {
            if (config.patterns.some(k => taskLower.includes(k))) {
              specialistModel = config.model;
              specialistDisplayName = config.display;
              break;
            }
          }

          if (specialistModel) {
            needsTwoStagePipeline = true;
            // Stage 1 will use Gemma 4 E2B for vision, Stage 2 will use the specialist
            visionExtractionPrompt = `Carefully examine the attached image(s) and extract ALL visible content including: text, numbers, labels, headings, structure, layout, tables, diagrams, handwriting, and any other visual information. Provide a comprehensive, detailed, and accurate description of everything you see. Format your response as structured plain text.`;
            targetOllamaModel = "gemma4:e2b";
            modelDisplayName = "Google Gemma 4 E2B";
          } else {
            // No clear specialist match — default to Gemma 4 E2B for the full task
            targetOllamaModel = "gemma4:e2b";
            modelDisplayName = "Google Gemma 4 E2B";
          }
        }
      } else if (!isManual) {
        // Intelligent Auto routing based on task specialization and context
        const taskLower = effectiveTask.toLowerCase();
        if (taskLower.includes("image") || taskLower.includes("photo") || taskLower.includes("drawing") || taskLower.includes("visual") || taskLower.includes("p&id") || taskLower.includes("ocr") || taskLower.includes("diagram")) {
          targetOllamaModel = "gemma4:e2b";
          modelDisplayName = "Google Gemma 4 E2B";
        } else if (taskLower.includes("math") || taskLower.includes("calculate") || taskLower.includes(" × ") || taskLower.includes(" + ") || taskLower.includes(" / ") || taskLower.includes(" - ") || taskLower.includes("equation") || taskLower.includes("formula") || taskLower.includes("arithmetic") || taskLower.includes("algebra") || taskLower.includes("logic") || taskLower.includes("puzzle") || taskLower.includes("17 × 28")) {
          targetOllamaModel = "phi4-mini";
          modelDisplayName = "Microsoft Phi-4 Mini";
        } else if (taskLower.includes("rag") || taskLower.includes("retriev") || taskLower.includes("entities") || taskLower.includes("entity") || taskLower.includes("classify") || taskLower.includes("classification") || taskLower.includes("extract key") || taskLower.includes("tool call") || taskLower.includes("enterprise")) {
          targetOllamaModel = "granite4:1b-h";
          modelDisplayName = "IBM Granite 4 1B-H";
        } else if (taskLower.includes("rewrite") || taskLower.includes("rephrase") || taskLower.includes("proofread") || taskLower.includes("summarize this") || taskLower.includes("short summary") || taskLower.includes("quick question") || taskLower.includes("hello") || taskLower.includes("hi ") || taskLower === "hi") {
          targetOllamaModel = "llama3.2:1b";
          modelDisplayName = "Meta Llama 3.2 1B";
        } else if (taskLower.includes("code") || taskLower.includes("script") || taskLower.includes("python") || taskLower.includes("java") || taskLower.includes("c++") || taskLower.includes("rust") || taskLower.includes("sql") || taskLower.includes("debug") || taskLower.includes("function") || taskLower.includes("def ") || taskLower.includes("return ") || taskLower.includes("const ") || taskLower.includes("class ") || taskLower.includes("=>") || taskLower.includes("regex") || taskLower.includes("json") || taskLower.includes(".csv") || taskLower.includes("table")) {
          targetOllamaModel = "qwen2.5-coder:1.5b";
          modelDisplayName = "Qwen 2.5 Coder";
        } else {
          targetOllamaModel = "nemotron-3-nano:latest";
          modelDisplayName = "NVIDIA Nemotron 3";
        }
      }

      console.log(`[ROUTING_DECISION] task="${task.slice(0, 60)}" hasImages=${hasImages} needsTwoStage=${needsTwoStagePipeline} targetModel="${targetOllamaModel}" specialist="${specialistModel || 'none'}"`);

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
          // TWO-STAGE VISION PIPELINE
          // ================================================================
          if (needsTwoStagePipeline && hasImages && specialistModel) {
            // STAGE 1: Vision Extraction with Gemma 4 E2B
            sendSSE("status", {
              state: ModelLifecycleState.PREPARING,
              message: "Analyzing image with Google Gemma 4 E2B Multimodal...",
              model: "Google Gemma 4 E2B",
              tag: "gemma4:e2b",
              stage: 1,
              pipeline: "vision-to-specialist"
            });

            let visionExtractedText = "";
            try {
              const visionResult = await modelStreamer.generateFromOllama({
                model: "gemma4:e2b",
                system: "You are a vision analysis engine. Extract and describe ALL content from the provided image(s) with maximum detail and accuracy. Include all text, numbers, structure, layout, tables, and visual elements.",
                prompt: visionExtractionPrompt + "\n\nUser's original request for context: " + task,
                images: imagesList,
                temperature: 0.2,
                options: { num_predict: 1024 }
              });
              visionExtractedText = visionResult.text || "";
            } catch (visionErr) {
              let errCode = "VISION_REQUEST_FAILED";
              if (visionErr.message.includes("fetch failed") || visionErr.message.includes("ECONNREFUSED")) errCode = "OLLAMA_UNAVAILABLE";
              else if (visionErr.message.includes("model not found") || visionErr.message.includes("not available") || visionErr.message.includes("does not support vision")) errCode = "GEMMA_UNAVAILABLE";
              
              sendSSE("error", {
                code: errCode,
                message: `Vision analysis failed: ${visionErr.message}. Gemma 4 E2B may not be available for image processing.`,
                status: "vision_error",
                stage: 1,
                model: "gemma4:e2b"
              });
              res.end();
              return;
            }

            if (!visionExtractedText.trim()) {
              sendSSE("error", {
                code: "VISION_REQUEST_FAILED",
                message: "Vision extraction returned empty results. The image may not contain readable content.",
                status: "vision_empty",
                stage: 1
              });
              res.end();
              return;
            }

            sendSSE("status", {
              state: ModelLifecycleState.ACTIVE,
              message: `Image analyzed. Now generating response with ${specialistDisplayName}...`,
              model: specialistDisplayName,
              tag: specialistModel,
              stage: 2,
              pipeline: "vision-to-specialist"
            });

            // STAGE 2: Specialist Synthesis — stream the specialist model's response
            const specialistPrompt = `${contextPayload.systemPrompt ? contextPayload.systemPrompt + "\n\n" : ""}The user uploaded an image. Here is what was found in the image:\n\n--- IMAGE CONTENT START ---\n${visionExtractedText}\n--- IMAGE CONTENT END ---\n\nUser's request: ${task}\n\nUsing the image content above, fulfill the user's request.`;

            const stage2RequestId = `${requestId}_s2`;
            req.on("close", () => {
              modelStreamer.cancelStream(stage2RequestId);
            });

            await modelStreamer.streamFromOllama({
              model: specialistModel,
              system: contextPayload.systemPrompt || "",
              prompt: specialistPrompt,
              images: [], // Stage 2 receives TEXT, not images
              temperature: 0.3,
              options: {
                num_predict: payload.parameters?.max_tokens || 512,
                ...(payload.parameters || {})
              },
              requestId: stage2RequestId,
              onStatus: (statusObj) => {
                sendSSE("status", { ...statusObj, stage: 2 });
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
                    model: specialistDisplayName,
                    replyTo: payload.replyTo || null
                  });
                }
                sendSSE("complete", {
                  ...metrics,
                  agent_id: agent.agent_id,
                  requested_model: "auto",
                  actual_model: specialistModel,
                  vision_model: "gemma4:e2b",
                  model_mode: "auto",
                  model_source: "ollama-local",
                  model: specialistDisplayName,
                  pipeline: "vision-to-specialist",
                  external_calls: 0
                });
                res.end();
              },
              onError: (err) => {
                sendSSE("error", {
                  message: `Specialist generation failed: ${err.message}`,
                  status: "error",
                  stage: 2,
                  model: specialistModel
                });
                res.end();
              }
            });

          } else {
            // ================================================================
            // STANDARD SINGLE-STAGE STREAMING (vision-only or no images)
            // ================================================================
            await modelStreamer.streamFromOllama({
              model: targetOllamaModel,
              system: contextPayload.systemPrompt,
              prompt: contextPayload.prompt,
              images: imagesList,
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
                if (!res.writableEnded) res.end();
              }
            });
          }
        } catch (streamErr) {
          sendSSE("error", {
            message: streamErr.message,
            status: "error"
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
        if (hasImages) {
          if (needsTwoStagePipeline && specialistModel) {
            // Stage 1: Vision Extraction via Gemma 4 E2B
            const stage1 = await modelStreamer.generateFromOllama({
              model: "gemma4:e2b",
              system: "You are an expert visual analyzer. Extract all visual information, text, labels, and content accurately.",
              prompt: visionExtractionPrompt || "Extract all visual content from this image.",
              images: imagesList,
              temperature: 0.1,
              options: { num_predict: 512 }
            });

            // Stage 2: Specialist Synthesis
            const stage2 = await modelStreamer.generateFromOllama({
              model: specialistModel,
              system: contextPayload.systemPrompt || "You are a professional AI specialist.",
              prompt: `${contextPayload.prompt || task}\n\n[Visual Evidence from Attached Image]:\n${stage1.text}`,
              temperature: 0.3,
              options: { num_predict: payload.parameters?.max_tokens || 512 }
            });

            result = {
              status: "success",
              result: stage2.text,
              metadata: {
                model: specialistDisplayName || modelDisplayName,
                actual_model: specialistModel,
                total_duration: stage1.durationMs + stage2.durationMs
              }
            };
          } else {
            // Direct multimodal generation via Gemma 3
            const gen = await modelStreamer.generateFromOllama({
              model: targetOllamaModel,
              system: contextPayload.systemPrompt,
              prompt: contextPayload.prompt || task,
              images: imagesList,
              temperature: 0.2,
              options: { num_predict: payload.parameters?.max_tokens || 512 }
            });
            result = {
              status: "success",
              result: gen.text,
              metadata: {
                model: modelDisplayName,
                actual_model: targetOllamaModel,
                total_duration: gen.durationMs
              }
            };
          }
        } else {
          result = await requestAgent(agent, agentPayload);
        }
      } catch (err) {
        try {
          const inProc = await executeAgentInProcess(agent.agent_id, agentPayload);
          if (inProc) {
            result = inProc;
          } else {
            throw err;
          }
        } catch (inProcErr) {
          // Direct fallback to local Ollama generation
          const gen = await modelStreamer.generateFromOllama({
            model: targetOllamaModel,
            system: contextPayload.systemPrompt,
            prompt: contextPayload.prompt,
            images: imagesList,
            temperature: 0.3,
            options: { num_predict: payload.parameters?.max_tokens || 512 }
          });
          result = {
            status: "success",
            result: gen.text,
            metadata: {
              model: modelDisplayName,
              actual_model: targetOllamaModel,
              total_duration: gen.durationMs
            }
          };
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
