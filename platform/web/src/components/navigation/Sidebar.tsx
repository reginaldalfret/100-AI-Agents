import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '../../store/useAppStore';
import { Agent, CategoryType } from '../../types';

const CATEGORIES: { id: CategoryType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'Coding', label: 'Coding' },
  { id: 'Frontend', label: 'Frontend' },
  { id: 'Backend', label: 'Backend' },
  { id: 'Databases', label: 'Databases' },
  { id: 'Cloud', label: 'Cloud' },
  { id: 'AI/ML', label: 'AI/ML' },
  { id: 'Cybersecurity', label: 'Cybersecurity' },
  { id: 'QA', label: 'QA' },
  { id: 'Release', label: 'Release' },
  { id: 'Data', label: 'Data' },
  { id: 'Writing', label: 'Writing' },
  { id: 'Research', label: 'Research' },
  { id: 'Business', label: 'Business' }
];

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [agentsCollapsed, setAgentsCollapsed] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);

  const {
    agents,
    selectedAgent,
    selectAgent,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    conversations,
    activeConversationId,
    selectConversation,
    createNewChat,
    togglePinConversation,
    deleteConversation,
    isMobileSidebarOpen,
    setMobileSidebarOpen
  } = useAppStore();

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let list = [...conversations];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.agentName.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    // Pinned first, then by recency
    return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [conversations, searchQuery]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    let list = agents;

    // Filter by category
    if (selectedCategory !== 'all') {
      const cat = selectedCategory.toLowerCase();
      list = list.filter((a) => {
        const aCat = (a.category || '').toLowerCase();
        const aDom = (a.domain || '').toLowerCase();
        if (cat === 'coding') return aCat.includes('cod') || aDom.includes('program') || aCat.includes('language');
        if (cat === 'frontend') return aCat.includes('front') || aDom.includes('front') || aCat.includes('react');
        if (cat === 'backend') return aCat.includes('back') || aDom.includes('api') || aCat.includes('microservice');
        if (cat === 'databases') return aCat.includes('data') && (aCat.includes('base') || aDom.includes('sql') || aDom.includes('vector'));
        if (cat === 'cloud') return aCat.includes('cloud') || aDom.includes('devops') || aCat.includes('docker') || aDom.includes('kube');
        if (cat === 'ai/ml') return aCat.includes('ai') || aCat.includes('ml') || aDom.includes('rag') || aDom.includes('learn');
        if (cat === 'cybersecurity') return aCat.includes('sec') || aDom.includes('threat') || aDom.includes('soc');
        if (cat === 'qa') return aCat.includes('qa') || aDom.includes('test') || aDom.includes('assur');
        if (cat === 'release') return aCat.includes('rel') || aDom.includes('eng') || aDom.includes('version');
        if (cat === 'data') return (aCat.includes('data') && !aCat.includes('base')) || aDom.includes('analyt') || aDom.includes('stat');
        if (cat === 'writing') return aCat.includes('writ') || aDom.includes('comm') || aDom.includes('essay');
        if (cat === 'research') return aCat.includes('research') || aDom.includes('sop') || aDom.includes('liter');
        if (cat === 'business') return aCat.includes('bus') || aDom.includes('ops') || aDom.includes('strat');
        return aCat.includes(cat) || aDom.includes(cat);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.displayNumber.includes(q) ||
          (a.category && a.category.toLowerCase().includes(q)) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [agents, selectedCategory, searchQuery]);

  const handleAgentClick = (agent: Agent) => {
    selectAgent(agent);
    router.push('/agents');
    setMobileSidebarOpen(false);
  };

  const handleConversationClick = (id: string) => {
    selectConversation(id);
    router.push('/agents');
    setMobileSidebarOpen(false);
  };

  const handleNewChat = () => {
    createNewChat();
    router.push('/agents');
    setMobileSidebarOpen(false);
  };

  // Avatar gradient generator
  const getAvatarGradient = (agent: Agent) => {
    if (agent.isSuperAI || agent.displayNumber === '301') {
      return 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)';
    }
    const cat = (agent.category || '').toLowerCase();
    if (cat.includes('front') || cat.includes('react')) return 'linear-gradient(135deg, #06b6d4, #3b82f6)';
    if (cat.includes('back') || cat.includes('cod')) return 'linear-gradient(135deg, #8b5cf6, #ec4899)';
    if (cat.includes('data')) return 'linear-gradient(135deg, #10b981, #059669)';
    if (cat.includes('sec')) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    if (cat.includes('cloud') || cat.includes('devops')) return 'linear-gradient(135deg, #6366f1, #06b6d4)';
    if (cat.includes('ai')) return 'linear-gradient(135deg, #a855f7, #ec4899)';
    if (cat.includes('writ')) return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
    return 'linear-gradient(135deg, #0284c7, #0369a1)';
  };

  return (
    <aside className={`sidebar lg-glass app-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`} id="appSidebar">
      {/* 1. Header & Brand Orb */}
      <header className="sidebar-header">
        <div className="brand" onClick={() => router.push('/agents')} style={{ cursor: 'pointer' }}>
          <div className="brand-orb-container">
            <svg className="brand-icon" width="26" height="26" viewBox="0 0 28 28" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <circle cx="14" cy="14" r="11" stroke="url(#logoGrad)" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
              <circle cx="14" cy="14" r="7" stroke="url(#logoGrad)" strokeWidth="2" filter="url(#neonGlow)" />
              <circle cx="14" cy="14" r="3" fill="url(#logoGrad)" filter="url(#neonGlow)" />
              <line x1="14" y1="1" x2="14" y2="5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14" y1="23" x2="14" y2="27" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="1" y1="14" x2="5" y2="14" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="23" y1="14" x2="27" y2="14" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">301 SUPER AI AGENTS</h1>
            <p className="brand-subtitle">
              Sovereign AI • <span style={{ color: 'var(--neon-cyan)' }}>301 Agents Active</span>
            </p>
          </div>
        </div>

        {/* New Chat Button */}
        <button id="btnNewChat" className="btn-new-chat" onClick={handleNewChat} title="Start New AI Conversation">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Chat</span>
        </button>

        {/* Search input for agents & chats */}
        <div className="search-box">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            id="sidebarSearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 301 AI agents & chats..."
            aria-label="Search agents and conversations"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* 2. History Panel (Recent Chats) */}
      <section className="sidebar-panel history-panel" aria-label="Recent chats">
        <div
          className="panel-header"
          onClick={() => setHistoryCollapsed(!historyCollapsed)}
          style={{ cursor: 'pointer' }}
          title="Click to toggle chat history"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="panel-title">CHATS</span>
            <span className="panel-badge">{conversations.length}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{historyCollapsed ? '▸' : '▾'}</span>
        </div>

        {!historyCollapsed && (
          <div className="conversation-list" role="region" aria-label="Chat history">
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '10px 8px', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                {searchQuery ? 'No matching chats found' : 'No chats yet'}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className={`conversation-row ${isActive ? 'active' : ''}`}
                    onClick={() => handleConversationClick(conv.id)}
                  >
                    <div className="conversation-info">
                      <div className="conversation-title" title={conv.title}>
                        {conv.pinned && <span style={{ marginRight: '4px', fontSize: '10px' }}>📌</span>}
                        {conv.title}
                      </div>
                      <div className="conversation-meta">
                        <span>{conv.agentName}</span> • <span>{conv.updatedAt}</span>
                      </div>
                    </div>
                    <div className="conversation-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-chat-action"
                        onClick={() => togglePinConversation(conv.id)}
                        title={conv.pinned ? 'Unpin chat' : 'Pin chat to top'}
                      >
                        {conv.pinned ? '★' : '☆'}
                      </button>
                      <button
                        className="btn-chat-action"
                        onClick={() => deleteConversation(conv.id)}
                        title="Delete conversation"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      <div className="sidebar-panel-divider" aria-hidden="true" />

      {/* 3. 301 Agents Directory */}
      <section className={`sidebar-panel agents-panel ${agentsCollapsed ? 'collapsed' : ''}`} aria-label="AI agents directory">
        <div
          className="panel-header"
          onClick={() => setAgentsCollapsed(!agentsCollapsed)}
          style={{ cursor: 'pointer' }}
          title="Click to toggle agent directory"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="panel-title">AGENTS</span>
            <span className="panel-badge">301</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{agentsCollapsed ? '▸' : '▾'}</span>
        </div>

        {!agentsCollapsed && (
          <>
            {/* Category Filter Bar */}
            <div className="category-filter-bar" role="toolbar" aria-label="Category filters">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    className={`category-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label} {cat.id === 'all' && `(301)`}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Agent List */}
            <div className="agent-list" role="region" aria-label="Agent list">
              {filteredAgents.length === 0 ? (
                <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  No agents found in this category
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedAgent?.id === agent.id;
                  const isSuper = agent.isSuperAI || agent.displayNumber === '301';

                  return (
                    <React.Fragment key={agent.id}>
                      {isSuper && <div className="agent-301-separator" />}
                      <div
                        className={`agent-row ${isSelected ? 'active' : ''} ${isSuper ? 'is-super-ai' : ''}`}
                        onClick={() => handleAgentClick(agent)}
                        title={`${agent.name} (${agent.category})`}
                      >
                        <div
                          className="agent-row-avatar"
                          style={{
                            background: getAvatarGradient(agent)
                          }}
                        >
                          {agent.displayNumber}
                        </div>
                        <div className="agent-info" style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              className="agent-name"
                              style={{
                                fontSize: '12.5px',
                                fontWeight: isSelected ? 700 : 500,
                                color: isSelected ? '#fff' : 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {agent.name}
                            </span>
                            {isSuper && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: 'rgba(6, 182, 212, 0.15)',
                                  border: '1px solid rgba(6, 182, 212, 0.4)',
                                  color: 'var(--neon-cyan)',
                                  fontWeight: 700
                                }}
                              >
                                MASTER
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '10.5px',
                              color: isSelected ? '#a5f3fc' : 'var(--text-tertiary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {agent.domain || agent.category}
                          </div>
                        </div>
                        <div
                          className="status-indicator"
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: agent.status === 'ready' || agent.status === 'active' ? 'var(--neon-green)' : 'var(--text-muted)',
                            boxShadow: agent.status === 'ready' ? '0 0 6px var(--neon-green-glow)' : 'none',
                            flexShrink: 0
                          }}
                        />
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>

      {/* 4. Compact 2x2 Tool Navigation Grid at Bottom */}
      <div className="sidebar-panel-divider" aria-hidden="true" />
      <nav className="sidebar-tools-grid" aria-label="Secondary tools navigation">
        <Link
          href="/fine-tuning"
          className={`nav-btn sidebar-tool-btn ${pathname === '/fine-tuning' ? 'active-tool' : ''}`}
          title="Fine-Tuning Factory (LoRA/QLoRA)"
          style={{
            background: pathname === '/fine-tuning' ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.15)',
            border: pathname === '/fine-tuning' ? '1px solid #818cf8' : '1px solid rgba(99,102,241,0.3)',
            color: '#c7d2fe',
            boxShadow: pathname === '/fine-tuning' ? '0 0 12px rgba(99,102,241,0.4)' : 'none'
          }}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <span style={{ fontSize: '1rem' }}>⚙️</span>
          <span>Factory</span>
        </Link>

        <Link
          href="/knowledge"
          className={`nav-btn sidebar-tool-btn ${pathname === '/knowledge' ? 'active-tool' : ''}`}
          title="Obsidian Knowledge Base"
          style={{
            background: pathname === '/knowledge' ? 'rgba(6,182,212,0.35)' : 'rgba(6,182,212,0.15)',
            border: pathname === '/knowledge' ? '1px solid #22d3ee' : '1px solid rgba(6,182,212,0.3)',
            color: '#a5f3fc',
            boxShadow: pathname === '/knowledge' ? '0 0 12px rgba(6,182,212,0.4)' : 'none'
          }}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <span style={{ fontSize: '1rem' }}>📚</span>
          <span>Knowledge</span>
        </Link>

        <Link
          href="/personal-style"
          className={`nav-btn sidebar-tool-btn ${pathname === '/personal-style' ? 'active-tool' : ''}`}
          title="Personal Style Lab"
          style={{
            background: pathname === '/personal-style' ? 'rgba(236,72,153,0.35)' : 'rgba(236,72,153,0.15)',
            border: pathname === '/personal-style' ? '1px solid #f472b6' : '1px solid rgba(236,72,153,0.3)',
            color: '#fbcfe8',
            boxShadow: pathname === '/personal-style' ? '0 0 12px rgba(236,72,153,0.4)' : 'none'
          }}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <span style={{ fontSize: '1rem' }}>💬</span>
          <span>Style Lab</span>
        </Link>

        <Link
          href="/arena"
          className={`nav-btn sidebar-tool-btn ${pathname === '/arena' ? 'active-tool' : ''}`}
          title="Model Arena (Sequential Local Model Benchmark)"
          style={{
            background: pathname === '/arena' ? 'rgba(251,146,60,0.35)' : 'rgba(251,146,60,0.15)',
            border: pathname === '/arena' ? '1px solid #fb923c' : '1px solid rgba(251,146,60,0.3)',
            color: '#fdba74',
            boxShadow: pathname === '/arena' ? '0 0 12px rgba(251,146,60,0.4)' : 'none'
          }}
          onClick={() => setMobileSidebarOpen(false)}
        >
          <span style={{ fontSize: '1rem' }}>⚔️</span>
          <span>Arena</span>
        </Link>
      </nav>
    </aside>
  );
};
