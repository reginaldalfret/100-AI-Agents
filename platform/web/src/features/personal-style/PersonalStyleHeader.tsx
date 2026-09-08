/**
 * 301 SUPER AI — Personal Style Lab Header
 * WhatsApp-style glassmorphism chat header with real-time status and controls.
 */

import React from 'react';
import { usePersonalStyleStore } from './personal-style.store';

export interface PersonalStyleHeaderProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export const PersonalStyleHeader: React.FC<PersonalStyleHeaderProps> = ({
  onBack,
  title = 'Gemma Kaviya Style',
  subtitle = '● Local AI - 4GB GPU Safe',
}) => {
  const isGenerating = usePersonalStyleStore((s) => s.isGenerating);
  const isModelReady = usePersonalStyleStore((s) => s.isModelReady);
  const modelMode = usePersonalStyleStore((s) => s.modelMode);
  const stopGeneration = usePersonalStyleStore((s) => s.stopGeneration);
  const resetSession = usePersonalStyleStore((s) => s.resetSession);
  const setModelMode = usePersonalStyleStore((s) => s.setModelMode);
  const setInfoModalOpen = usePersonalStyleStore((s) => s.setInfoModalOpen);

  const toggleModel = () => {
    setModelMode(modelMode === 'finetuned' ? 'base' : 'finetuned');
  };

  return (
    <header
      style={{
        height: '64px',
        minHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        zIndex: 30,
        position: 'relative',
      }}
    >
      {/* Left side: Back + Avatar + Contact Information */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            title="Back"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f8fafc';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Avatar with luxury gradient border */}
        <div
          style={{
            position: 'relative',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #06b6d4 100%)',
            padding: '2px',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.45)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#0b1028',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f8fafc',
              fontWeight: 700,
              fontSize: '1.05rem',
              letterSpacing: '0.05em',
            }}
          >
            K
          </div>
          {/* Active online pulse ring */}
          <span
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isModelReady ? '#10b981' : '#f59e0b',
              boxShadow: isModelReady ? '0 0 8px #10b981' : '0 0 8px #f59e0b',
              border: '2px solid #060919',
            }}
          />
        </div>

        {/* Title and Telemetry Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                color: '#f8fafc',
                fontWeight: 600,
                fontSize: '0.96rem',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '1px 6px',
                borderRadius: '9999px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c4b5fd',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}
            >
              PEFT LoRA
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              color: '#94a3b8',
              marginTop: '2px',
            }}
          >
            <span
              style={{
                color: '#10b981',
                fontSize: '0.7rem',
                display: 'inline-block',
              }}
            >
              ●
            </span>
            <span style={{ color: '#10b981', fontWeight: 500 }}>
              {subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Model Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleModel}
          title="Click to toggle between Fine-Tuned LoRA and Base Gemma"
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '12px',
            cursor: 'pointer',
            border: modelMode === 'finetuned'
              ? '1px solid rgba(236, 72, 153, 0.45)'
              : '1px solid rgba(59, 130, 246, 0.45)',
            background: modelMode === 'finetuned'
              ? 'rgba(236, 72, 153, 0.16)'
              : 'rgba(59, 130, 246, 0.16)',
            color: modelMode === 'finetuned' ? '#f472b6' : '#93c5fd',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
          }}
        >
          <span>{modelMode === 'finetuned' ? 'Fine-Tuned' : 'Base Gemma'}</span>
        </button>

        {/* Stop Button (Active during generation) */}
        {isGenerating && (
          <button
            type="button"
            onClick={() => void stopGeneration()}
            title="Stop generation"
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#f87171',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <span style={{ fontSize: '0.7rem' }}>■</span>
            <span>Stop</span>
          </button>
        )}

        {/* Reset Chat Session Button */}
        <button
          type="button"
          onClick={() => void resetSession()}
          title="Reset conversation"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f8fafc';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>

        {/* Model Info Button */}
        <button
          type="button"
          onClick={() => setInfoModalOpen(true)}
          title="Model Information & Disclaimers"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#38bdf8';
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>
    </header>
  );
};
