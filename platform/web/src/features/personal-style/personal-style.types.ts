/**
 * 301 SUPER AI — Personal Style Lab Types
 * Production TypeScript definitions for Gemma Kaviya Style Chat & Runtime telemetry.
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface PersonalStyleMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  model?: string;
  isBase?: boolean;
}

export interface PersonalStyleSession {
  sessionId: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  modelId: string;
}

export interface PersonalStyleStatus {
  status: 'UNLOADED' | 'LOADING' | 'READY' | 'BUSY' | 'ERROR' | string;
  model: string;
  base_model: string;
  model_loaded: boolean;
  adapter_loaded: boolean;
  tokenizer_loaded: boolean;
  device: 'cuda' | 'cpu' | string;
  vram_allocated_mb?: number;
  active_sessions?: number;
  queue_length?: number;
  local_only?: boolean;
  hardware_safe?: boolean;
}

export interface PersonalStyleStreamTokenEvent {
  type: 'token';
  text: string;
}

export interface PersonalStyleStreamDoneEvent {
  type: 'done';
  fullText?: string;
  session_id?: string;
}

export interface PersonalStyleStreamErrorEvent {
  type: 'error';
  error: string;
}

export type PersonalStyleStreamEvent =
  | PersonalStyleStreamTokenEvent
  | PersonalStyleStreamDoneEvent
  | PersonalStyleStreamErrorEvent;

export type ModelMode = 'finetuned' | 'base';

export interface ModelInfoSpec {
  modelId: string;
  displayName: string;
  baseModel: string;
  adapter: string;
  method: string;
  hardwareSafe: string;
  networkPolicy: string;
  disclosure: string;
}
