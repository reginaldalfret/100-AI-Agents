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
    name: "Local Multimodal & Document Vision Engine",
    provider: "local-multimodal",
    runtime: "in-process-onnx",
    endpoint: "http://127.0.0.1:8081",
    quantization: "FP16 / Int8",
    vram_mb: 1200,
    ram_mb: 2048,
    context_length: 2048,
    supported_modalities: [ModelModality.VISION, ModelModality.OCR],
    capabilities: [
      "scanned-pdf-ocr",
      "engineering-drawing-tag-extraction",
      "corrosion-photo-analysis",
      "table-structure-parsing",
      "handwriting-transcription"
    ],
    recommended_tasks: [
      "p-and-id-tag-extraction",
      "ndt-ultrasonic-report-ocr",
      "flange-defect-inspection",
      "scanned-work-order-digitization"
    ],
    priority: 2,
    status: "ready"
  },
  {
    model_id: "gemma4-e2b",
    ollama_name: "gemma4:e2b",
    name: "Google Gemma 4 E2B (Multimodal & Reasoning)",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    quantization: "Q4_K_M",
    vram_mb: 2400,
    ram_mb: 4096,
    context_length: 131072,
    supported_modalities: [ModelModality.TEXT, ModelModality.VISION],
    capabilities: [
      "image",
      "multimodal-reasoning",
      "document-vision",
      "photo-analysis",
      "drawing-analysis",
      "visual-defect-reasoning",
      "plant-equipment-identification",
      "multimodal-qa"
    ],
    recommended_tasks: [
      "equipment-defect-assessment",
      "p-and-id-schematic-reasoning",
      "valve-identification",
      "plant-condition-evaluation",
      "photograph-defect-analysis",
      "evidence-synthesis"
    ],
    priority: 2,
    status: "ready"
  },
  {
    model_id: "local-code-specialist",
    ollama_name: "qwen2.5-coder:1.5b",
    name: "Qwen 2.5 Coder (1.5B Q4_K_M)",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
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
  }
];

export function getModelById(modelId) {
  return LOCAL_MODELS.find(m => m.model_id === modelId) || null;
}

export function listAvailableModels() {
  return LOCAL_MODELS;
}
