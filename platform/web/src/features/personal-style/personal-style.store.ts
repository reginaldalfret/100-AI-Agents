/**
 * 301 SUPER AI — Personal Style Lab Store (Zustand)
 * State management for local Gemma 3 1B Kaviya LoRA chat runtime.
 */

import { create } from 'zustand';
import type {
  PersonalStyleMessage,
  PersonalStyleStatus,
  PersonalStyleStreamEvent,
  ModelMode,
} from './personal-style.types';

export interface PersonalStyleState {
  // State
  messages: PersonalStyleMessage[];
  sessionId: string;
  isGenerating: boolean;
  isModelReady: boolean;
  abortController: AbortController | null;
  modelMode: ModelMode;
  status: PersonalStyleStatus | null;
  error: string | null;
  isInfoModalOpen: boolean;

  // Actions
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => Promise<void>;
  resetSession: () => Promise<void>;
  checkStatus: () => Promise<void>;
  setModelMode: (mode: ModelMode) => void;
  setInfoModalOpen: (open: boolean) => void;
  clearError: () => void;
}

const generateSessionId = (): string => `ps-session-${Date.now()}`;

export const usePersonalStyleStore = create<PersonalStyleState>((set, get) => ({
  messages: [],
  sessionId: generateSessionId(),
  isGenerating: false,
  isModelReady: true,
  abortController: null,
  modelMode: 'finetuned',
  status: null,
  error: null,
  isInfoModalOpen: false,

  setModelMode: (mode: ModelMode) => {
    set({ modelMode: mode });
  },

  setInfoModalOpen: (open: boolean) => {
    set({ isInfoModalOpen: open });
  },

  clearError: () => {
    set({ error: null });
  },

  checkStatus: async () => {
    try {
      const response = await fetch('/api/personal-style/gemma/status', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Status check failed with HTTP ${response.status}`);
      }

      const data: PersonalStyleStatus = await response.json();
      const isReady = data.status === 'READY' || Boolean(data.model_loaded);

      set({
        status: data,
        isModelReady: isReady,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach status endpoint';
      set({
        isModelReady: false,
        error: message,
      });
    }
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || get().isGenerating) {
      return;
    }

    const { sessionId, modelMode } = get();
    const isBase = modelMode === 'base';
    const modelName = isBase ? 'google/gemma-3-1b-it' : '301-gemma-kaviya-style-v1';

    const userMessage: PersonalStyleMessage = {
      id: `msg-user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      model: modelName,
      isBase,
    };

    const assistantMessageId = `msg-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const assistantPlaceholder: PersonalStyleMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      model: modelName,
      isBase,
    };

    const controller = new AbortController();

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isGenerating: true,
      abortController: controller,
      error: null,
    }));

    try {
      const response = await fetch('/api/personal-style/gemma/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
        body: JSON.stringify({
          session_id: sessionId,
          model: modelName,
          is_base: isBase,
          stream: true,
          messages: [{ role: 'user', content: trimmed }],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser environment');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data:')) continue;

          const dataPayload = trimmedLine.slice(5).trim();
          if (!dataPayload || dataPayload === '[DONE]') continue;

          try {
            const event: PersonalStyleStreamEvent = JSON.parse(dataPayload);

            if (event.type === 'token') {
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: m.content + event.text }
                    : m
                ),
              }));
            } else if (event.type === 'done') {
              set((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: m.content || event.fullText || '',
                        isStreaming: false,
                      }
                    : m
                ),
              }));
            } else if (event.type === 'error') {
              set((state) => ({
                error: event.error,
                messages: state.messages.map((m) =>
                  m.id === assistantMessageId
                    ? {
                        ...m,
                        content: m.content || `[Generation error: ${event.error}]`,
                        isStreaming: false,
                      }
                    : m
                ),
              }));
            }
          } catch {
            // Ignore partial/malformed chunk parse errors
          }
        }
      }

      // Finalize the active streaming message once stream terminates
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantMessageId ? { ...m, isStreaming: false } : m
        ),
      }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Generation was cancelled intentionally by user
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, isStreaming: false, content: m.content || '[Generation stopped]' }
              : m
          ),
        }));
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown generation failure';
        set((state) => ({
          error: errorMessage,
          messages: state.messages.map((m) =>
            m.id === assistantMessageId
              ? { ...m, isStreaming: false, content: m.content || `[Error: ${errorMessage}]` }
              : m
          ),
        }));
      }
    } finally {
      set({
        isGenerating: false,
        abortController: null,
      });
    }
  },

  stopGeneration: async () => {
    const { abortController, sessionId } = get();

    if (abortController) {
      abortController.abort();
    }

    set((state) => ({
      isGenerating: false,
      abortController: null,
      messages: state.messages.map((m) =>
        m.isStreaming ? { ...m, isStreaming: false } : m
      ),
    }));

    try {
      await fetch('/api/personal-style/gemma/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // Non-blocking best effort stop notify
    }
  },

  resetSession: async () => {
    await get().stopGeneration();
    const { sessionId } = get();

    try {
      await fetch('/api/personal-style/gemma/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // Non-blocking best effort reset notify
    }

    set({
      messages: [],
      sessionId: generateSessionId(),
      error: null,
      isGenerating: false,
      abortController: null,
    });
  },
}));
