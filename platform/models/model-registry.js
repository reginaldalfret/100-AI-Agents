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
    model_id: "falcon3-1b-instruct",
    ollama_name: "falcon3:1b-instruct-q4_K_M",
    name: "Falcon3 1B",
    display_name: "Falcon3 1B",
    provider: "Technology Innovation Institute",
    role: "Science, Mathematics & Lightweight Coding Specialist",
    badge: "SCIENCE",
    primaryTag: "SCIENCE",
    runtime: "local-ollama",
    runtime_type: RuntimeType.OLLAMA,
    endpoint: "http://127.0.0.1:11434",
    execution_target: "GPU",
    quantization: "Q4_K_M",
    vram_mb: 1300,
    ram_mb: 2048,
    context_length: 8192,
    supported_modalities: [ModelModality.TEXT, ModelModality.CODE],
    capabilities: [
      "science",
      "mathematics",
      "coding",
      "technical",
      "stem-reasoning",
      "scientific-analysis",
      "algorithmic-problem-solving"
    ],
    recommended_tasks: [
      "science-qa",
      "mathematical-calculations",
      "lightweight-coding",
      "technical-inquiries",
      "stem-analysis"
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
    model_id: "tinyllama-1.1b",
    ollama_name: "tinyllama:1.1b-chat",
    name: "TinyLlama 1.1B",
    provider: "TinyLlama",
    distribution: "Official Ollama",
    role: "Lightweight General Chat, Short Rewriting & Q&A",
    badge: "GENERAL",
    primaryTag: "GENERAL",
    runtime: "tinyllama:1.1b-chat",
    runtime_type: RuntimeType.OLLAMA,
    endpoint: "http://127.0.0.1:11434",
    execution_target: "CPU",
    quantization: "Q4_0",
    vram_mb: 0,
    ram_mb: 637,
    context_length: 2048,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-chat",
      "rewriting",
      "summarization",
      "simple-qa",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "general-chat",
      "short-rewriting",
      "simple-summarization",
      "simple-qa",
      "general-fallback"
    ],
    priority: 3,
    status: "ready"
  },
  {
    model_id: "stablelm2-1.6b",
    ollama_name: "stablelm2:1.6b",
    name: "Stable LM 2 1.6B",
    provider: "Stability AI",
    distribution: "Official Ollama",
    role: "General Text Generation, Summarization & Rewriting",
    badge: "GENERAL",
    primaryTag: "GENERAL",
    runtime: "stablelm2:1.6b",
    runtime_type: RuntimeType.OLLAMA,
    endpoint: "http://127.0.0.1:11434",
    execution_target: "CPU",
    quantization: "Q4_0",
    vram_mb: 0,
    ram_mb: 982,
    context_length: 4096,
    endpoint_options: {
      num_gpu: 0
    },
    supported_modalities: [ModelModality.TEXT],
    capabilities: [
      "general-text-generation",
      "summarization",
      "rewriting",
      "multilingual-text",
      "cpu-only-inference"
    ],
    recommended_tasks: [
      "text-generation",
      "summarization",
      "rewriting",
      "multilingual-text-tasks",
      "fallback-assistant"
    ],
    priority: 3,
    status: "ready"
  }
];

export function getModelById(modelId) {
  if (!modelId) return null;
  const direct = LOCAL_MODELS.find(m => m.model_id === modelId || m.ollama_name === modelId || m.name === modelId);
  if (direct) return direct;
  const lower = String(modelId).toLowerCase();
  return LOCAL_MODELS.find(m =>
    m.model_id.toLowerCase() === lower ||
    (m.ollama_name && m.ollama_name.toLowerCase() === lower) ||
    (m.name && m.name.toLowerCase() === lower) ||
    (lower.includes("lfm2.5-350m") && m.model_id === "lfm2.5-350m") ||
    (lower.includes("rwkv") && m.model_id === "rwkv7-0.4b") ||
    (lower.includes("tinyllama") && m.model_id === "tinyllama-1.1b") ||
    (lower.includes("stablelm") && m.model_id === "stablelm2-1.6b") ||
    (lower.includes("falcon") && m.model_id === "falcon3-1b-instruct")
  ) || null;
}

export function listAvailableModels() {
  return LOCAL_MODELS;
}

export function getGpuModels() {
  return LOCAL_MODELS.filter(m => m.execution_target === "GPU");
}

export function getCpuModels() {
  return LOCAL_MODELS.filter(m => m.execution_target === "CPU" && m.model_id !== "local-vision-ocr");
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
      lower.includes("tinyllama") ||
      lower.includes("stablelm") ||
      lower === "cpu" ||
      lower.includes("ocr")
    ) {
      return true;
    }
  }
  return false;
}
