/**
 * ArenaPromptBar Component
 * Provides prompt textarea input, Compare All, Stop All, Clear buttons,
 * and the Research Mode toggle.
 */

import React, { useCallback } from 'react';
import { useArenaStore } from './arena.store';

export interface ArenaPromptBarProps {
  prompt?: string;
  isGenerating?: boolean;
  researchMode?: boolean;
  onPromptChange?: (val: string) => void;
  onCompare?: () => void;
  onStop?: () => void;
  onClear?: () => void;
  onToggleResearch?: (enabled: boolean) => void;
}

export const ArenaPromptBar: React.FC<ArenaPromptBarProps> = ({
  prompt: propPrompt,
  isGenerating: propIsGenerating,
  researchMode: propResearchMode,
  onPromptChange,
  onCompare,
  onStop,
  onClear,
  onToggleResearch,
}) => {
  const storePrompt = useArenaStore((state) => state.prompt);
  const storeIsGenerating = useArenaStore((state) => state.isGenerating);
  const storeResearchMode = useArenaStore((state) => state.researchMode);
  const setPrompt = useArenaStore((state) => state.setPrompt);
  const runComparison = useArenaStore((state) => state.runComparison);
  const stopAll = useArenaStore((state) => state.stopAll);
  const clearAll = useArenaStore((state) => state.clearAll);
  const toggleResearchMode = useArenaStore((state) => state.toggleResearchMode);

  const prompt = propPrompt !== undefined ? propPrompt : storePrompt;
  const isGenerating = propIsGenerating !== undefined ? propIsGenerating : storeIsGenerating;
  const researchMode = propResearchMode !== undefined ? propResearchMode : storeResearchMode;

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      if (onPromptChange) {
        onPromptChange(val);
      } else {
        setPrompt(val);
      }
    },
    [onPromptChange, setPrompt]
  );

  const handleCompare = useCallback(() => {
    if (onCompare) {
      onCompare();
    } else {
      runComparison();
    }
  }, [onCompare, runComparison]);

  const handleStop = useCallback(() => {
    if (onStop) {
      onStop();
    } else {
      stopAll();
    }
  }, [onStop, stopAll]);

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else {
      clearAll();
    }
  }, [onClear, clearAll]);

  const handleResearchToggle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      if (onToggleResearch) {
        onToggleResearch(checked);
      } else {
        toggleResearchMode(checked);
      }
    },
    [onToggleResearch, toggleResearchMode]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGenerating && prompt.trim()) {
          handleCompare();
        }
      }
    },
    [handleCompare, isGenerating, prompt]
  );

  return (
    <div className="arena-prompt-bar">
      {/* Prompt Textarea */}
      <textarea
        id="arenaPromptInput"
        className="arena-prompt-input"
        placeholder="Enter prompt to evaluate across 8 local GPU models simultaneously (Ctrl+Enter to Run)..."
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyDown}
        rows={2}
      />

      {/* Action Buttons & Research Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Research Mode Toggle */}
        <label className="arena-research-toggle" title="Toggle detailed hardware & generation metrics">
          <input
            id="arenaResearchMode"
            type="checkbox"
            checked={researchMode}
            onChange={handleResearchToggle}
          />
          <span>Research Mode</span>
        </label>

        {/* Compare All Button */}
        <button
          id="btnArenaCompare"
          type="button"
          className="arena-btn arena-btn-primary"
          onClick={handleCompare}
          disabled={isGenerating || !prompt.trim()}
          title="Queue prompt to all 8 models sequentially on GPU"
        >
          {isGenerating ? 'Comparing...' : 'Compare All'}
        </button>

        {/* Stop All Button */}
        <button
          id="btnArenaStopAll"
          type="button"
          className="arena-btn arena-btn-danger"
          onClick={handleStop}
          disabled={!isGenerating}
          title="Halt current model generation"
        >
          Stop All
        </button>

        {/* Clear Button */}
        <button
          id="btnArenaClear"
          type="button"
          className="arena-btn arena-btn-secondary"
          onClick={handleClear}
          disabled={isGenerating}
          title="Clear all prompt results"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default ArenaPromptBar;
