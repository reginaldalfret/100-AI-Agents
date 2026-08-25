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
    } else if (taskInput.model_override === 'mobilellm-pro-1b' || taskInput.model_override === 'mobilellm-pro' || taskInput.model_override === 'mobilellm-1b' || taskInput.model_override === 'facebook/MobileLLM-Pro-1B') {
      selectedModelId = 'mobilellm-pro-1b';
    } else if (taskInput.model_override === 'mobilellm-350m' || taskInput.model_override === 'mobilellm' || taskInput.model_override === 'facebook/MobileLLM-350M') {
      selectedModelId = 'mobilellm-350m';
    } else if (taskInput.model_override === 'openelm-450m' || taskInput.model_override === 'openelm' || taskInput.model_override === 'apple/OpenELM-450M-Instruct' || taskInput.model_override === 'apple/OpenELM-450M') {
      selectedModelId = 'openelm-450m';
    } else if (taskInput.model_override === 'openelm-1.1b' || taskInput.model_override === 'apple/OpenELM-1_1B-Instruct' || taskInput.model_override === 'apple/OpenELM-1.1B') {
      selectedModelId = 'openelm-1.1b';
    }
  } else if (taskInput.modelMode && taskInput.modelMode !== 'auto') {
    if (taskInput.modelMode === 'gemma' || taskInput.modelMode === 'gemma3') selectedModelId = 'gemma3-1b';
    else if (taskInput.modelMode === 'qwen') selectedModelId = 'local-code-specialist';
    else if (taskInput.modelMode === 'nemotron') selectedModelId = 'nemotron-3-nano';
    else if (taskInput.modelMode === 'llama') selectedModelId = 'llama3.2-1b';
    else if (taskInput.modelMode === 'granite') selectedModelId = 'granite4-1b-h';
    else if (taskInput.modelMode === 'phi') selectedModelId = 'phi4-mini';
    else if (taskInput.modelMode === 'smollm2' || taskInput.modelMode === 'smollm') selectedModelId = 'smollm2-1.7b';
    else if (taskInput.modelMode === 'lfm' || taskInput.modelMode === 'lfm2.5' || taskInput.modelMode === 'lfm2.5-350m' || taskInput.modelMode === 'lfm-350m') selectedModelId = 'lfm2.5-350m';
    else if (taskInput.modelMode === 'rwkv' || taskInput.modelMode === 'rwkv7' || taskInput.modelMode === 'rwkv7-0.4b') selectedModelId = 'rwkv7-0.4b';
    else if (taskInput.modelMode === 'mobilellm-pro' || taskInput.modelMode === 'mobilellm-pro-1b') selectedModelId = 'mobilellm-pro-1b';
    else if (taskInput.modelMode === 'mobilellm' || taskInput.modelMode === 'mobilellm-350m') selectedModelId = 'mobilellm-350m';
    else if (taskInput.modelMode === 'openelm' || taskInput.modelMode === 'openelm-450m') selectedModelId = 'openelm-450m';
    else if (taskInput.modelMode === 'openelm-1.1b') selectedModelId = 'openelm-1.1b';
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
