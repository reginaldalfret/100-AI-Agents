/**
 * 301 SUPER AI — Personal Style Lab
 * Apple Liquid Glass-inspired Mobile-First Messaging Interface
 * Houses PersonalStyleHeader, PersonalStyleChat, and floating GlassInput composer.
 * Restrained glass: header and input float gracefully over calm chat bubbles.
 */

import React, { useRef } from 'react';
import { PersonalStyleHeader } from './PersonalStyleHeader';
import { PersonalStyleChat } from './PersonalStyleChat';
import { PersonalStyleInput, PersonalStyleInputRef } from './PersonalStyleInput';
import { usePersonalStyleStore } from './personal-style.store';

export interface PersonalStyleLabProps {
  onBack?: () => void;
}

export const PersonalStyleLab: React.FC<PersonalStyleLabProps> = ({ onBack }) => {
  const inputRef = useRef<PersonalStyleInputRef>(null);
  const isModelReady = usePersonalStyleStore((s) => s.isModelReady);
  const isGenerating = usePersonalStyleStore((s) => s.isGenerating);
  const modelMode = usePersonalStyleStore((s) => s.modelMode);
  const isInfoModalOpen = usePersonalStyleStore((s) => s.isInfoModalOpen);
  const setInfoModalOpen = usePersonalStyleStore((s) => s.setInfoModalOpen);

  const handleSelectPrompt = (prompt: string) => {
    inputRef.current?.setValue(prompt);
    inputRef.current?.focus();
  };

  return (
    <div
      id="personalStyleView"
      className="personal-style-lab-root view-panel ps-chat-view-container active"
      style={{
        flex: 1,
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--lg-bg-canvas)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Mobile-first centered phone container */}
      <div
        className="personal-style-container"
        style={{
          width: '100%',
          maxWidth: '760px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: 'var(--lg-surface-base)',
          borderLeft: '1px solid var(--lg-glass-border)',
          borderRight: '1px solid var(--lg-glass-border)',
          boxShadow: '0 0 40px rgba(0,0,0,0.3)',
        }}
      >
        {/* 1. Floating Liquid Glass Header */}
        <PersonalStyleHeader onBack={onBack} />

        {/* 2. Chat Content (NON-GLASS / CLEAN CALM SPEECH BUBBLES) */}
        <PersonalStyleChat onSelectPrompt={handleSelectPrompt} />

        {/* 3. Floating Bottom Composer Bar */}
        <div
          className="personal-style-composer-dock"
          style={{
            padding: '12px 16px',
            background: 'var(--lg-glass-bg)',
            backdropFilter: 'var(--lg-glass-blur)',
            WebkitBackdropFilter: 'var(--lg-glass-blur)',
            borderTop: '1px solid var(--lg-glass-border)',
            position: 'relative',
            zIndex: 20,
          }}
        >
          <PersonalStyleInput ref={inputRef} placeholder="Type a message to Kaviya style model..." />
        </div>

        {/* 4. Model Info Modal Sheet (Liquid Glass Popover) */}
        {isInfoModalOpen && (
          <div
            className="lg-modal-backdrop"
            onClick={() => setInfoModalOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              className="lg-glass-surface"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '440px',
                padding: '24px',
                borderRadius: 'var(--lg-radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--lg-text-primary)' }}>
                  Model Architecture & Persona
                </h3>
                <button
                  type="button"
                  onClick={() => setInfoModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--lg-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--lg-text-secondary)', lineHeight: 1.5 }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong style={{ color: 'var(--lg-text-primary)' }}>Base Model:</strong> Google Gemma 3 1B Instruct
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong style={{ color: 'var(--lg-text-primary)' }}>LoRA Adapter:</strong> 301-gemma-kaviya-style-v1 (16-rank PEFT adapter)
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong style={{ color: 'var(--lg-text-primary)' }}>Hardware Budget:</strong> Strict 4GB VRAM envelope (RTX 2050 Safe)
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  <strong style={{ color: 'var(--lg-text-primary)' }}>Privacy Attestation:</strong> Air-gapped on-premise inference. All private identifiers scrubbed prior to LoRA parameter calibration.
                </p>
              </div>

              <button
                type="button"
                className="lg-glass-btn lg-glass-btn-primary"
                onClick={() => setInfoModalOpen(false)}
                style={{ width: '100%', marginTop: '8px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default PersonalStyleLab;
