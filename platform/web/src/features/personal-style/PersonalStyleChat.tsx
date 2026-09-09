/**
 * 301 SUPER AI — Personal Style Lab Chat View
 * WhatsApp-style bubble layout with violet user bubbles, dark glass assistant bubbles,
 * intrinsic privacy disclaimers, streaming cursors, and auto-scroll behavior.
 */

import React, { useEffect, useRef } from 'react';
import { usePersonalStyleStore } from './personal-style.store';
import type { PersonalStyleMessage } from './personal-style.types';

export interface PersonalStyleChatProps {
  onSelectPrompt?: (prompt: string) => void;
}

const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const PersonalStyleChat: React.FC<PersonalStyleChatProps> = ({ onSelectPrompt }) => {
  const messages = usePersonalStyleStore((s) => s.messages);
  const isGenerating = usePersonalStyleStore((s) => s.isGenerating);
  const sendMessage = usePersonalStyleStore((s) => s.sendMessage);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollSentinelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or streamed tokens
  useEffect(() => {
    if (scrollSentinelRef.current) {
      scrollSentinelRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isGenerating]);

  const handleChipClick = (chipText: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(chipText);
    } else {
      void sendMessage(chipText);
    }
  };

  return (
    <div
      ref={chatContainerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        background: 'var(--lg-surface-base)',
        scrollBehavior: 'smooth',
      }}
    >
      <style>{`
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .ps-streaming-cursor {
          display: inline-block;
          width: 7px;
          height: 15px;
          margin-left: 3px;
          background: #a855f7;
          border-radius: 1px;
          vertical-align: middle;
          animation: blinkCursor 0.8s infinite;
          box-shadow: 0 0 6px rgba(168, 85, 247, 0.8);
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>

      {/* Intrinsic Privacy Disclaimer Pill */}
      <div
        className="ps-privacy-disclaimer"
        style={{
          alignSelf: 'center',
          maxWidth: '92%',
          margin: '0 auto 8px',
          background: 'rgba(30, 27, 75, 0.75)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '9999px',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: '0.85rem' }}>🔒</span>
        <span
          style={{
            fontSize: '0.72rem',
            color: '#c4b5fd',
            fontWeight: 500,
            letterSpacing: '0.01em',
            textAlign: 'center',
            lineHeight: 1.3,
          }}
        >
          AI generated using learned communication patterns. Private records scrubbed.
        </span>
      </div>

      {/* Welcome Card & Starter Chips (Visible when chat is empty) */}
      {messages.length === 0 && (
        <div
          style={{
            margin: 'auto',
            maxWidth: '380px',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '18px',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: '#fff',
              marginBottom: '12px',
              boxShadow: '0 0 16px rgba(236, 72, 153, 0.45)',
            }}
          >
            💬
          </div>

          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: '#f8fafc',
            }}
          >
            Gemma Kaviya Style Lab
          </h3>

          <p
            style={{
              margin: '0 0 18px 0',
              fontSize: '0.82rem',
              color: '#94a3b8',
              lineHeight: 1.45,
            }}
          >
            Chat with the fine-tuned Gemma 3 1B model tuned on expressive, authentic conversational patterns.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              width: '100%',
            }}
          >
            {[
              'how are you?',
              'what are you doing?',
              'tell me something interesting',
              'What do you think about our hackathon project?',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.28)',
                  borderRadius: '20px',
                  padding: '8px 14px',
                  color: '#e2e8f0',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.28)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                ✨ {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Bubbles */}
      {messages.map((msg: PersonalStyleMessage) => {
        const isUser = msg.role === 'user';

        return (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            <div
              style={{
                maxWidth: '82%',
                minWidth: '70px',
                padding: '9px 13px 7px 13px',
                borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                background: isUser
                  ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.92) 0%, rgba(109, 40, 217, 0.95) 100%)'
                  : 'rgba(15, 23, 42, 0.85)',
                color: isUser ? '#f8fafc' : '#e2e8f0',
                border: isUser
                  ? '1px solid rgba(167, 139, 250, 0.45)'
                  : '1px solid rgba(139, 92, 246, 0.25)',
                boxShadow: isUser
                  ? '0 4px 16px rgba(124, 58, 237, 0.35)'
                  : '0 4px 16px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                position: 'relative',
                wordBreak: 'break-word',
                lineHeight: 1.48,
                fontSize: '0.90rem',
              }}
            >
              {/* Model indicator for assistant responses */}
              {!isUser && msg.model && (
                <div
                  style={{
                    fontSize: '0.66rem',
                    color: msg.isBase ? '#93c5fd' : '#f472b6',
                    marginBottom: '4px',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  {msg.isBase ? 'Base Gemma 3 1B' : 'Kaviya LoRA v1'}
                </div>
              )}

              {/* Message Content */}
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
                {msg.isStreaming && <span className="ps-streaming-cursor" />}
                {!msg.content && msg.isStreaming && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#94a3b8',
                      fontSize: '0.82rem',
                    }}
                  >
                    <span>Thinking</span>
                    <span style={{ animation: 'pulseDot 1.2s infinite' }}>●</span>
                    <span style={{ animation: 'pulseDot 1.2s 0.2s infinite' }}>●</span>
                    <span style={{ animation: 'pulseDot 1.2s 0.4s infinite' }}>●</span>
                  </span>
                )}
              </div>

              {/* Timestamp */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  fontSize: '0.66rem',
                  color: isUser ? 'rgba(255, 255, 255, 0.7)' : '#64748b',
                }}
              >
                <span>{formatMessageTime(msg.timestamp)}</span>
                {isUser && (
                  <span style={{ color: '#a78bfa', fontSize: '0.72rem' }}>✓✓</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Auto-scroll anchor point */}
      <div ref={scrollSentinelRef} style={{ height: '1px' }} />
    </div>
  );
};
