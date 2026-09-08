import { z } from 'zod';

export const OpenAIChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty')
});

export const OpenAIChatCompletionSchema = z.object({
  model: z.string().min(1, 'Model ID is required'),
  messages: z.array(OpenAIChatMessageSchema).min(1, 'At least one message is required'),
  stream: z.boolean().optional().default(false),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  user: z.string().optional()
});
