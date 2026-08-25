/**
 * Sovereign AI Workbench — Model Registry
 * Authoritative registry of local open-weight models, hardware footprints, and capabilities.
 */

export const ModelModality = {
  TEXT: "text",
  VISION: "vision",
  CODE: "code",
  OCR: "ocr",
  EMBEDDING: "embedding"
};

export const LOCAL_MODELS = [
  {
    model_id: "nemotron-3-nano",
    name: "NVIDIA Nemotron 3 Nano (4B Q4_K_M)",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 2840,
    ram_mb: 4096,
    context_length: 4096,
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-reasoning",
      "instruction-following",
      "structured-json",
      "task-decomposition",
      "epistemic-synthesis"
    ],
    recommended_tasks: [
      "inspection-analysis",
      "hazard-assessment",
      "sop-synthesis",
      "approval-drafting",
      "technical-summarization"
    ],
    priority: 1,
    status: "ready"
  },
  {
    model_id: "local-vision-ocr",
    name: "PaddleOCR 3.7.0 Document Intelligence Engine",
    provider: "paddleocr",
    runtime: "paddleocr-engine",
    endpoint: "http://127.0.0.1:8305",
    execution_target: "CPU",
    quantization: "FP32 / Int8",
    vram_mb: 0,
    ram_mb: 1024,
    context_length: 8192,
    supported_modalities: [ModelModality.VISION, ModelModality.OCR],
    capabilities: [
      "scanned-pdf-ocr",
      "multilingual-text-recognition",
      "tamil-ocr",
      "hindi-ocr",
      "table-structure-parsing",
      "engineering-drawing-tag-extraction",
      "handwriting-transcription",
      "layout-analysis"
    ],
    recommended_tasks: [
      "scanned-document-ocr",
      "invoice-and-receipt-digitization",
      "tamil-document-recognition",
      "ndt-ultrasonic-report-ocr",
      "p-and-id-tag-extraction",
      "table-extraction"
    ],
    priority: 2,
    status: "ready"
  },
  {
    model_id: "gemma3-1b",
    ollama_name: "gemma3:1b",
    name: "Google Gemma 3 1B (On-Device NLP & Semantic Synthesis)",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 1100,
    ram_mb: 2048,
    context_length: 32768,
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "semantic-synthesis",
      "syntactic-parsing",
      "contextual-summarization",
      "token-classification",
      "structural-rewriting",
      "deductive-text-qa"
    ],
    recommended_tasks: [
      "semantic-text-processing",
      "contextual-summarization",
      "syntactic-rewriting",
      "document-classification",
      "on-device-nlp-inference"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "local-code-specialist",
    ollama_name: "qwen2.5-coder:1.5b",
    name: "Qwen 2.5 Coder (1.5B Q4_K_M)",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 1438,
    ram_mb: 2048,
    context_length: 4096,
    supported_modalities: [ModelModality.CODE, ModelModality.TEXT],
    capabilities: [
      "python-tool-generation",
      "excel-formula-scripting",
      "scada-telemetry-parsing",
      "safe-sandbox-automation"
    ],
    recommended_tasks: [
      "automated-telemetry-cleaner",
      "corrosion-calculation-script",
      "data-conversion-pipeline"
    ],
    priority: 4,
    status: "ready"
  },
  {
    model_id: "llama3.2-1b",
    ollama_name: "llama3.2:1b",
    name: "Meta Llama 3.2 1B",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 1300,
    ram_mb: 2048,
    context_length: 8192,
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "lightweight-general",
      "rewriting",
      "summarization",
      "simple-qa",
      "low-latency-text"
    ],
    recommended_tasks: [
      "general-assistant",
      "text-rewriting",
      "quick-summary",
      "fast-response"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "granite4-1b-h",
    ollama_name: "granite4:1b-h",
    name: "IBM Granite 4 1B-H",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 1200,
    ram_mb: 2048,
    context_length: 8192,
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "enterprise-rag-tools",
      "structured-extraction",
      "classification",
      "tool-calling",
      "rag-synthesis"
    ],
    recommended_tasks: [
      "rag-document-search",
      "entity-extraction",
      "enterprise-workflows",
      "tool-invocation"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "phi4-mini",
    ollama_name: "phi4-mini",
    name: "Microsoft Phi-4 Mini",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 2400,
    ram_mb: 4096,
    context_length: 16384,
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "reasoning-math",
      "logical-deduction",
      "mathematics",
      "algorithmic-problem-solving",
      "planning"
    ],
    recommended_tasks: [
      "mathematical-calculations",
      "logical-puzzles",
      "algorithmic-planning",
      "analytical-reasoning"
    ],
    priority: 2,
    status: "ready"
  },
  {
    model_id: "smollm2-1.7b",
    ollama_name: "smollm2:1.7b",
    name: "SmolLM2 1.7B (Lightweight Text)",
    provider: "Hugging Face",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q8_0",
    vram_mb: 1800,
    ram_mb: 2048,
    context_length: 8192,
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-text-generation",
      "rewriting",
      "summarization",
      "lightweight-qa",
      "simple-instruction-following",
      "conversational-tasks",
      "basic-reasoning"
    ],
    recommended_tasks: [
      "text-rewriting",
      "concise-summarization",
      "general-inquiries",
      "lightweight-text-transformation",
      "conversational-response"
    ],
    priority: 2,
    status: "ready"
  },
  {
    model_id: "lfm2.5-1.2b-instruct",
    ollama_name: "LiquidAI/lfm2.5-1.2b-instruct:latest",
    name: "Liquid AI LFM2.5 1.2B Instruct",
    provider: "Liquid AI",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    execution_target: "CPU",
    quantization: "Q4_K_M",
    vram_mb: 0,
    ram_mb: 850,
    context_length: 128000,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "on-device-assistant",
      "agentic-tasks",
      "data-extraction",
      "rag-retrieval",
      "tool-use",
      "short-text-transformation",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "general-assistant",
      "agentic-tasks",
      "data-extraction",
      "rag-synthesis",
      "cpu-edge-computation"
    ],
    priority: 3,
    status: "ready"
  }
];

export function getModelById(modelId) {
  return LOCAL_MODELS.find(m => m.model_id === modelId || m.ollama_name === modelId) || null;
}

export function listAvailableModels() {
  return LOCAL_MODELS;
}

export function getGpuModels() {
  return LOCAL_MODELS.filter(m => m.execution_target === "GPU");
}

export function getCpuModels() {
  return LOCAL_MODELS.filter(m => m.execution_target === "CPU");
}

export function isCpuModel(modelIdOrName) {
  const m = getModelById(modelIdOrName);
  if (m) return m.execution_target === "CPU";
  if (typeof modelIdOrName === "string") {
    const lower = modelIdOrName.toLowerCase();
    if (lower.includes("lfm") || lower.includes("liquid") || lower === "cpu" || lower.includes("ocr")) {
      return true;
    }
  }
  return false;
}

