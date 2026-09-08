import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty')
});

export const ChatRequestSchema = z.object({
  agent_id: z.string().optional(),
  task: z.string().optional(),
  message: z.string().optional(),
  prompt: z.string().optional(),
  stream: z.boolean().optional(),
  modelMode: z.enum(['auto', 'manual']).optional(),
  model_override: z.string().optional(),
  requested_model: z.string().optional(),
  model: z.string().optional(),
  messages: z.array(ChatMessageSchema).optional(),
  session_id: z.string().optional(),
  conversation_id: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  mode: z.string().optional(),
  knowledgeMode: z.boolean().optional(),
  domain: z.string().optional(),
  tag: z.string().optional(),
  folder: z.string().optional(),
  topK: z.number().int().positive().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string().optional(),
    content: z.string().optional(),
    base64: z.string().optional(),
    size: z.number().optional()
  })).optional(),
  trace_id: z.string().optional()
}).refine(data => {
  return Boolean(
    data.message ||
    data.prompt ||
    data.task ||
    (data.messages && data.messages.length > 0)
  );
}, {
  message: 'At least one of message, prompt, task, or non-empty messages array is required'
});
