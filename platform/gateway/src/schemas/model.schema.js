import { z } from 'zod';

export const ModelQuerySchema = z.object({
  modality: z.enum(['text', 'vision', 'code', 'ocr', 'embedding']).optional(),
  runtime_type: z.enum(['OLLAMA', 'LLAMACPP', 'EXECUTORCH', 'MLX', 'ONNXRUNTIME', 'PYTORCH']).optional(),
  execution_target: z.enum(['GPU', 'CPU', 'NPU']).optional(),
  ready_only: z.boolean().optional()
});
