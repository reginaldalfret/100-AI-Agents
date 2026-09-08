import { z } from 'zod';
import { LOCAL_MODELS } from '../../../models/model-registry.js';

const ALLOWED_ARENA_MODEL_IDS = new Set(LOCAL_MODELS.map(m => m.model_id));

export const ArenaCompareSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt cannot be empty'),
  model_ids: z.array(z.string().refine(id => ALLOWED_ARENA_MODEL_IDS.has(id), {
    message: 'Model ID must exist in model registry'
  })).length(8, 'Model Arena must compare exactly 8 models').optional(),
  stream: z.boolean().optional(),
  comparison_id: z.string().uuid().optional(),
  parameters: z.record(z.string(), z.unknown()).optional()
});

export const ArenaActionSchema = z.object({
  comparison_id: z.string().optional()
});
