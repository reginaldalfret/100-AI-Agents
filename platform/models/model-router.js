/**
 * Sovereign AI Workbench — Model Router
 * Dynamic task classifier and local model auto-selector ensuring zero cloud inference.
 */

import { LOCAL_MODELS, ModelModality, getModelById } from "./model-registry.js";

export function classifyTaskModelRequirements(taskDescription, attachments = []) {
  const lower = (taskDescription || "").toLowerCase();
  
  const hasImages = attachments.some(a => /\.(png|jpe?g|bmp|webp|tiff|svg)$/i.test(a.name || a.filename || a));
  const hasPDFs = attachments.some(a => /\.pdf$/i.test(a.name || a.filename || a));
  const hasDrawings = /p&id|p\s*and\s*id|piping|isometric|drawing|schematic|blueprint|diagram/i.test(lower) || hasImages;
  const hasCodeRequest = /python|script|code|automate|calculate\s+script|sandbox|algorithm|parse\s+csv/i.test(lower);
  const hasOCR = /ocr|scan|scanned|transcript|handwritten|handwriting|extract\s+table/i.test(lower) || hasPDFs || hasImages;

  if (hasDrawings || (hasImages && !hasCodeRequest)) {
    return {
      primary_modality: ModelModality.VISION,
      recommended_model_id: "local-vision-ocr",
      pipeline: ["local-vision-ocr", "nemotron-3-nano"],
      rationale: "Task involves visual inspection / drawing / diagram processing. Routed to Local Multimodal Vision Engine."
    };
  }

  if (hasOCR) {
    return {
      primary_modality: ModelModality.OCR,
      recommended_model_id: "local-vision-ocr",
      pipeline: ["local-vision-ocr", "nemotron-3-nano"],
      rationale: "Task involves document OCR / text extraction from scanned sources. Routed to Local OCR Engine."
    };
  }

  if (hasCodeRequest) {
    return {
      primary_modality: ModelModality.CODE,
      recommended_model_id: "local-code-specialist",
      pipeline: ["local-code-specialist", "nemotron-3-nano"],
      rationale: "Task involves software automation / scripting. Routed to Local Code Specialist."
    };
  }

  return {
    primary_modality: ModelModality.TEXT,
    recommended_model_id: "nemotron-3-nano",
    pipeline: ["nemotron-3-nano"],
    rationale: "Task requires general technical reasoning, SOP synthesis, or report drafting. Routed to Nemotron 3 Nano."
  };
}

export async function routeTaskToLocalModel(taskPayload) {
  const { prompt, task, attachments = [], model_override } = taskPayload;
  const taskText = prompt || task || "";
  
  const requirements = classifyTaskModelRequirements(taskText, attachments);
  const selectedModelId = model_override || requirements.recommended_model_id;
  let model = getModelById(selectedModelId);

  if (!model || model.status !== "ready") {
    // Graceful fallback to Nemotron (NEVER CLOUD)
    model = getModelById("nemotron-3-nano");
  }

  return {
    selected_model: model.model_id,
    model_name: model.name,
    provider: model.provider,
    runtime: model.runtime,
    endpoint: model.endpoint,
    pipeline: requirements.pipeline,
    rationale: requirements.rationale,
    is_sovereign_local: true,
    external_calls: 0
  };
}
