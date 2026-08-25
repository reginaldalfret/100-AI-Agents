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

export const RuntimeType = {
  OLLAMA: "OLLAMA",
  LLAMACPP: "LLAMACPP",
  EXECUTORCH: "EXECUTORCH",
  MLX: "MLX",
  ONNXRUNTIME: "ONNXRUNTIME",
  PYTORCH: "PYTORCH"
};

export const LOCAL_MODELS = [
  {
    model_id: "nemotron-3-nano",
    ollama_name: "nemotron-3-nano:latest",
    name: "NVIDIA Nemotron 3 Nano (4B Q4_K_M)",
    provider: "NVIDIA",
    role: "Super AI Orchestration & Reasoning",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
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
    provider: "PaddleOCR",
    role: "Production Offline Document Intelligence",
    runtime: "paddleocr-engine",
    runtime_type: RuntimeType.ONNXRUNTIME,
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
      "table-structure-extraction",
      "formula-recognition",
      "layout-analysis"
    ],
    recommended_tasks: [
      "scanned-document-ocr",
      "table-extraction",
      "formula-extraction",
      "multilingual-document-reading"
    ],
    priority: 1,
    status: "ready"
  },
  {
    model_id: "gemma3-1b",
    ollama_name: "gemma3:1b",
    name: "Google Gemma 3 1B (Q4_K_M)",
    provider: "Google",
    role: "Dense Transformer Edge NLP",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 1100,
    ram_mb: 2048,
    context_length: 8192,
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-qa",
      "lightweight-reasoning",
      "grounded-qa",
      "concise-summarization",
      "edge-inference"
    ],
    recommended_tasks: [
      "compact-qa",
      "general-inquiries",
      "evidence-grounded-qa",
      "lightweight-synthesis"
    ],
    priority: 2,
    status: "ready"
  },
  {
    model_id: "local-code-specialist",
    ollama_name: "qwen2.5-coder:1.5b",
    name: "Qwen 2.5 Coder 1.5B (Q4_K_M)",
    provider: "Alibaba Cloud / Qwen",
    role: "Multi-Language Code Synthesis & AST Tools",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 1200,
    ram_mb: 2048,
    context_length: 8192,
    supported_modalities: [ModelModality.TEXT, ModelModality.CODE],
    capabilities: [
      "code-generation",
      "syntax-validation",
      "algorithmic-reasoning",
      "refactoring",
      "regex-extraction"
    ],
    recommended_tasks: [
      "python-scripting",
      "sql-query-generation",
      "regex-pattern-matching",
      "code-review",
      "bash-scripting"
    ],
    priority: 1,
    status: "ready"
  },
  {
    model_id: "llama3.2-1b",
    ollama_name: "llama3.2:1b",
    name: "Meta Llama 3.2 1B",
    provider: "ollama",
    role: "Fast Lightweight General Text",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
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
      "low-latency-text",
      "conversational-qa",
      "fast-text-generation",
      "instruction-following",
      "creative-writing"
    ],
    recommended_tasks: [
      "general-assistant",
      "text-rewriting",
      "quick-summary",
      "fast-response",
      "fast-qa",
      "email-drafting",
      "general-conversations",
      "creative-text",
      "bullet-summaries"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "granite4-1b-h",
    ollama_name: "granite4:1b-h",
    name: "IBM Granite 4 1B-H",
    provider: "ollama",
    role: "Enterprise RAG & Structured Tool Execution",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
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
      "rag-synthesis",
      "enterprise-rag",
      "tool-use",
      "structured-data-extraction",
      "governance-compliance",
      "tabular-reasoning"
    ],
    recommended_tasks: [
      "rag-document-search",
      "entity-extraction",
      "enterprise-workflows",
      "tool-invocation",
      "rag-retrieval",
      "compliance-checking",
      "schema-mapping",
      "structured-tool-calling",
      "document-qa"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "phi4-mini",
    ollama_name: "phi4-mini",
    name: "Microsoft Phi-4 Mini",
    provider: "ollama",
    role: "STEM Reasoning & Mathematical Logic",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
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
      "planning",
      "mathematical-reasoning",
      "logic-puzzles",
      "scientific-analysis",
      "multi-step-deduction",
      "code-logic"
    ],
    recommended_tasks: [
      "mathematical-calculations",
      "logical-puzzles",
      "algorithmic-planning",
      "analytical-reasoning",
      "math-problem-solving",
      "logic-evaluation",
      "algorithm-design",
      "scientific-qa",
      "engineering-calculations"
    ],
    priority: 2,
    status: "ready"
  },
  {
    model_id: "smollm2-1.7b",
    ollama_name: "smollm2:1.7b",
    name: "SmolLM2 1.7B (Lightweight Text)",
    provider: "Hugging Face",
    role: "Compact High-Throughput Reasoning",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
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
      "fast-token-throughput",
      "concise-summarization",
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
    model_id: "lfm2.5-350m",
    ollama_name: "LiquidAI/lfm2.5-350m",
    name: "Liquid AI LFM2.5 350M",
    provider: "Liquid AI",
    role: "Lightweight CPU Extraction & Tool Model",
    badge: "EXTRACTION",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
    endpoint: "http://127.0.0.1:11434",
    execution_target: "CPU",
    quantization: "Q8_0",
    vram_mb: 0,
    ram_mb: 466,
    context_length: 128000,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "data-extraction",
      "structured-output",
      "classification",
      "lightweight-tool-use",
      "simple-transformations",
      "routing-support",
      "short-text-processing",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "data-extraction",
      "structured-output",
      "classification",
      "lightweight-tool-routing",
      "simple-rag-preprocessing",
      "short-text-transformations"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "rwkv7-0.4b",
    ollama_name: "mollysama/rwkv-7-g1d:0.4b",
    name: "RWKV-7 0.4B",
    provider: "RWKV",
    role: "Lightweight General Text & Rewriting",
    badge: "TEXT",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
    endpoint: "http://127.0.0.1:11434",
    execution_target: "CPU",
    quantization: "Q8_0",
    vram_mb: 0,
    ram_mb: 547,
    context_length: 1048576,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-qa",
      "lightweight-text-generation",
      "simple-rewriting",
      "classification",
      "simple-summarization",
      "cpu-fallback",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "short-general-questions",
      "lightweight-text-generation",
      "simple-rewriting",
      "classification",
      "simple-summarization",
      "cpu-edge-computation"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "mobilellm-pro-1b",
    name: "Meta MobileLLM-Pro 1B",
    provider: "Meta Reality Labs",
    role: "General Assistant, QA & Lightweight Reasoning",
    badge: "ASSISTANT",
    runtime: "local-executorch",
    runtime_type: RuntimeType.EXECUTORCH,
    endpoint: "http://127.0.0.1:8305",
    execution_target: "CPU",
    quantization: "INT4",
    vram_mb: 0,
    ram_mb: 580,
    context_length: 4096,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-assistant",
      "qa",
      "lightweight-reasoning",
      "tool-oriented-tasks",
      "on-device-inference",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "general-assistant",
      "question-answering",
      "lightweight-reasoning",
      "tool-use",
      "on-device-assistance"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "mobilellm-350m",
    name: "Meta MobileLLM 350M",
    provider: "Meta",
    role: "Ultra-Light Assistant, Classification & Routing",
    badge: "EDGE",
    runtime: "local-executorch",
    runtime_type: RuntimeType.EXECUTORCH,
    endpoint: "http://127.0.0.1:8305",
    execution_target: "CPU",
    quantization: "INT4",
    vram_mb: 0,
    ram_mb: 210,
    context_length: 4096,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "ultra-light-assistant",
      "classification",
      "routing",
      "simple-extraction",
      "short-text-generation",
      "lightweight-fallback",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "intent-classification",
      "routing-support",
      "simple-extraction",
      "short-text-generation",
      "lightweight-fallback"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "openelm-450m",
    name: "Apple OpenELM 450M",
    provider: "Apple",
    role: "Lightweight General Text, Summarization & Transformation",
    badge: "TEXT",
    runtime: "local-transformers",
    runtime_type: RuntimeType.PYTORCH,
    endpoint: "http://127.0.0.1:8305",
    execution_target: "CPU",
    quantization: "FP16 / INT8",
    vram_mb: 0,
    ram_mb: 450,
    context_length: 2048,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "lightweight-general-text",
      "summarization",
      "classification",
      "short-text-transformation",
      "on-device-assistance",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "short-summarization",
      "text-transformation",
      "classification",
      "on-device-text-assistance"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "openelm-1.1b",
    name: "Apple OpenELM 1.1B",
    provider: "Apple",
    role: "General Text & Long-Context Summarization",
    badge: "TEXT",
    runtime: "local-transformers",
    runtime_type: RuntimeType.PYTORCH,
    endpoint: "http://127.0.0.1:8305",
    execution_target: "CPU",
    quantization: "FP16 / INT8",
    vram_mb: 0,
    ram_mb: 1100,
    context_length: 2048,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-text",
      "summarization",
      "instruction-following",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "extended-summarization",
      "general-text-generation",
      "offline-assistance"
    ],
    priority: 4,
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
  return LOCAL_MODELS.filter(m => m.execution_target === "CPU" && m.model_id !== "local-vision-ocr" && m.model_id !== "openelm-1.1b");
}

export function getAllCpuModels() {
  return LOCAL_MODELS.filter(m => m.execution_target === "CPU" && m.model_id !== "local-vision-ocr");
}

export function isCpuModel(modelIdOrName) {
  const m = getModelById(modelIdOrName);
  if (m) return m.execution_target === "CPU";
  if (typeof modelIdOrName === "string") {
    const lower = modelIdOrName.toLowerCase();
    if (
      lower.includes("lfm") ||
      lower.includes("liquid") ||
      lower.includes("rwkv") ||
      lower.includes("mollysama") ||
      lower.includes("mobilellm") ||
      lower.includes("openelm") ||
      lower.includes("apple") ||
      lower === "cpu" ||
      lower.includes("ocr")
    ) {
      return true;
    }
  }
  return false;
}
