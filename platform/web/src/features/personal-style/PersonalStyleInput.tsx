/**
 * 301 SUPER AI — Personal Style Lab Input
 * Modern glassmorphism chat input bar with Enter submission, arrow send icon,
 * disabled states during generation, and suggestion population support.
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { usePersonalStyleStore } from './personal-style.store';

export interface PersonalStyleInputRef {
  setValue: (val: string) => void;
  focus: () => void;
}

export interface PersonalStyleInputProps {
  placeholder?: string;
}

export const PersonalStyleInput = forwardRef<PersonalStyleInputRef, PersonalStyleInputProps>(
  ({ placeholder = 'Type a message...' }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const isGenerating = usePersonalStyleStore((s) => s.isGenerating);
    const sendMessage = usePersonalStyleStore((s) => s.sendMessage);
    const stopGeneration = usePersonalStyleStore((s) => s.stopGeneration);

    useImperativeHandle(ref, () => ({
      setValue: (val: string) => {
        setInputValue(val);
        inputRef.current?.focus();
      },
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    // Auto-focus input when generation completes
    useEffect(() => {
      if (!isGenerating) {
        inputRef.current?.focus();
      }
    }, [isGenerating]);

    const handleSend = () => {
      if (isGenerating) {
        void stopGeneration();
        return;
      }
      const text = inputValue.trim();
      if (!text) return;
      setInputValue('');
      void sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const isSendDisabled = !isGenerating && !inputValue.trim();

    return (
      <footer
        style={{
          minHeight: '68px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.35)',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Input Field Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '24px',
            padding: '2px 8px 2px 16px',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.35)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocusCapture={(e) => {
            e.currentTarget.style.borderColor = '#a855f7';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(168, 85, 247, 0.35), inset 0 2px 4px rgba(0, 0, 0, 0.35)';
          }}
          onBlurCapture={(e) => {
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.35)';
          }}
        >
          <input
            id="psInput"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder={isGenerating ? 'Generating response...' : placeholder}
            style={{
              flex: 1,
              height: '42px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.92rem',
              opacity: isGenerating ? 0.6 : 1,
              cursor: isGenerating ? 'not-allowed' : 'text',
            }}
          />
        </div>

        {/* Send / Stop Button */}
        <button
          id="psSendBtn"
          type="button"
          onClick={handleSend}
          disabled={isSendDisabled}
          title={isGenerating ? 'Stop generation' : 'Send message'}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: isGenerating
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : isSendDisabled
              ? 'rgba(100, 116, 139, 0.3)'
              : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
            color: isSendDisabled ? '#64748b' : '#ffffff',
            cursor: isSendDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isSendDisabled
              ? 'none'
              : isGenerating
              ? '0 0 14px rgba(239, 68, 68, 0.6)'
              : '0 0 16px rgba(168, 85, 247, 0.55)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            if (!isSendDisabled) {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isGenerating ? (
            /* Stop Square Icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="5" width="14" height="14" rx="2" />
            </svg>
          ) : (
            /* Arrow Icon */
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: 'translateX(1px)' }}
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" fillOpacity="0.25" />
            </svg>
          )}
        </button>
      </footer>
    );
  }
);

PersonalStyleInput.displayName = 'PersonalStyleInput';
