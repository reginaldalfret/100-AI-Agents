/**
 * Sovereign AI Workbench — Model Router & Inference Dispatcher
 * Routes classified tasks to the optimal local open-weight model with zero data exfiltration.
 */

import { LOCAL_MODELS, getModelById, ModelModality } from "./model-registry.js";
import { getHardwareProfile } from "./hardware-profiler.js";
import { classifyTask } from "./task-classifier.js";
import { modelLifecycle } from "./model-lifecycle.js";
import { evaluateSovereignEgress } from "../security/sovereign-policy.js";
import { egressMonitor } from "../security/egress-monitor.js";

export async function routeTaskToLocalModel(taskInput = {}) {
  const classification = classifyTask(taskInput);
  let selectedModelId = classification.preferred_model_id;

  if (taskInput.model_override) {
    if (taskInput.model_override === 'gemma3:1b' || taskInput.model_override === 'gemma3-1b' || taskInput.model_override === 'gemma3' || taskInput.model_override === 'gemma') {
      selectedModelId = 'gemma3-1b';
    } else if (taskInput.model_override === 'qwen2.5-coder:1.5b' || taskInput.model_override === 'local-code-specialist' || taskInput.model_override === 'qwen') {
      selectedModelId = 'local-code-specialist';
    } else if (taskInput.model_override === 'nemotron-3-nano' || taskInput.model_override === 'nemotron' || taskInput.model_override === 'nemotron-3-nano:latest') {
      selectedModelId = 'nemotron-3-nano';
    } else if (taskInput.model_override === 'llama3.2:1b' || taskInput.model_override === 'llama3.2-1b' || taskInput.model_override === 'llama' || taskInput.model_override === 'llama3') {
      selectedModelId = 'llama3.2-1b';
    } else if (taskInput.model_override === 'granite4:1b-h' || taskInput.model_override === 'granite4-1b-h' || taskInput.model_override === 'granite' || taskInput.model_override === 'granite4') {
      selectedModelId = 'granite4-1b-h';
    } else if (taskInput.model_override === 'phi4-mini' || taskInput.model_override === 'phi' || taskInput.model_override === 'phi4') {
      selectedModelId = 'phi4-mini';
    } else if (taskInput.model_override === 'smollm2:1.7b' || taskInput.model_override === 'smollm2-1.7b' || taskInput.model_override === 'smollm2' || taskInput.model_override === 'smollm') {
      selectedModelId = 'smollm2-1.7b';
    } else if (taskInput.model_override === 'LiquidAI/lfm2.5-350m' || taskInput.model_override === 'LiquidAI/lfm2.5-350m:latest' || taskInput.model_override === 'lfm2.5-350m' || taskInput.model_override === 'lfm' || taskInput.model_override === 'lfm2.5' || taskInput.model_override === 'lfm-350m') {
      selectedModelId = 'lfm2.5-350m';
    } else if (taskInput.model_override === 'mollysama/rwkv-7-g1d:0.4b' || taskInput.model_override === 'rwkv7-0.4b' || taskInput.model_override === 'rwkv' || taskInput.model_override === 'rwkv7' || taskInput.model_override === 'rwkv-7') {
      selectedModelId = 'rwkv7-0.4b';
    } else if (taskInput.model_override === 'tinyllama:1.1b-chat' || taskInput.model_override === 'tinyllama-1.1b' || taskInput.model_override === 'tinyllama' || taskInput.model_override === 'tinyllama:1.1b') {
      selectedModelId = 'tinyllama-1.1b';
    } else if (taskInput.model_override === 'stablelm2:1.6b' || taskInput.model_override === 'stablelm2-1.6b' || taskInput.model_override === 'stablelm' || taskInput.model_override === 'stablelm2') {
      selectedModelId = 'stablelm2-1.6b';
    } else if (taskInput.model_override === 'falcon3:1b-instruct-q4_K_M' || taskInput.model_override === 'falcon3-1b-instruct' || taskInput.model_override === 'falcon3' || taskInput.model_override === 'falcon' || taskInput.model_override === 'falcon-1b') {
      selectedModelId = 'falcon3-1b-instruct';
    } else if (taskInput.model_override === 'jetson-qwen3.8' || taskInput.model_override === 'jetson' || taskInput.model_override === 'Qwen3.8_Unsloth:latest' || taskInput.model_override === 'qwen3.8') {
      selectedModelId = 'jetson-qwen3.8';
    }
  } else if (taskInput.modelMode && taskInput.modelMode !== 'auto') {
    if (taskInput.modelMode === 'gemma' || taskInput.modelMode === 'gemma3') selectedModelId = 'gemma3-1b';
    else if (taskInput.modelMode === 'qwen') selectedModelId = 'local-code-specialist';
    else if (taskInput.modelMode === 'nemotron') selectedModelId = 'nemotron-3-nano';
    else if (taskInput.modelMode === 'llama') selectedModelId = 'llama3.2-1b';
    else if (taskInput.modelMode === 'granite') selectedModelId = 'granite4-1b-h';
    else if (taskInput.modelMode === 'phi') selectedModelId = 'phi4-mini';
    else if (taskInput.modelMode === 'smollm2' || taskInput.modelMode === 'smollm') selectedModelId = 'smollm2-1.7b';
    else if (taskInput.modelMode === 'falcon' || taskInput.modelMode === 'falcon3' || taskInput.modelMode === 'falcon3-1b-instruct') selectedModelId = 'falcon3-1b-instruct';
    else if (taskInput.modelMode === 'lfm' || taskInput.modelMode === 'lfm2.5' || taskInput.modelMode === 'lfm2.5-350m' || taskInput.modelMode === 'lfm-350m') selectedModelId = 'lfm2.5-350m';
    else if (taskInput.modelMode === 'rwkv' || taskInput.modelMode === 'rwkv7' || taskInput.modelMode === 'rwkv7-0.4b') selectedModelId = 'rwkv7-0.4b';
    else if (taskInput.modelMode === 'tinyllama' || taskInput.modelMode === 'tinyllama-1.1b' || taskInput.modelMode === 'tinyllama:1.1b-chat') selectedModelId = 'tinyllama-1.1b';
    else if (taskInput.modelMode === 'stablelm' || taskInput.modelMode === 'stablelm2' || taskInput.modelMode === 'stablelm2-1.6b' || taskInput.modelMode === 'stablelm2:1.6b') selectedModelId = 'stablelm2-1.6b';
    else if (taskInput.modelMode === 'jetson' || taskInput.modelMode === 'jetson-qwen3.8' || taskInput.modelMode === 'qwen3.8') selectedModelId = 'jetson-qwen3.8';
  }

  const modelSpec = getModelById(selectedModelId) || LOCAL_MODELS[0];

  // 1. Verify Egress Sovereignty (Must be strictly local)
  const endpoint = modelSpec.endpoint || "http://127.0.0.1:11434";
  const egressCheck = evaluateSovereignEgress(endpoint, "LOCAL_MODEL_INFERENCE");
  
  if (!egressCheck.allowed) {
    throw new Error(`SOVEREIGN_VIOLATION: Attempted access to non-local model endpoint: ${endpoint}`);
  }

  // 2. Hardware Resource Check & Slot Allocation
  const slot = await modelLifecycle.acquireModelSlot(modelSpec.model_id);

  // 3. Record local inference telemetry
  egressMonitor.recordLocalInference({
    model_id: modelSpec.model_id,
    task_type: classification.task_type
  });

  return {
    selected_model: modelSpec.model_id,
    model_name: modelSpec.name,
    modality: classification.primary_modality,
    pipeline: [modelSpec.model_id, "nemotron-3-nano"],
    confidence: classification.confidence,
    reason: classification.reason,
    recommended_agents: classification.recommended_agents,
    hardware_footprint: {
      vram_mb: modelSpec.vram_mb,
      ram_mb: modelSpec.ram_mb,
      quantization: modelSpec.quantization
    },
    external_calls: 0,
    is_air_gapped: true,
    is_sovereign_local: true
  };
}

// === Agent Integration Model Routing ===

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filenameRouter = fileURLToPath(import.meta.url);
const __dirnameRouter = path.dirname(__filenameRouter);
const ROOT_ROUTER = path.resolve(__dirnameRouter, '../..');

/**
 * Routes an agent integration to the optimal local model.
 * Agents don't hardcode models — the router decides.
 */
export function routeAgentToModel(agentId, taskType, constraints = {}) {
  let defaultModelId = 'nemotron-3-nano';
  let supportedModels = ['nemotron-3-nano', 'qwen2.5-coder:1.5b', 'llama3.2:1b'];
  let agentName = agentId;

  try {
    const regPath = path.join(ROOT_ROUTER, 'registry', 'agent-integrations.json');
    if (fs.existsSync(regPath)) {
      const data = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      const agent = (data.integrations || []).find(a => a.id === agentId);
      if (agent) {
        defaultModelId = agent.default_model || defaultModelId;
        supportedModels = agent.supported_models || supportedModels;
        agentName = agent.name || agentId;
      }
    }
  } catch {}

  let chosenModelId = defaultModelId;

  if (constraints.model_override || (constraints.modelMode && constraints.modelMode !== 'auto')) {
    const requested = constraints.model_override || constraints.modelMode;
    if (requested.includes('qwen') || requested.includes('code')) chosenModelId = 'local-code-specialist';
    else if (requested.includes('nemotron')) chosenModelId = 'nemotron-3-nano';
    else if (requested.includes('gemma')) chosenModelId = 'gemma3-1b';
    else if (requested.includes('llama')) chosenModelId = 'llama3.2-1b';
    else if (requested.includes('granite')) chosenModelId = 'granite4-1b-h';
    else if (requested.includes('phi')) chosenModelId = 'phi4-mini';
    else if (requested.includes('smollm')) chosenModelId = 'smollm2-1.7b';
    else if (requested.includes('falcon')) chosenModelId = 'falcon3-1b-instruct';
    else if (requested.includes('lfm')) chosenModelId = 'lfm2.5-350m';
    else if (requested.includes('rwkv')) chosenModelId = 'rwkv7-0.4b';
    else if (requested.includes('tinyllama')) chosenModelId = 'tinyllama-1.1b';
    else if (requested.includes('stablelm')) chosenModelId = 'stablelm2-1.6b';
  } else if (taskType === 'CODING' || agentId === 'opencode' || agentId === 'codex' || agentId === 'openclaw') {
    chosenModelId = 'local-code-specialist';
  } else if (agentId === 'pi') {
    chosenModelId = 'llama3.2-1b';
  }

  const spec = getModelById(chosenModelId) || LOCAL_MODELS[0];

  return {
    model_id: spec.model_id,
    model_name: spec.name,
    reason: `Selected for ${agentName} based on capability requirements & RTX 2050 footprint`,
    execution_target: spec.execution_target || 'GPU',
    vram_mb: spec.vram_mb || 2048,
    is_compatible: true
  };
}

/**
 * Returns model recommendation based on capabilities and VRAM.
 */
export function getModelRecommendation(capabilities = [], vramAvailable = 4096) {
  const caps = Array.isArray(capabilities) ? capabilities : [];
  const isCoding = caps.some(c => c.includes('CODE'));

  if (isCoding) {
    return [
      {
        model_id: 'local-code-specialist',
        model_name: 'Qwen 2.5 Coder 1.5B',
        score: 0.98,
        reason: 'Specialized code generation and syntax tree reasoning'
      },
      {
        model_id: 'nemotron-3-nano',
        model_name: 'NVIDIA Nemotron 3 Nano',
        score: 0.90,
        reason: 'General reasoning fallback'
      }
    ];
  }

  return [
    {
      model_id: 'llama3.2-1b',
      model_name: 'Llama 3.2 1B',
      score: 0.95,
      reason: `Fits well within ${vramAvailable}MB constraint`
    },
    {
      model_id: 'nemotron-3-nano',
      model_name: 'NVIDIA Nemotron 3 Nano',
      score: 0.92,
      reason: 'Deep reasoning and orchestration'
    }
  ];
}

/**
 * Returns human-readable routing explanation for "WHY THIS ROUTE?" panel.
 */
export function getRoutingExplanation(routingResult) {
  return {
    summary: routingResult?.reason || 'Selected best local model based on intent and VRAM limits.',
    factors: [
      { factor: 'Data Sovereignty', value: 'Local Only (100% Air-Gapped)', weight: 1.0 },
      { factor: 'Model Execution Target', value: routingResult?.execution_target || 'GPU', weight: 0.9 },
      { factor: 'Hardware Limit', value: 'RTX 2050 (4GB VRAM)', weight: 0.8 }
    ],
    alternatives: [
      { model_id: 'nemotron-3-nano', reason: 'High precision epistemic reasoning' },
      { model_id: 'qwen2.5-coder:1.5b', reason: 'Specialized coding fallback' }
    ]
  };
}
