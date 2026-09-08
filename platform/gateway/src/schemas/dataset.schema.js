import { z } from 'zod';

export const DatasetQuerySchema = z.object({
  dataset_id: z.string().min(1, 'dataset_id is required'),
  query: z.string().optional(),
  question: z.string().optional(),
  sql: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  filters: z.record(z.string(), z.unknown()).optional()
}).refine(data => Boolean(data.query || data.question || data.sql), {
  message: 'Query, question, or SQL must be provided'
});
