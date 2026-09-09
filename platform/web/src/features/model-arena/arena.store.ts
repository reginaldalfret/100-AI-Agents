/**
 * Zustand Store for Model Arena
 * Manages model list, comparison run lifecycle, SSE stream ingestion, and metrics.
 */

import { create } from 'zustand';
import type {
  ArenaModelCardState,
  ArenaMetricData,
  ArenaStreamEvent,
} from './arena.types';
import {
  streamModelArenaComparison,
  cancelModelArena,
  clearModelArena,
} from '../../services/streaming';

export const DEFAULT_ARENA_MODELS: string[] = [
  'nemotron-3-nano',
  'gemma3-1b',
  'local-code-specialist',
  'llama3.2-1b',
  'granite4-1b-h',
  'phi4-mini',
  'smollm2-1.7b',
  'falcon3-1b-instruct',
];

export const ARENA_MODEL_DISPLAY_NAMES: Record<string, string> = {
  'nemotron-3-nano': 'NVIDIA Nemotron 3 Nano',
  'gemma3-1b': 'Google Gemma 3 1B',
  'local-code-specialist': 'Qwen 2.5 Coder 1.5B',
  'llama3.2-1b': 'Meta Llama 3.2 1B',
  'granite4-1b-h': 'IBM Granite 4 1B-H',
  'phi4-mini': 'Microsoft Phi-4 Mini',
  'smollm2-1.7b': 'SmolLM2 1.7B',
  'falcon3-1b-instruct': 'Falcon3 1B',
};

export function getModelDisplayName(modelId: string): string {
  return (
    ARENA_MODEL_DISPLAY_NAMES[modelId] ||
    modelId.split(':')[0].replace(/-/g, ' ').toUpperCase()
  );
}

export function createInitialResults(models: string[]): Record<string, ArenaModelCardState> {
  const initial: Record<string, ArenaModelCardState> = {};
  for (const id of models) {
    initial[id] = {
      modelId: id,
      displayName: getModelDisplayName(id),
      status: 'ready',
      text: '',
      liveTokenCount: 0,
      liveTps: 0,
      liveTime: '—',
      metrics: undefined,
      startTime: undefined,
    };
  }
  return initial;
}

export interface ArenaState {
  prompt: string;
  models: string[];
  results: Record<string, ArenaModelCardState>;
  activeGeneratingModelId: string | null;
  isGenerating: boolean;
  researchMode: boolean;
  comparisonId: string | null;

  // Actions
  setPrompt: (prompt: string) => void;
  setModel: (index: number, modelId: string) => void;
  toggleResearchMode: (enabled?: boolean) => void;
  runComparison: () => Promise<void>;
  stopAll: () => Promise<void>;
  clearAll: () => Promise<void>;
  handleStreamEvent: (event: ArenaStreamEvent) => void;
}

let activeAbortController: AbortController | null = null;

export const useArenaStore = create<ArenaState>((set, get) => ({
  prompt: '',
  models: [...DEFAULT_ARENA_MODELS],
  results: createInitialResults(DEFAULT_ARENA_MODELS),
  activeGeneratingModelId: null,
  isGenerating: false,
  researchMode: false,
  comparisonId: null,

  setPrompt: (prompt: string) => set({ prompt }),

  setModel: (index: number, modelId: string) => {
    const currentModels = [...get().models];
    if (index >= 0 && index < currentModels.length) {
      currentModels[index] = modelId;
      const currentResults = { ...get().results };
      if (!currentResults[modelId]) {
        currentResults[modelId] = {
          modelId,
          displayName: getModelDisplayName(modelId),
          status: 'ready',
          text: '',
          liveTokenCount: 0,
          liveTps: 0,
          liveTime: '—',
        };
      }
      set({ models: currentModels, results: currentResults });
    }
  },

  toggleResearchMode: (enabled?: boolean) =>
    set((state) => ({
      researchMode: typeof enabled === 'boolean' ? enabled : !state.researchMode,
    })),

  runComparison: async () => {
    const { prompt, models, isGenerating } = get();
    if (!prompt.trim() || isGenerating) return;

    // Cancel any previous run
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    // Prepare all model cards into 'waiting' status
    const preparedResults: Record<string, ArenaModelCardState> = {};
    for (const id of models) {
      preparedResults[id] = {
        modelId: id,
        displayName: getModelDisplayName(id),
        status: 'waiting',
        text: '',
        liveTokenCount: 0,
        liveTps: 0,
        liveTime: '0.0s',
        metrics: undefined,
        startTime: undefined,
      };
    }

    set({
      isGenerating: true,
      activeGeneratingModelId: null,
      results: preparedResults,
    });

    try {
      await streamModelArenaComparison({
        prompt: prompt.trim(),
        modelIds: models,
        signal: activeAbortController.signal,
        onEvent: (event) => {
          get().handleStreamEvent(event);
        },
        onError: (err) => {
          console.error('[ArenaStore] Stream error:', err);
          set({ isGenerating: false, activeGeneratingModelId: null });
        },
        onComplete: () => {
          set({ isGenerating: false, activeGeneratingModelId: null });
        },
      });
    } catch (err) {
      console.error('[ArenaStore] Comparison failed:', err);
    } finally {
      activeAbortController = null;
      set({ isGenerating: false, activeGeneratingModelId: null });
    }
  },

  stopAll: async () => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }

    const { comparisonId, results } = get();
    await cancelModelArena(comparisonId || undefined);

    // Transition any 'generating' or 'waiting' cards to 'ready'
    const updatedResults = { ...results };
    for (const [id, card] of Object.entries(updatedResults)) {
      if (card.status === 'generating' || card.status === 'waiting') {
        updatedResults[id] = {
          ...card,
          status: 'ready',
        };
      }
    }

    set({
      isGenerating: false,
      activeGeneratingModelId: null,
      results: updatedResults,
    });
  },

  clearAll: async () => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }

    const { comparisonId, models } = get();
    await clearModelArena(comparisonId || undefined);

    set({
      isGenerating: false,
      activeGeneratingModelId: null,
      comparisonId: null,
      results: createInitialResults(models),
    });
  },

  handleStreamEvent: (event: ArenaStreamEvent) => {
    const eventType = event.type || event.event;
    if (!eventType) return;

    if (event.comparison_id) {
      set({ comparisonId: event.comparison_id });
    }

    if (eventType === 'comparison_complete' || eventType === 'done') {
      set({
        isGenerating: false,
        activeGeneratingModelId: null,
      });
      return;
    }

    const modelId = event.model_id;
    if (!modelId) return;

    const { results } = get();
    const existing = results[modelId] || {
      modelId,
      displayName: getModelDisplayName(modelId),
      status: 'ready',
      text: '',
    };

    switch (eventType) {
      case 'model_start': {
        set({
          activeGeneratingModelId: modelId,
          results: {
            ...results,
            [modelId]: {
              ...existing,
              status: 'generating',
              text: '',
              liveTokenCount: 0,
              liveTps: 0,
              liveTime: '0.0s',
              startTime: Date.now(),
              error: undefined,
            },
          },
        });
        break;
      }

      case 'model_token': {
        if (!event.token) return;
        const curCount = (existing.liveTokenCount || 0) + 1;
        const sTime = existing.startTime || Date.now();
        const elapsedSec = Math.max((Date.now() - sTime) / 1000, 0.001);
        const liveTps = Number((curCount / elapsedSec).toFixed(1));
        const liveTime = `${elapsedSec.toFixed(1)}s`;

        set({
          results: {
            ...results,
            [modelId]: {
              ...existing,
              status: 'generating',
              text: existing.text + event.token,
              liveTokenCount: curCount,
              liveTps,
              liveTime,
            },
          },
        });
        break;
      }

      case 'model_complete': {
        const metrics: ArenaMetricData | undefined =
          event.result || event.metrics;

        let timeStr = existing.liveTime || '—';
        if (metrics?.timeMs) {
          timeStr = `${(metrics.timeMs / 1000).toFixed(2)}s`;
        } else if (metrics?.duration_ms) {
          timeStr = `${(metrics.duration_ms / 1000).toFixed(2)}s`;
        }

        const tokenCount =
          metrics?.tokens ?? metrics?.eval_count ?? existing.liveTokenCount ?? 0;

        const tpsVal =
          metrics?.tokPerSec ??
          metrics?.tokens_per_sec ??
          existing.liveTps ??
          0;

        set((state) => ({
          activeGeneratingModelId:
            state.activeGeneratingModelId === modelId ? null : state.activeGeneratingModelId,
          results: {
            ...state.results,
            [modelId]: {
              ...existing,
              status: 'complete',
              text: event.result?.text ? event.result.text : existing.text,
              liveTokenCount: tokenCount,
              liveTps: Number(typeof tpsVal === 'number' ? tpsVal.toFixed(1) : tpsVal),
              liveTime: timeStr,
              metrics: metrics || {
                tokens: tokenCount,
                tokPerSec: Number(tpsVal),
              },
            },
          },
        }));
        break;
      }

      case 'model_error': {
        set((state) => ({
          activeGeneratingModelId:
            state.activeGeneratingModelId === modelId ? null : state.activeGeneratingModelId,
          results: {
            ...state.results,
            [modelId]: {
              ...existing,
              status: 'error',
              error: event.error || 'Model execution error',
              text: existing.text || event.error || 'An error occurred during generation.',
            },
          },
        }));
        break;
      }

      default:
        break;
    }
  },
}));
