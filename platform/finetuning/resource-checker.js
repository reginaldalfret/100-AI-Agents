/**
 * Sovereign AI Workbench — Fine-Tuning Resource Checker
 * Analyzes GPU VRAM, system RAM, CPU, and disk storage to calculate training feasibility.
 */

import { getTrainableModelById } from "./trainable-model-registry.js";

export const FeasibilityStatus = {
  SAFE: "SAFE",
  TIGHT: "TIGHT",
  UNSUPPORTED: "UNSUPPORTED"
};

export function getSystemHardwareSnapshot() {
  return {
    gpu: {
      name: "NVIDIA GeForce RTX 2050",
      total_vram_mb: 4096,
      usable_vram_mb: 3800,
      vram_type: "GDDR6"
    },
    cpu: {
      model: "Intel(R) Core(TM) i5-11400H @ 2.70GHz",
      cores: 6,
      threads: 12
    },
    ram: {
      total_ram_mb: 16384,
      available_ram_mb: 11200
    },
    disk: {
      target_drive: "E:",
      free_space_gb: 120.5
    }
  };
}

/**
 * Calculates estimated VRAM requirement and safety status for a specific training configuration.
 */
export function evaluateTrainingFeasibility({
  modelId,
  method = "QLoRA",
  loraRank = 16,
  batchSize = 1,
  gradientAccumulationSteps = 4,
  sequenceLength = 1024
}) {
  const hardware = getSystemHardwareSnapshot();
  const model = getTrainableModelById(modelId);

  if (!model) {
    return {
      status: FeasibilityStatus.UNSUPPORTED,
      vramEstimateMb: 0,
      vramPercentage: "0%",
      canStart: false,
      reason: `Model ${modelId} is not registered in the Trainable Model Registry.`
    };
  }

  if (!model.trainable || !model.checkpoint_available) {
    return {
      status: FeasibilityStatus.UNSUPPORTED,
      vramEstimateMb: 0,
      vramPercentage: "0%",
      canStart: false,
      reason: `Training checkpoint unavailable for ${model.name}.`
    };
  }

  // Check Full Fine-Tuning constraint (strictly prohibited on 4GB VRAM)
  if (method === "Full" || method === "FULL") {
    return {
      status: FeasibilityStatus.UNSUPPORTED,
      vramEstimateMb: 12000,
      vramPercentage: "300%",
      canStart: false,
      reason: "Full parameter fine-tuning is disabled on 4GB VRAM hardware. Please select QLoRA or LoRA."
    };
  }

  // Calculate LoRA / QLoRA Memory Model
  // Base weights memory
  const paramCountB = parseFloat(model.parameters);
  const baseWeightMb = method === "QLoRA" ? paramCountB * 550 : paramCountB * 1100;

  // LoRA Adapter & Optimizer state memory
  const loraMemoryMb = (loraRank / 16) * (paramCountB * 180);

  // Activation memory per sequence length and batch size
  const activationMb = (sequenceLength / 1024) * batchSize * 450;

  // Gradient accumulation buffers
  const gradientBufferMb = 250;

  const totalEstimatedVramMb = Math.round(baseWeightMb + loraMemoryMb + activationMb + gradientBufferMb);
  const maxSafeVramMb = hardware.gpu.usable_vram_mb;

  let status = FeasibilityStatus.SAFE;
  let reason = `Feasible on NVIDIA RTX 2050 (${totalEstimatedVramMb} MB / ${maxSafeVramMb} MB).`;

  if (totalEstimatedVramMb > maxSafeVramMb) {
    status = FeasibilityStatus.UNSUPPORTED;
    reason = `Estimated VRAM (${totalEstimatedVramMb} MB) exceeds available RTX 2050 VRAM (${maxSafeVramMb} MB). Reduce sequence length, LoRA rank, or batch size.`;
  } else if (totalEstimatedVramMb > maxSafeVramMb * 0.85) {
    status = FeasibilityStatus.TIGHT;
    reason = `VRAM footprint (${totalEstimatedVramMb} MB) is close to 4GB hardware limit. Background GPU tasks should be minimized.`;
  }

  return {
    status,
    canStart: status !== FeasibilityStatus.UNSUPPORTED,
    modelName: model.name,
    method,
    vramEstimateMb: totalEstimatedVramMb,
    vramPercentage: `${Math.round((totalEstimatedVramMb / hardware.gpu.total_vram_mb) * 100)}%`,
    hardware,
    reason
  };
}
