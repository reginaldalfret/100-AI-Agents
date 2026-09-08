/**
 * ModelCard Component
 * Displays individual model header, GPU badge, streaming body with blinking cursor,
 * auto-scroll, and research metrics footer.
 */

import React, { useEffect, useRef } from 'react';
import type { ModelCardProps } from './arena.types';

export const ModelCard: React.FC<ModelCardProps> = ({
  modelId,
  displayName,
  status,
  text,
  liveTokenCount,
  liveTps,
  liveTime,
  metrics,
  isResearchMode,
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom as new tokens arrive or status changes
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [text, status]);

  // Compute status pill text and CSS modifier class
  let statusText = 'Ready';
  let statusModifier = 'waiting';

  switch (status) {
    case 'generating':
      statusText = 'Streaming...';
      statusModifier = 'generating';
      break;
    case 'waiting':
      statusText = 'Waiting';
      statusModifier = 'waiting';
      break;
    case 'complete':
      statusText = 'Complete';
      statusModifier = 'complete';
      break;
    case 'error':
      statusText = 'Error';
      statusModifier = 'error';
      break;
    case 'ready':
    default:
      statusText = 'Ready';
      statusModifier = 'waiting';
      break;
  }

  // Format metric values (prefer metrics object if complete, fallback to live values)
  let formattedTime = '—';
  if (metrics?.timeMs) {
    formattedTime = `${(metrics.timeMs / 1000).toFixed(2)}s`;
  } else if (metrics?.duration_ms) {
    formattedTime = `${(metrics.duration_ms / 1000).toFixed(2)}s`;
  } else if (liveTime !== undefined && liveTime !== null && liveTime !== '—') {
    formattedTime = typeof liveTime === 'number' ? `${liveTime.toFixed(1)}s` : String(liveTime);
  }

  let formattedTokens = '—';
  if (metrics?.tokens !== undefined) {
    formattedTokens = String(metrics.tokens);
  } else if (metrics?.eval_count !== undefined) {
    formattedTokens = String(metrics.eval_count);
  } else if (liveTokenCount !== undefined && liveTokenCount > 0) {
    formattedTokens = String(liveTokenCount);
  }

  let formattedTps = '—';
  const resolvedTps = metrics?.tokPerSec ?? metrics?.tokens_per_sec ?? liveTps;
  if (resolvedTps !== undefined && resolvedTps > 0) {
    formattedTps = typeof resolvedTps === 'number' ? resolvedTps.toFixed(1) : String(resolvedTps);
  }

  return (
    <div
      className={`arena-card ${statusModifier}`}
      data-model-id={modelId}
    >
      {/* Header with Model Name, GPU badge, and Status pill */}
      <div className="arena-card-header">
        <span className="arena-card-model-name" title={displayName || modelId}>
          {displayName}
        </span>
        <span className="arena-card-gpu-badge">GPU</span>
        <span
          id={`arenaStatus_${modelId}`}
          className={`arena-card-status ${statusModifier}`}
        >
          {statusText}
        </span>
      </div>

      {/* Response body: Auto-scrolling text with animated blinking cursor */}
      <div
        id={`arenaBody_${modelId}`}
        ref={bodyRef}
        className="arena-card-body"
      >
        {text}
        {status === 'generating' && <span className="arena-cursor" />}
      </div>

      {/* Metrics footer: Time, Tokens, tok/s */}
      <div
        className={`arena-card-metrics ${isResearchMode ? 'visible' : ''}`}
      >
        <span>
          Time:{' '}
          <span
            id={`arenaTime_${modelId}`}
            className="metric-value arena-metric-time"
          >
            {formattedTime}
          </span>
        </span>
        <span>
          Tokens:{' '}
          <span
            id={`arenaTokens_${modelId}`}
            className="metric-value arena-metric-tokens"
          >
            {formattedTokens}
          </span>
        </span>
        <span>
          tok/s:{' '}
          <span
            id={`arenaTps_${modelId}`}
            className="metric-value arena-metric-tps"
          >
            {formattedTps}
          </span>
        </span>
      </div>
    </div>
  );
};

export default ModelCard;
