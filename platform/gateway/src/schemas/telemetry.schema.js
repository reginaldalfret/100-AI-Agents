import { z } from 'zod';

export const TelemetryEventSchema = z.object({
  event_type: z.string().min(1),
  component: z.string().optional(),
  trace_id: z.string().optional(),
  duration_ms: z.number().nonnegative().optional(),
  status: z.enum(['success', 'error', 'pending']).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
});
