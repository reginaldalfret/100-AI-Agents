import React, { useState } from 'react';

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  snippet: string;
  tokens: number;
  updatedAt: string;
}

const INITIAL_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc-1',
    title: 'Sovereign AI Workforce Architecture Spec',
    category: 'Architecture',
    snippet: 'Comprehensive specification of 301 local autonomous agents with zero cloud egress and local Ollama inference.',
    tokens: 4210,
    updatedAt: 'Today'
  },
  {
    id: 'doc-2',
    title: 'RTX 2050 4GB VRAM Safety Gate Directives',
    category: 'Hardware',
    snippet: 'Hard limits on concurrent inference: sequential execution queue, 2048 token context window, 4-bit quantizations.',
    tokens: 1840,
    updatedAt: 'Yesterday'
  },
  {
    id: 'doc-3',
    title: 'Multi-Agent Collaborative Protocol (MCP)',
    category: 'Orchestration',
    snippet: 'Message schema, payload verification, and attestation tokens for intra-agent planning and handoffs.',
    tokens: 3120,
    updatedAt: '3 days ago'
  }
];

export const KnowledgeView: React.FC = () => {
  const [docs] = useState<KnowledgeDoc[]>(INITIAL_DOCS);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc>(INITIAL_DOCS[0]);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📚</span>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Obsidian Knowledge Base & Vault
          </h1>
          <span
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              color: 'var(--neon-cyan)',
              fontWeight: 700
            }}
          >
            RAG INDEXED
          </span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Local markdown vault synchronized with hybrid vector search and semantic chunking.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Document list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map((doc) => {
            const isSelected = selectedDoc.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(30, 44, 92, 0.6)' : 'var(--glass-card)',
                  border: isSelected ? '1px solid var(--neon-cyan)' : '1px solid var(--border-glass)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {doc.snippet}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                  <span>{doc.category}</span>
                  <span>{doc.tokens} tokens</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Document viewer */}
        <section
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'var(--glass-card)',
            border: '1px solid var(--border-glass)',
            minHeight: '360px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>{selectedDoc.title}</h2>
              <span style={{ fontSize: '11px', color: 'var(--neon-cyan)' }}>{selectedDoc.category} • Updated {selectedDoc.updatedAt}</span>
            </div>
          </div>
          <div style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
            <p><strong>Overview:</strong> {selectedDoc.snippet}</p>
            <p style={{ marginTop: '14px' }}>
              All contents are parsed locally into chunked semantic embeddings stored in local SQLite/pgvector database.
              When chatting with any of the 301 agents, relevant context snippets from this knowledge base are injected into the reasoning prompt automatically.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
