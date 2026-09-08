import { z } from 'zod';

export const FineTuneJobCreateSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  baseModel: z.string().default('google/gemma-3-1b-it'),
  dataset: z.string().min(1, 'Dataset identifier is required'),
  method: z.enum(['LoRA', 'QLoRA', 'Full']).default('QLoRA'),
  epochs: z.number().int().positive().max(100).default(3),
  learningRate: z.string().regex(/^[\d.eE+-]+$/, 'Invalid learning rate format').default('2e-4'),
  batchSize: z.number().int().positive().max(64).default(1),
  lora_r: z.number().int().positive().optional(),
  lora_alpha: z.number().int().positive().optional()
});
