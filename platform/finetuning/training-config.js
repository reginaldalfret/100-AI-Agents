/**
 * Sovereign AI Workbench — Training Configuration & Hyperparameters
 * Validates, normalizes, and serializes LoRA/QLoRA training configurations.
 */

export const DEFAULT_TRAINING_CONFIG = {
  method: "QLoRA",
  epochs: 3,
  learning_rate: 0.0002,
  batch_size: 1,
  gradient_accumulation_steps: 4,
  sequence_length: 1024,
  lora_rank: 16,
  lora_alpha: 32,
  lora_dropout: 0.05,
  seed: 42,
  optimizer: "adamw_8bit",
  lr_scheduler: "cosine",
  warmup_ratio: 0.03,
  weight_decay: 0.01,
  target_modules: ["q_proj", "v_proj", "k_proj", "o_proj"],
  enable_early_stopping: true,
  patience: 2,
  save_checkpoint_epochs: 1,
  logging_steps: 5
};

export function validateAndNormalizeConfig(input = {}) {
  const config = { ...DEFAULT_TRAINING_CONFIG, ...input };

  // Validate method
  if (config.method !== "QLoRA" && config.method !== "LoRA") {
    config.method = "QLoRA";
  }

  // Bound epochs
  config.epochs = Math.max(1, Math.min(10, parseInt(config.epochs, 10) || 3));

  // Bound batch size
  config.batch_size = Math.max(1, Math.min(8, parseInt(config.batch_size, 10) || 1));

  // Bound gradient accumulation
  config.gradient_accumulation_steps = Math.max(1, Math.min(16, parseInt(config.gradient_accumulation_steps, 10) || 4));

  // Bound sequence length
  config.sequence_length = Math.max(256, Math.min(4096, parseInt(config.sequence_length, 10) || 1024));

  // Bound LoRA rank & alpha
  config.lora_rank = [8, 16, 32, 64].includes(config.lora_rank) ? config.lora_rank : 16;
  config.lora_alpha = config.lora_alpha || config.lora_rank * 2;

  // Bound learning rate
  config.learning_rate = Math.max(1e-6, Math.min(1e-2, parseFloat(config.learning_rate) || 2e-4));

  // Bound dropout
  config.lora_dropout = Math.max(0, Math.min(0.5, parseFloat(config.lora_dropout) || 0.05));

  config.seed = parseInt(config.seed, 10) || 42;
  config.enable_early_stopping = Boolean(config.enable_early_stopping);

  return config;
}
