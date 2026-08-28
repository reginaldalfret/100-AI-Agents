/**
 * Sovereign AI Workbench — Model Packager & Registry Publisher
 * Packages LoRA adapters, generates Modelfiles, and registers fine-tuned models into the 301 Model Registry.
 */

import fs from "node:fs";
import path from "node:path";
import { LOCAL_MODELS } from "../models/model-registry.js";

const MODELS_EXPORT_DIR = path.resolve("models/fine-tuned");
if (!fs.existsSync(MODELS_EXPORT_DIR)) {
  fs.mkdirSync(MODELS_EXPORT_DIR, { recursive: true });
}

export function generateModelfile({ baseModelName, adapterPath, systemPrompt = "You are a specialized fine-tuned model.", temperature = 0.3 }) {
  return `# 301 SUPER AI — Fine-Tuned Model Definition
FROM ${baseModelName || "falcon3:1b-instruct-q4_K_M"}

# LoRA Adapter Integration
${adapterPath ? `ADAPTER ${adapterPath}` : ""}

# Model Parameters
PARAMETER temperature ${temperature}
PARAMETER top_p 0.9
PARAMETER stop "<|endoftext|>"
PARAMETER stop "<|im_end|>"

# Domain Specialized System Prompt
SYSTEM """${systemPrompt}"""
`;
}

export function packageAndRegisterModel(job) {
  if (!job) throw new Error("Job required for packaging");

  const modelId = `ft-${job.domain.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${job.job_id.slice(-6)}`;
  const modelDir = path.join(MODELS_EXPORT_DIR, modelId);
  fs.mkdirSync(modelDir, { recursive: true });

  const modelfileContent = generateModelfile({
    baseModelName: job.base_model_id,
    adapterPath: `./adapter/adapter_model.bin`,
    systemPrompt: `You are ${job.name}, a specialized ${job.domain} AI model fine-tuned on local proprietary data.`
  });

  fs.writeFileSync(path.join(modelDir, "Modelfile"), modelfileContent, "utf8");

  // Copy adapter files if present
  const jobAdapterDir = path.join(job.job_dir, "adapter");
  const targetAdapterDir = path.join(modelDir, "adapter");
  fs.mkdirSync(targetAdapterDir, { recursive: true });

  if (fs.existsSync(jobAdapterDir)) {
    fs.cpSync(jobAdapterDir, targetAdapterDir, { recursive: true });
  }

  // Register in runtime memory
  const registeredEntry = {
    model_id: modelId,
    ollama_name: `${modelId}:latest`,
    name: job.name,
    display_name: job.name,
    provider: "301 Fine-Tuning Factory",
    base_family: job.base_model_name,
    distribution: "Custom Local Fine-Tuned Model",
    role: `Fine-Tuned ${job.domain} Specialist (${job.specialization || "Domain Specialization"})`,
    badge: job.domain.toUpperCase(),
    primaryTag: job.domain.toUpperCase(),
    secondaryTag: "FINE-TUNED",
    category: "DOMAIN_SPECIALIST",
    runtime: "local-ollama",
    execution_target: "GPU",
    quantization: "Q4_K_M / LoRA",
    parameters: "1.0B - 4.0B",
    model_size: "~1.5 GB",
    context_length: job.config.sequence_length || 2048,
    status: "ready",
    promotion_status: job.promotion_status || "VALIDATED",
    fine_tuned_meta: {
      job_id: job.job_id,
      base_model: job.base_model_name,
      training_method: job.config.method,
      dataset_hash: job.dataset_manifest?.dataset_hash,
      metrics: job.metrics || {}
    }
  };

  // Add to local models in-memory
  const existingIdx = LOCAL_MODELS.findIndex(m => m.model_id === modelId);
  if (existingIdx >= 0) {
    LOCAL_MODELS[existingIdx] = registeredEntry;
  } else {
    LOCAL_MODELS.push(registeredEntry);
  }

  // Write manifest
  fs.writeFileSync(path.join(modelDir, "model_manifest.json"), JSON.stringify(registeredEntry, null, 2), "utf8");

  return registeredEntry;
}
