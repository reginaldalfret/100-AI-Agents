/**
 * Model Arena TypeScript Types
 * Side-by-side GPU Model Comparison workbench
 */

export type ArenaModelStatus = 'ready' | 'waiting' | 'generating' | 'complete' | 'error';

/**
 * Performance metrics for a model generation run
 */
export interface ArenaMetricData {
  timeMs?: number;
  tokens?: number;
  tokPerSec?: number;
  duration_ms?: number;
  eval_count?: number;
  tokens_per_sec?: number;
}

/**
 * State of an individual model card in the arena grid
 */
export interface ArenaModelCardState {
  modelId: string;
  displayName: string;
  status: ArenaModelStatus;
  text: string;
  liveTokenCount?: number;
  liveTps?: number;
  liveTime?: string | number;
  metrics?: ArenaMetricData;
  error?: string;
  startTime?: number;
}

/**
 * Overall comparison state across all 8 models
 */
export interface ArenaComparisonState {
  prompt: string;
  models: string[];
  results: Record<string, ArenaModelCardState>;
  activeGeneratingModelId: string | null;
  isGenerating: boolean;
  researchMode: boolean;
  comparisonId: string | null;
}

/**
 * SSE Stream event types from /api/model-arena/compare
 */
export type ArenaStreamEventType =
  | 'model_start'
  | 'model_token'
  | 'model_complete'
  | 'model_error'
  | 'comparison_complete'
  | 'done'
  | 'error';

export interface ArenaStreamEvent {
  type: ArenaStreamEventType;
  event?: string;
  model_id?: string;
  comparison_id?: string;
  token?: string;
  result?: ArenaMetricData & { text?: string };
  metrics?: ArenaMetricData;
  error?: string;
}

/**
 * Props for ModelCard component
 */
export interface ModelCardProps {
  modelId: string;
  displayName: string;
  status: ArenaModelStatus;
  text: string;
  liveTokenCount?: number;
  liveTps?: number;
  liveTime?: string | number;
  metrics?: ArenaMetricData;
  isResearchMode: boolean;
}
