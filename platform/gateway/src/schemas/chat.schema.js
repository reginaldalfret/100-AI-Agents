import { z } from 'zod';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty')
});

export const ChatRequestSchema = z.object({
  agent_id: z.string().nullable().optional(),
  task: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  prompt: z.string().nullable().optional(),
  stream: z.boolean().nullable().optional(),
  modelMode: z.enum(['auto', 'manual']).nullable().optional(),
  model_override: z.string().nullable().optional(),
  requested_model: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  messages: z.array(ChatMessageSchema).nullable().optional(),
  session_id: z.string().nullable().optional(),
  conversation_id: z.string().nullable().optional(),
  conversationId: z.string().nullable().optional(),
  original_task: z.string().nullable().optional(),
  replyTo: z.any().nullable().optional(),
  parameters: z.record(z.string(), z.unknown()).nullable().optional(),
  mode: z.string().nullable().optional(),
  knowledgeMode: z.boolean().nullable().optional(),
  domain: z.string().nullable().optional(),
  tag: z.string().nullable().optional(),
  folder: z.string().nullable().optional(),
  topK: z.number().int().positive().nullable().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    base64: z.string().nullable().optional(),
    data: z.string().nullable().optional(),
    size: z.number().nullable().optional()
  })).nullable().optional(),
  trace_id: z.string().nullable().optional()
}).passthrough().refine(data => {
  return Boolean(
    data.message ||
    data.prompt ||
    data.task ||
    (data.messages && data.messages.length > 0)
  );
}, {
  message: 'At least one of message, prompt, task, or non-empty messages array is required'
});
