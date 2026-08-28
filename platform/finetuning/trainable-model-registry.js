/**
 * Sovereign AI Workbench — Trainable Model Registry
 * Maintains the list of verified trainable base models with checkpoints, licenses, and hardware requirements.
 * Explicitly separates SERVING MODELS from TRAINING CHECKPOINTS.
 */

export const TRAINABLE_MODELS = [
  {
    model_id: "falcon3-1b-instruct",
    name: "Falcon3 1B",
    provider: "Technology Innovation Institute",
    base_family: "Falcon 3",
    training_format: "ChatML / Alpaca",
    parameters: "1.0B",
    quantization: "Q4_K_M / 4-bit NF4",
    source: "Hugging Face / Local Weights",
    trainable: true,
    checkpoint_available: true,
    license: "Apache License 2.0",
    license_permissions: {
      commercial_use: true,
      derivative_works: true,
      redistribution: true,
      adapter_export: true
    },
    hardware_requirements: {
      min_vram_gb: 2.0,
      recommended_vram_gb: 3.5,
      supported_methods: ["QLoRA", "LoRA"],
      full_finetune_supported: false
    },
    recommended_method: "QLoRA",
    vram_estimate: "~2.2 GB (QLoRA r=16)",
    training_support: "SUPPORTED",
    status: "READY"
  },
  {
    model_id: "qwen2.5-coder-1.5b",
    name: "Qwen 2.5 Coder 1.5B",
    provider: "Alibaba Cloud / Qwen Team",
    base_family: "Qwen 2.5",
    training_format: "ChatML",
    parameters: "1.54B",
    quantization: "Q4_K_M / 4-bit NF4",
    source: "Hugging Face / Local Weights",
    trainable: true,
    checkpoint_available: true,
    license: "Apache License 2.0",
    license_permissions: {
      commercial_use: true,
      derivative_works: true,
      redistribution: true,
      adapter_export: true
    },
    hardware_requirements: {
      min_vram_gb: 2.5,
      recommended_vram_gb: 3.8,
      supported_methods: ["QLoRA", "LoRA"],
      full_finetune_supported: false
    },
    recommended_method: "QLoRA",
    vram_estimate: "~2.6 GB (QLoRA r=16)",
    training_support: "SUPPORTED",
    status: "READY"
  },
  {
    model_id: "llama3.2-1b",
    name: "Llama 3.2 1B",
    provider: "Meta",
    base_family: "Llama 3.2",
    training_format: "Llama-3 Template",
    parameters: "1.2B",
    quantization: "Q4_K_M / 4-bit NF4",
    source: "Meta Llama Community",
    trainable: true,
    checkpoint_available: true,
    license: "Llama 3.2 Community License",
    license_permissions: {
      commercial_use: true,
      derivative_works: true,
      redistribution: true,
      adapter_export: true
    },
    hardware_requirements: {
      min_vram_gb: 2.2,
      recommended_vram_gb: 3.6,
      supported_methods: ["QLoRA", "LoRA"],
      full_finetune_supported: false
    },
    recommended_method: "QLoRA",
    vram_estimate: "~2.4 GB (QLoRA r=16)",
    training_support: "SUPPORTED",
    status: "READY"
  },
  {
    model_id: "smollm2-1.7b",
    name: "SmolLM2 1.7B",
    provider: "Hugging Face",
    base_family: "SmolLM2",
    training_format: "ChatML",
    parameters: "1.7B",
    quantization: "Q4_K_M / 4-bit NF4",
    source: "Hugging Face Hub",
    trainable: true,
    checkpoint_available: true,
    license: "Apache License 2.0",
    license_permissions: {
      commercial_use: true,
      derivative_works: true,
      redistribution: true,
      adapter_export: true
    },
    hardware_requirements: {
      min_vram_gb: 2.8,
      recommended_vram_gb: 3.8,
      supported_methods: ["QLoRA", "LoRA"],
      full_finetune_supported: false
    },
    recommended_method: "QLoRA",
    vram_estimate: "~2.8 GB (QLoRA r=16)",
    training_support: "SUPPORTED",
    status: "READY"
  },
  {
    model_id: "gemma3-1b",
    name: "Gemma 3 1B",
    provider: "Google",
    base_family: "Gemma 3",
    training_format: "Gemma Format",
    parameters: "1.0B",
    quantization: "Q4_K_M / 4-bit NF4",
    source: "Google DeepMind",
    trainable: true,
    checkpoint_available: true,
    license: "Gemma Terms of Use",
    license_permissions: {
      commercial_use: true,
      derivative_works: true,
      redistribution: true,
      adapter_export: true
    },
    hardware_requirements: {
      min_vram_gb: 2.0,
      recommended_vram_gb: 3.5,
      supported_methods: ["QLoRA", "LoRA"],
      full_finetune_supported: false
    },
    recommended_method: "QLoRA",
    vram_estimate: "~2.2 GB (QLoRA r=16)",
    training_support: "SUPPORTED",
    status: "READY"
  },
  {
    model_id: "nemotron-3-nano",
    name: "NVIDIA Nemotron 3 Nano",
    provider: "NVIDIA",
    base_family: "Nemotron 3",
    training_format: "Nemotron Chat",
    parameters: "4.0B",
    quantization: "Q4_K_M / 4-bit NF4",
    source: "NVIDIA Open Model",
    trainable: true,
    checkpoint_available: true,
    license: "NVIDIA Open Model License",
    license_permissions: {
      commercial_use: true,
      derivative_works: true,
      redistribution: true,
      adapter_export: true
    },
    hardware_requirements: {
      min_vram_gb: 3.5,
      recommended_vram_gb: 4.0,
      supported_methods: ["QLoRA"],
      full_finetune_supported: false
    },
    recommended_method: "QLoRA (r=8, batch=1)",
    vram_estimate: "~3.6 GB (QLoRA r=8)",
    training_support: "TIGHT",
    status: "READY"
  },
  {
    model_id: "medgemma-27b",
    name: "MedGemma 27B",
    provider: "Google",
    base_family: "Gemma 3",
    training_format: "N/A",
    parameters: "27.0B",
    quantization: "Q4_K_M",
    source: "Ollama Serving Only",
    trainable: false,
    checkpoint_available: false,
    license: "Health AI Developer Foundations Terms of Use",
    license_permissions: {
      commercial_use: false,
      derivative_works: false,
      redistribution: false,
      adapter_export: false
    },
    hardware_requirements: {
      min_vram_gb: 16.0,
      recommended_vram_gb: 24.0,
      supported_methods: [],
      full_finetune_supported: false
    },
    recommended_method: "None",
    vram_estimate: ">16 GB VRAM",
    training_support: "UNSUPPORTED",
    status: "Training checkpoint unavailable."
  }
];

export function listTrainableModels() {
  return TRAINABLE_MODELS.filter(m => m.trainable && m.checkpoint_available);
}

export function getAllTrainableModels() {
  return [...TRAINABLE_MODELS];
}

export function getTrainableModelById(modelId) {
  if (!modelId) return null;
  const lower = String(modelId).toLowerCase();

  // 1. Exact match
  const exact = TRAINABLE_MODELS.find(m => m.model_id.toLowerCase() === lower || m.name.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Prefix / family match
  return TRAINABLE_MODELS.find(m =>
    (lower.includes("falcon") && m.model_id.includes("falcon")) ||
    (lower.includes("qwen") && m.model_id.includes("qwen")) ||
    (lower.includes("llama") && m.model_id.includes("llama")) ||
    (lower.includes("smollm") && m.model_id.includes("smollm")) ||
    (lower.includes("gemma") && m.model_id.includes("gemma")) ||
    (lower.includes("nemotron") && m.model_id.includes("nemotron"))
  ) || null;
}

export function isTrainable(modelId) {
  const m = getTrainableModelById(modelId);
  return Boolean(m && m.trainable && m.checkpoint_available);
}
