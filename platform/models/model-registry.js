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
    model_id: "gemma2-2b",
    ollama_name: "gemma2:2b",
    name: "Google Gemma 2 (2B Q4_K_M)",
    provider: "ollama",
    runtime: "local-ollama",
    endpoint: "http://127.0.0.1:11434",
    quantization: "Q4_K_M",
    vram_mb: 1640,
    ram_mb: 2048,
    context_length: 4096,
    supported_modalities: [ModelModality.TEXT, ModelModality.VISION],
    capabilities: [
      "visual-defect-reasoning",
      "instruction-following",
      "plant-equipment-identification",
      "technical-qa"
    ],
    recommended_tasks: [
      "equipment-defect-assessment",
      "valve-identification",
      "plant-condition-evaluation"
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
  }
];

export function getModelById(modelId) {
  return LOCAL_MODELS.find(m => m.model_id === modelId) || null;
}

export function listAvailableModels() {
  return LOCAL_MODELS;
}
