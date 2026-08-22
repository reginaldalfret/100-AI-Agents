/**
 * Sovereign AI Workbench — Task Classifier & Semantic Capability Gate
 * Categorizes prompts and attachments to assign the optimal local open-weight model.
 */

export const TaskType = {
  REASONING: "reasoning",
  VISION_MULTIMODAL: "vision-multimodal",
  CODING_SANDBOX: "coding-sandbox",
  ORCHESTRATION: "orchestration",
  RAG_KNOWLEDGE: "rag-knowledge"
};

export function classifyTask(input = {}, maybeAttachments = []) {
  const prompt = (typeof input === "string" ? input : input.prompt || "").toLowerCase();
  const attachments = Array.isArray(maybeAttachments) && maybeAttachments.length ? maybeAttachments : (Array.isArray(input.attachments) ? input.attachments : []);

  const hasImage = attachments.some(a => /\.(png|jpg|jpeg|webp|bmp|dwg|dxf)$/i.test(a.name || ""));
  const hasPDF = attachments.some(a => /\.(pdf)$/i.test(a.name || ""));
  const hasDataOrCode = attachments.some(a => /\.(csv|xlsx|json|py|js|sql)$/i.test(a.name || ""));

  // 1. Coding & Sandbox Automation Triggers
  const codeKeywords = [
    "python", "script", "code", "debug", "program", "function", "formula",
    "csv analysis", "sandbox", "algorithm", "regex", "sql query", "pandas",
    "calculate using python", "write a script", "automation script"
  ];

  const isCode = hasDataOrCode && (prompt.includes("script") || prompt.includes("code")) || codeKeywords.some(k => prompt.includes(k));

  if (isCode) {
    return {
      task_type: TaskType.CODING_SANDBOX,
      primary_modality: "code",
      preferred_model_id: "local-code-specialist",
      recommended_model_id: "local-code-specialist",
      preferred_model_name: "Qwen2.5-Coder (Local Code Specialist)",
      confidence: 0.92,
      reason: "Code generation, sandbox scripting, or data parsing required",
      recommended_agents: ["agent-055", "agent-056", "agent-084"]
    };
  }

  // 2. Vision & Multimodal Triggers
  const visionKeywords = [
    "photo", "photograph", "image", "picture", "p&id", "p and id", "drawing",
    "schematic", "blueprint", "defect", "cui", "look at",
    "visual", "ocr", "scanned", "handwritten", "handwriting", "diagram"
  ];

  const isVision = hasImage || (hasPDF && (prompt.includes("scan") || prompt.includes("ocr"))) || visionKeywords.some(k => prompt.includes(k));

  if (isVision) {
    const isScanPdf = hasPDF || prompt.includes("scan") || prompt.includes("ocr");
    const mod = isScanPdf ? "ocr" : "vision";
    return {
      task_type: TaskType.VISION_MULTIMODAL,
      primary_modality: mod,
      preferred_model_id: "local-vision-ocr",
      recommended_model_id: "local-vision-ocr",
      preferred_model_name: "Gemma 3 4B / Local Vision & OCR Engine",
      confidence: 0.95,
      reason: "Visual or multimodal document understanding required",
      recommended_agents: ["agent-045", "agent-052", "agent-058"]
    };
  }

  // 3. General Epistemic Reasoning & Orchestration (Default to Nemotron)
  return {
    task_type: TaskType.REASONING,
    primary_modality: "text",
    preferred_model_id: "nemotron-3-nano",
    recommended_model_id: "nemotron-3-nano",
    preferred_model_name: "NVIDIA Nemotron 3 Nano (4B Q4_K_M)",
    confidence: 0.98,
    reason: "Epistemic reasoning, SOP synthesis, planning, or deliverable formulation",
    recommended_agents: ["agent-101", "agent-001", "agent-040", "agent-049"]
  };
}
