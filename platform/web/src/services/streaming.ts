/**
 * Streaming Service for Super AI Model Arena & LLM Generation
 * Uses relative /api/* endpoints and handles SSE (Server-Sent Events) streams.
 */

import type { ArenaStreamEvent } from '../features/model-arena/arena.types';

export interface StreamComparisonOptions {
  prompt: string;
  modelIds?: string[];
  signal?: AbortSignal;
  onEvent: (event: ArenaStreamEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/**
 * Initiates an SSE streaming comparison across models.
 * Streams sequential generations respecting single GPU constraint.
 */
export async function streamModelArenaComparison(options: StreamComparisonOptions): Promise<void> {
  const { prompt, modelIds, signal, onEvent, onError, onComplete } = options;

  try {
    const response = await fetch('/api/model-arena/compare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        prompt,
        model_ids: modelIds && modelIds.length > 0 ? modelIds : undefined,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Model Arena API error (${response.status}): ${errorText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported on this response.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(':')) {
          // Keep-alive or comment
          continue;
        }

        if (line.startsWith('data:')) {
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const parsed: ArenaStreamEvent = JSON.parse(jsonStr);
            // Handles 'model_start', 'model_token', 'model_complete', 'model_error', 'comparison_complete'
            onEvent(parsed);
          } catch (parseErr) {
            console.error('[ModelArenaStream] Failed to parse SSE event JSON:', parseErr, line);
          }
        }
      }
    }

    // Flush any remaining buffer
    if (buffer.trim().startsWith('data:')) {
      try {
        const parsed: ArenaStreamEvent = JSON.parse(buffer.trim().slice(5).trim());
        onEvent(parsed);
      } catch (parseErr) {
        console.error('[ModelArenaStream] Failed to parse trailing SSE JSON:', parseErr);
      }
    }

    onComplete?.();
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (error.name === 'AbortError') {
      console.log('[ModelArenaStream] Stream aborted by client.');
    } else {
      console.error('[ModelArenaStream] Stream error:', error);
      onError?.(error);
    }
  }
}

/**
 * Cancels all or specific model comparisons on the server
 */
export async function cancelModelArena(comparisonId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/model-arena/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comparisonId ? { comparison_id: comparisonId } : {}),
    });
    return await response.json();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ModelArena] Cancel error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Clears comparison results and resets active comparison
 */
export async function clearModelArena(comparisonId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/model-arena/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comparisonId ? { comparison_id: comparisonId } : {}),
    });
    return await response.json();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[ModelArena] Clear error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Fetches the list of available arena models from the gateway
 */
export async function fetchArenaModels(): Promise<Array<{ model_id: string; name: string; execution_target?: string }>> {
  try {
    const response = await fetch('/api/model-arena/models');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.models || [];
  } catch (err) {
    console.warn('[ModelArena] Could not fetch models from server, using local defaults', err);
    return [];
  }
}
