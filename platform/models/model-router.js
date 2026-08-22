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
    if (taskInput.model_override === 'gemma3:4b' || taskInput.model_override === 'gemma3-4b' || taskInput.model_override === 'gemma') {
      selectedModelId = 'gemma3-4b';
    } else if (taskInput.model_override === 'qwen2.5-coder:1.5b' || taskInput.model_override === 'local-code-specialist' || taskInput.model_override === 'qwen') {
      selectedModelId = 'local-code-specialist';
    } else if (taskInput.model_override === 'nemotron-3-nano' || taskInput.model_override === 'nemotron') {
      selectedModelId = 'nemotron-3-nano';
    }
  } else if (taskInput.modelMode && taskInput.modelMode !== 'auto') {
    if (taskInput.modelMode === 'gemma') selectedModelId = 'gemma3-4b';
    else if (taskInput.modelMode === 'qwen') selectedModelId = 'local-code-specialist';
    else if (taskInput.modelMode === 'nemotron') selectedModelId = 'nemotron-3-nano';
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
