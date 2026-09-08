export type CategoryType =
  | 'all'
  | 'Coding'
  | 'Frontend'
  | 'Backend'
  | 'Databases'
  | 'Cloud'
  | 'AI/ML'
  | 'Cybersecurity'
  | 'QA'
  | 'Release'
  | 'Data'
  | 'Writing'
  | 'Research'
  | 'Business';

export interface Agent {
  id: string;
  agent_id?: string;
  name: string;
  displayName?: string;
  displayNumber: string;
  category: string;
  domain?: string;
  description: string;
  model?: string;
  status: 'ready' | 'active' | 'offline' | 'busy';
  examples?: string[];
  capabilities?: string[];
  tools?: string[];
  isSuperAI?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  model?: string;
  agentNumber?: string;
  agentName?: string;
}

export interface Conversation {
  id: string;
  title: string;
  agentId: string;
  agentName: string;
  updatedAt: string;
  pinned: boolean;
  messages: ChatMessage[];
}

export interface ModelOption {
  id: string;
  name: string;
  desc: string;
  context: string;
  vram: string;
  badge: string;
  isDefault?: boolean;
}

export interface Model {
  model_id: string;
  name: string;
  ollama_name?: string;
  provider?: string;
  role?: string;
  runtime?: string;
  runtime_type?: string;
  endpoint?: string;
  execution_target?: string;
  quantization?: string;
  vram_mb?: number;
  ram_mb?: number;
  context_length?: number;
  capabilities?: string[];
  recommended_tasks?: string[];
  priority?: number;
  status?: string;
}

export interface ArenaModel {
  model_id: string;
  name: string;
  ollama_name?: string;
  provider?: string;
  execution_target?: string;
  vram_mb?: number;
  runtime_type?: string;
  quantization?: string;
  status?: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  filename: string;
  format: 'csv' | 'json' | 'parquet' | 'sql';
  rowCount: number;
  sizeBytes: number;
  columns: string[];
  domain: string;
  uploadedAt: string;
  status: 'ready' | 'indexing' | 'error';
}

export interface Dataset {
  id: string;
  name: string;
  filename?: string;
  format?: 'csv' | 'json' | 'parquet' | 'sql' | string;
  rowCount?: number;
  row_count?: number;
  sizeBytes?: number;
  size_bytes?: number;
  columns?: string[];
  domain?: string;
  uploadedAt?: string;
  status?: 'ready' | 'indexing' | 'error' | string;
  description?: string;
}

export interface DatasetQueryResult {
  status: string;
  query?: string;
  sql?: string;
  columns?: string[];
  rows?: any[][];
  results?: any[];
  totalRows?: number;
  executionTimeMs?: number;
  error?: string;
}

export interface FineTuningJob {
  id: string;
  name: string;
  baseModel: string;
  dataset: string;
  method: 'LoRA' | 'QLoRA' | 'Full';
  epochs: number;
  learningRate: string;
  batchSize: number;
  status: 'running' | 'completed' | 'queued' | 'paused' | 'failed';
  progress: number;
  loss: number;
  createdAt: string;
}

export type FineTuneJob = FineTuningJob;

export interface ApiResponse<T = any> {
  status?: string;
  success?: boolean;
  data?: T;
  message?: string;
  error?: string | { message?: string };
}
