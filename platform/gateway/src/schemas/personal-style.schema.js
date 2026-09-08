import { z } from 'zod';

export const PersonalStyleMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

export const PersonalStyleChatSchema = z.object({
  session_id: z.string().optional(),
  model: z.string().optional(),
  is_base: z.boolean().optional(),
  stream: z.boolean().optional(),
  messages: z.array(PersonalStyleMessageSchema).optional(),
  prompt: z.string().optional()
}).refine(data => {
  return Boolean(data.prompt || (data.messages && data.messages.length > 0));
}, {
  message: 'Prompt or at least one message is required'
});

export const PersonalStyleActionSchema = z.object({
  session_id: z.string().optional()
});
