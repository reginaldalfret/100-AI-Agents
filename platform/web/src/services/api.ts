/**
 * 301 Super AI Workbench — Typed API Client
 * Relative /api/* endpoints routed through proxy
 */

import type {
  Agent,
  ApiResponse,
  ArenaModel,
  ChatMessage,
  Dataset,
  DatasetQueryResult,
  FineTuneJob,
  Model,
} from '../types';

// ============================================================================
// REQUEST PAYLOAD TYPES
// ============================================================================

export interface ChatRequestPayload {
  agent_id?: string;
  task?: string;
  message?: string;
  prompt?: string;
  stream?: boolean;
  modelMode?: 'auto' | 'manual';
  model_override?: string;
  requested_model?: string;
  mode?: 'general' | 'knowledge' | 'knowledge-rag' | string;
  knowledgeMode?: boolean;
  domain?: string;
  tag?: string;
  folder?: string;
  topK?: number;
  attachments?: Array<{
    name: string;
    type?: string;
    content?: string;
    base64?: string;
    size?: number;
  }>;
  parameters?: Record<string, unknown>;
  trace_id?: string;
  conversation_id?: string;
}

export interface PersonalStyleChatPayload {
  session_id?: string;
  model?: string;
  is_base?: boolean;
  stream?: boolean;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  prompt?: string;
}

export interface PersonalStyleStatus {
  state: 'UNLOADED' | 'INITIALIZING' | 'READY' | 'BUSY' | 'ERROR';
  adapter_loaded: boolean;
  base_model: string;
  active_session?: string | null;
  healthy: boolean;
  hardware?: string;
  uptime_seconds?: number;
}

export interface SystemHealthStatus {
  status: string;
  service: string;
  public_url?: string;
  gateway: string;
  ollama: string;
  python: string;
  database: string;
  rag: string;
  agents: string;
  total_agents: number;
  models_available: number;
  is_air_gapped: boolean;
  external_ai_calls: number;
  timestamp: string;
}

// ============================================================================
// HELPER METHODS
// ============================================================================

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
    try {
      const errBody = await response.json();
      if (errBody?.error) {
        errorMessage = typeof errBody.error === 'string' ? errBody.error : errBody.error.message || errorMessage;
      } else if (errBody?.message) {
        errorMessage = errBody.message;
      }
    } catch {
      // Body not JSON, stick with status text
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// API CLIENT IMPLEMENTATION
// ============================================================================

/**
 * Fetch all available local Ollama & native models
 */
export async function getModels(): Promise<{ models: Model[]; total: number }> {
  const res = await fetchJson<ApiResponse<{ models: Model[] }> & { models?: Model[]; total?: number }>('/api/models');
  const models = res.models || (res.data as { models: Model[] })?.models || [];
  return {
    models,
    total: res.total ?? models.length,
  };
}

/**
 * Fetch all available autonomous agents from the registry
 */
export async function getAgents(): Promise<{ agents: Agent[]; total: number }> {
  const res = await fetchJson<{ agents: Agent[]; total: number }>('/api/agents');
  return {
    agents: res.agents || [],
    total: res.total ?? (res.agents ? res.agents.length : 0),
  };
}

/**
 * Send chat prompt or multi-agent task (streaming or non-streaming)
 * Returns the raw Response object to allow SSE consumption or direct JSON resolution
 */
export async function sendChat(
  payload: ChatRequestPayload,
  signal?: AbortSignal
): Promise<Response> {
  return fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: payload.stream !== false ? 'text/event-stream, application/json' : 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * Fetch models configured for Model Arena comparison
 */
export async function getArenaModels(): Promise<{ models: ArenaModel[]; total: number }> {
  const res = await fetchJson<{ status: string; models: ArenaModel[]; total: number }>('/api/model-arena/models');
  return {
    models: res.models || [],
    total: res.total ?? (res.models ? res.models.length : 0),
  };
}

/**
 * Initiate Model Arena side-by-side comparison
 * Returns raw Response for SSE consumption
 */
export async function compareArena(
  prompt: string,
  modelIds?: string[],
  signal?: AbortSignal
): Promise<Response> {
  return fetch('/api/model-arena/compare', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      prompt,
      model_ids: modelIds && modelIds.length > 0 ? modelIds : undefined,
    }),
    signal,
  });
}

/**
 * Cancel the currently running Model Arena comparison
 */
export async function cancelArena(): Promise<{ status: string; message?: string }> {
  return fetchJson<{ status: string; message?: string }>('/api/model-arena/cancel', {
    method: 'POST',
  });
}

/**
 * Clear the Model Arena state and reset results
 */
export async function clearArena(): Promise<{ status: string; message?: string }> {
  return fetchJson<{ status: string; message?: string }>('/api/model-arena/clear', {
    method: 'POST',
  });
}

/**
 * Send personal style chat generation request
 * Returns raw Response for SSE stream parsing
 */
export async function personalStyleChat(
  payload: PersonalStyleChatPayload,
  signal?: AbortSignal
): Promise<Response> {
  return fetch('/api/personal-style/gemma/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: payload.stream !== false ? 'text/event-stream, application/json' : 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      stream: payload.stream !== false,
    }),
    signal,
  });
}

/**
 * Query current health and runtime status of Personal Style Gemma model
 */
export async function personalStyleStatus(): Promise<PersonalStyleStatus> {
  return fetchJson<PersonalStyleStatus>('/api/personal-style/gemma/status');
}

/**
 * Reset personal style session context
 */
export async function personalStyleReset(sessionId?: string): Promise<{ status: string; session_id?: string }> {
  return fetchJson<{ status: string; session_id?: string }>('/api/personal-style/gemma/reset', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

/**
 * Stop active generation for personal style session
 */
export async function personalStyleStop(sessionId?: string): Promise<{ status: string; session_id?: string }> {
  return fetchJson<{ status: string; session_id?: string }>('/api/personal-style/gemma/stop', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

/**
 * List all available datasets
 */
export async function getDatasets(): Promise<{ datasets: Dataset[]; total: number }> {
  const res = await fetchJson<{ status: string; datasets: Dataset[]; total: number }>('/api/datasets/list');
  return {
    datasets: res.datasets || [],
    total: res.total ?? (res.datasets ? res.datasets.length : 0),
  };
}

/**
 * Query a dataset with natural language or deterministic SQL
 */
export async function queryDataset(params: {
  datasetId: string;
  question?: string;
  sql?: string;
}): Promise<DatasetQueryResult> {
  return fetchJson<DatasetQueryResult>('/api/datasets/query', {
    method: 'POST',
    body: JSON.stringify({
      dataset_id: params.datasetId,
      question: params.question,
      sql: params.sql,
    }),
  });
}

/**
 * List all fine-tuning jobs and status
 */
export async function getFineTuneJobs(): Promise<{ jobs: FineTuneJob[]; total: number }> {
  const res = await fetchJson<{ status: string; jobs: FineTuneJob[]; total: number }>('/api/finetuning/jobs');
  return {
    jobs: res.jobs || [],
    total: res.total ?? (res.jobs ? res.jobs.length : 0),
  };
}

/**
 * System-wide air-gapped health check
 */
export async function getHealth(): Promise<SystemHealthStatus> {
  return fetchJson<SystemHealthStatus>('/api/health');
}

export const api = {
  getModels,
  getAgents,
  sendChat,
  getArenaModels,
  compareArena,
  cancelArena,
  clearArena,
  personalStyleChat,
  personalStyleStatus,
  personalStyleReset,
  personalStyleStop,
  getDatasets,
  queryDataset,
  getFineTuneJobs,
  getHealth,
};
