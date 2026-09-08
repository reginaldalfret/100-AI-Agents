/**
 * ModelArena Component
 * Side-by-Side GPU Model Comparison Workbench
 * Displays 8 local LLM models in a 4x2 responsive grid, sequential GPU streaming,
 * prompt bar, and real-time token/throughput metrics.
 */

import React, { useEffect, useCallback } from 'react';
import { useArenaStore } from './arena.store';
import { ModelCard } from './ModelCard';
import { ArenaPromptBar } from './ArenaPromptBar';
import { fetchArenaModels } from '../../services/streaming';

export interface ModelArenaProps {
  onBack?: () => void;
}

export const ModelArena: React.FC<ModelArenaProps> = ({ onBack }) => {
  const models = useArenaStore((state) => state.models);
  const results = useArenaStore((state) => state.results);
  const researchMode = useArenaStore((state) => state.researchMode);
  const isGenerating = useArenaStore((state) => state.isGenerating);
  const activeGeneratingModelId = useArenaStore((state) => state.activeGeneratingModelId);

  // Attempt to synchronize available models from gateway on mount if present
  useEffect(() => {
    fetchArenaModels().then((fetched) => {
      if (fetched && fetched.length > 0) {
        console.log('[ModelArena] Available gateway models loaded:', fetched.length);
      }
    });
  }, []);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (typeof (window as unknown as { switchMainView?: (view: string) => void }).switchMainView === 'function') {
      (window as unknown as { switchMainView: (view: string) => void }).switchMainView('agent-workspace');
    } else {
      window.history.back();
    }
  }, [onBack]);

  // Ensure exactly 8 models are shown
  const activeModels = models.slice(0, 8);

  return (
    <div className="arena-view-container active" id="modelArenaView">
      {/* Top Header */}
      <header className="arena-header">
        <button
          id="btnArenaBack"
          type="button"
          className="arena-back-btn"
          onClick={handleBack}
          title="Back to Agent Workspace"
        >
          ← Back to Workspace
        </button>

        <div className="arena-header-title">
          <h2>Model Arena</h2>
          <span className="arena-subtitle">Side-by-Side GPU Model Comparison</span>
        </div>

        <div className="arena-header-actions">
          {isGenerating && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: '#818cf8',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  boxShadow: '0 0 8px #818cf8',
                }}
              />
              <span>
                Active GPU Target:{' '}
                <strong>{activeGeneratingModelId || 'Switching models...'}</strong>
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Prompt Bar with action buttons and research toggle */}
      <ArenaPromptBar />

      {/* 4x2 Responsive Grid */}
      <main className="arena-grid" id="arenaGrid">
        {activeModels.map((modelId) => {
          const cardState = results[modelId] || {
            modelId,
            displayName: modelId,
            status: 'ready' as const,
            text: '',
            liveTokenCount: 0,
            liveTps: 0,
            liveTime: '—',
          };

          return (
            <ModelCard
              key={modelId}
              modelId={modelId}
              displayName={cardState.displayName}
              status={cardState.status}
              text={cardState.text}
              liveTokenCount={cardState.liveTokenCount}
              liveTps={cardState.liveTps}
              liveTime={cardState.liveTime}
              metrics={cardState.metrics}
              isResearchMode={researchMode}
            />
          );
        })}
      </main>
    </div>
  );
};

export default ModelArena;
