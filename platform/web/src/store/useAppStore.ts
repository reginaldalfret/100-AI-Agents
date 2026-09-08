import { create } from 'zustand';
import { Agent, CategoryType, Conversation, ChatMessage } from '../types';

export const INITIAL_SUPER_AI: Agent = {
  id: 'auto',
  agent_id: 'agent-301',
  name: 'Super AI Orchestrator',
  displayName: 'Super AI Master Orchestrator',
  displayNumber: '301',
  category: 'Orchestrator',
  domain: 'Autonomous Multi-Agent Orchestration',
  description: 'Master autonomous orchestrator coordinating all 300 specialized agents with air-gapped sovereign execution.',
  status: 'ready',
  model: 'nemotron-3-nano',
  isSuperAI: true,
  examples: [
    'Build me a complete full-stack web application with database and tests',
    'Investigate system anomaly, analyze memory dumps, and draft incident report',
    'Perform end-to-end dataset analysis with SQL queries and statistical plots',
    'Coordinate specialized agents to review code, run security audits, and generate docs'
  ],
  capabilities: ['Multi-Agent Planning', 'Tool Execution', 'Sovereign Local Routing', 'Delegation'],
  tools: ['WorkflowEngine', 'PythonCompute', 'DatasetRegistry', 'SpecialistRegistry']
};

export const INITIAL_AGENTS: Agent[] = [
  INITIAL_SUPER_AI,
  {
    id: 'agent-001',
    agent_id: 'agent-001',
    name: 'Writing AI Agent',
    displayNumber: '001',
    category: 'Writing',
    domain: 'Writing & Communication',
    description: 'Creates clear articles, formal essays, executive summaries, and polished technical copy.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Write a formal executive brief on autonomous local AI infrastructure',
      'Polish and refine this engineering design proposal',
      'Draft release notes for Super AI workbench v2.0'
    ],
    capabilities: ['Article Writing', 'Content Polishing', 'Technical Documentation']
  },
  {
    id: 'agent-002',
    agent_id: 'agent-002',
    name: 'Python Systems Agent',
    displayNumber: '002',
    category: 'Coding',
    domain: 'Systems & Backend Programming',
    description: 'Specializes in high-performance Python 3.12, async concurrency, NumPy, and CLI tooling.',
    status: 'ready',
    model: 'qwen2.5-coder:1.5b',
    examples: [
      'Create an asynchronous worker pool with priority queues in Python',
      'Optimize this matrix multiplication algorithm with NumPy vectorization',
      'Build a robust FastAPI service with Pydantic validation'
    ],
    capabilities: ['AsyncIO', 'Data Processing', 'Performance Profiling']
  },
  {
    id: 'agent-003',
    agent_id: 'agent-003',
    name: 'React Architect Agent',
    displayNumber: '003',
    category: 'Frontend',
    domain: 'Frontend Engineering',
    description: 'Builds responsive, high-performance React 19 + TypeScript interfaces with dark liquid glass aesthetics.',
    status: 'ready',
    model: 'qwen2.5-coder:1.5b',
    examples: [
      'Construct a virtualized tree viewer for large JSON schemas in React',
      'Implement an animated liquid glass drawer component with framer-motion',
      'Refactor state management to atomic Zustand stores'
    ],
    capabilities: ['React 19', 'TypeScript', 'Tailwind/CSS Glassmorphism']
  },
  {
    id: 'agent-004',
    agent_id: 'agent-004',
    name: 'API Gateway & Microservices Agent',
    displayNumber: '004',
    category: 'Backend',
    domain: 'Backend & Microservices',
    description: 'Designs resilient REST, gRPC, and GraphQL APIs with streaming SSE and zero-trust authentication.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Design an SSE streaming protocol for local LLM token distribution',
      'Write an ultra-low latency Node.js HTTP router with circuit breaker',
      'Implement structured error handling and telemetry headers'
    ],
    capabilities: ['RESTful APIs', 'Streaming Protocols', 'Circuit Breakers']
  },
  {
    id: 'agent-005',
    agent_id: 'agent-005',
    name: 'PostgreSQL & Vector DB Agent',
    displayNumber: '005',
    category: 'Databases',
    domain: 'Database Engineering',
    description: 'Expert in SQL optimization, pgvector similarity search, indexing strategies, and schema migrations.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Write an optimized CTE query with window functions for retention cohorts',
      'Create an HNSW vector index for cosine similarity over 512-dim embeddings',
      'Diagnose slow queries using EXPLAIN ANALYZE output'
    ],
    capabilities: ['SQL Optimization', 'pgvector', 'Schema Migration']
  },
  {
    id: 'agent-006',
    agent_id: 'agent-006',
    name: 'Cloud & Kubernetes DevOps Agent',
    displayNumber: '006',
    category: 'Cloud',
    domain: 'Infrastructure & Cloud Native',
    description: 'Automates Docker containerization, Kubernetes manifests, Helm charts, and air-gapped deployments.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Generate a hardened multi-stage Dockerfile for Node.js and Ollama',
      'Write a Kubernetes StatefulSet for local vector database clustering',
      'Create a local registry mirror script for air-gapped nodes'
    ],
    capabilities: ['Kubernetes', 'Docker', 'Air-Gapped Ops']
  },
  {
    id: 'agent-007',
    agent_id: 'agent-007',
    name: 'Neural RAG & Vector Intelligence Agent',
    displayNumber: '007',
    category: 'AI/ML',
    domain: 'Machine Learning & Embeddings',
    description: 'Builds semantic retrieval-augmented generation pipelines, chunking heuristics, and rerankers.',
    status: 'ready',
    model: 'gemma3:1b',
    examples: [
      'Configure hybrid sparse-dense retrieval with reciprocal rank fusion',
      'Optimize text chunking with semantic markdown boundary detection',
      'Benchmark embedding models for technical code search'
    ],
    capabilities: ['Hybrid Retrieval', 'RAG Pipelines', 'Rerankers']
  },
  {
    id: 'agent-008',
    agent_id: 'agent-008',
    name: 'Cybersecurity SOC Agent',
    displayNumber: '008',
    category: 'Cybersecurity',
    domain: 'Security & Threat Intelligence',
    description: 'Performs vulnerability assessments, CVE forensics, threat modeling, and network security audits.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Perform a static code security audit checking for OWASP Top 10 vulnerabilities',
      'Analyze network traffic logs to identify lateral movement indicators',
      'Draft a zero-trust network policy configuration'
    ],
    capabilities: ['Threat Modeling', 'Vulnerability Assessment', 'Audit Forensics']
  },
  {
    id: 'agent-009',
    agent_id: 'agent-009',
    name: 'Automated QA & Test Engineering Agent',
    displayNumber: '009',
    category: 'QA',
    domain: 'Quality Assurance & Automation',
    description: 'Generates deterministic unit, integration, and E2E test suites with high code coverage.',
    status: 'ready',
    model: 'qwen2.5-coder:1.5b',
    examples: [
      'Write Vitest test suites for Zustand store state transitions',
      'Generate end-to-end Playwright tests for chat streaming verification',
      'Create property-based tests for JSON schema serializers'
    ],
    capabilities: ['Unit Testing', 'E2E Testing', 'Fuzzing']
  },
  {
    id: 'agent-010',
    agent_id: 'agent-010',
    name: 'Release Controller Agent',
    displayNumber: '010',
    category: 'Release',
    domain: 'Release & Version Control',
    description: 'Manages semantic versioning, changelogs, build verification, and deployment artifact packaging.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Audit build deliverables for release candidate verification',
      'Generate comprehensive semantic release notes from Git log history',
      'Create an air-gapped offline distribution package checklist'
    ],
    capabilities: ['Semantic Versioning', 'Release Gates', 'Changelog Generation']
  },
  {
    id: 'agent-011',
    agent_id: 'agent-011',
    name: 'Data Science & Statistical Analyst Agent',
    displayNumber: '011',
    category: 'Data',
    domain: 'Data Analytics & Statistics',
    description: 'Computes descriptive statistics, anomaly detection, time-series trends, and chart visualizations.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Compute mean, median, IQR, and detect outliers in this numerical column',
      'Perform linear regression with R² evaluation on performance metrics',
      'Generate SVG chart specification for multi-series trend analysis'
    ],
    capabilities: ['Statistical Analysis', 'Anomaly Detection', 'Trend Forecasting']
  },
  {
    id: 'agent-012',
    agent_id: 'agent-012',
    name: 'Deep Research & SOP Agent',
    displayNumber: '012',
    category: 'Research',
    domain: 'Research & Standard Operating Procedures',
    description: 'Conducts systematic literature reviews, competitive analyses, and formal operating procedure documentation.',
    status: 'ready',
    model: 'llama3.2:1b',
    examples: [
      'Draft a Standard Operating Procedure (SOP) for air-gapped model updates',
      'Compile a state-of-the-art comparison of local small language models',
      'Synthesize key findings across 5 research papers on quantization'
    ],
    capabilities: ['SOP Authoring', 'Literature Synthesis', 'Technical Research']
  },
  {
    id: 'agent-013',
    agent_id: 'agent-013',
    name: 'Business Strategy & Operations Agent',
    displayNumber: '013',
    category: 'Business',
    domain: 'Business & Operations Strategy',
    description: 'Formulates operational workflows, cost benefit analyses, KPI scorecards, and resource allocations.',
    status: 'ready',
    model: 'nemotron-3-nano',
    examples: [
      'Create an operational KPI framework for industrial autonomous AI workforce',
      'Estimate hardware ROI for local edge compute vs cloud API subscriptions',
      'Draft an executive pitch for sovereign enterprise intelligence platform'
    ],
    capabilities: ['Operational Planning', 'KPI Scorecards', 'ROI Analysis']
  }
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Autonomous Multi-Agent Planning',
    agentId: 'auto',
    agentName: 'Super AI Orchestrator',
    updatedAt: 'Just now',
    pinned: true,
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        content: 'Hello Super AI! Can you provide a summary of the active 301 agents and their capabilities?',
        timestamp: '10:14 AM'
      },
      {
        id: 'msg-2',
        sender: 'agent',
        content: 'Greetings. The 301 Super AI Workforce is fully operational in 100% sovereign air-gapped mode. All 300 specialized agents across Coding, Frontend, Backend, Databases, Cloud, AI/ML, Cybersecurity, QA, Release, Data, Writing, Research, and Business domains are standing by. As the Master Orchestrator (Agent 301), I can automatically route complex tasks to the optimal specialist or execute distributed multi-agent workflows.',
        timestamp: '10:14 AM',
        agentNumber: '301',
        agentName: 'Super AI Orchestrator',
        model: 'nemotron-3-nano'
      }
    ]
  },
  {
    id: 'conv-2',
    title: 'React Dark Liquid Glass UI Architecture',
    agentId: 'agent-003',
    agentName: 'React Architect Agent',
    updatedAt: '12m ago',
    pinned: false,
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        content: 'How do we style the responsive AppShell with RGB neon accents and liquid glass backdrop filters?',
        timestamp: '10:02 AM'
      },
      {
        id: 'msg-4',
        sender: 'agent',
        content: 'We combine CSS backdrop-filter: blur(18px) with subtle cosmic gradients (rgba(147, 51, 234, 0.35) to rgba(6, 182, 212, 0.25)), inset highlights (inset 0 1px 1px rgba(255,255,255,0.16)), and neon glow borders. This gives an ultra-crisp, luxury cybernetic appearance while maintaining fluid 60fps rendering.',
        timestamp: '10:03 AM',
        agentNumber: '003',
        agentName: 'React Architect Agent',
        model: 'qwen2.5-coder:1.5b'
      }
    ]
  },
  {
    id: 'conv-3',
    title: 'GPU VRAM Safety Constraints (RTX 2050)',
    agentId: 'agent-002',
    agentName: 'Python Systems Agent',
    updatedAt: '1h ago',
    pinned: false,
    messages: [
      {
        id: 'msg-5',
        sender: 'user',
        content: 'What is our concurrency policy for local model generation on 4GB VRAM?',
        timestamp: '9:15 AM'
      },
      {
        id: 'msg-6',
        sender: 'agent',
        content: 'Under NVIDIA GeForce RTX 2050 4GB VRAM constraint, Model Arena and general inference strictly enforce sequential execution (max 1 active model generation at a time). Small models (nemotron-3-nano, qwen2.5-coder:1.5b, gemma3:1b, llama3.2:1b) use quantized GGUF/Ollama runtimes with context memory capped at 2048 to prevent CUDA out-of-memory errors.',
        timestamp: '9:16 AM',
        agentNumber: '002',
        agentName: 'Python Systems Agent',
        model: 'nemotron-3-nano'
      }
    ]
  }
];

interface AppState {
  agents: Agent[];
  selectedAgent: Agent;
  selectedCategory: CategoryType;
  searchQuery: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  isMobileSidebarOpen: boolean;
  activeModel: string;
  isLoadingAgents: boolean;

  // Actions
  selectAgent: (agent: Agent) => void;
  setSelectedCategory: (cat: CategoryType) => void;
  setSearchQuery: (query: string) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  createNewChat: (agent?: Agent) => void;
  selectConversation: (id: string) => void;
  togglePinConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessageToActive: (message: ChatMessage) => void;
  setActiveModel: (model: string) => void;
  fetchAgents: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  agents: INITIAL_AGENTS,
  selectedAgent: INITIAL_SUPER_AI,
  selectedCategory: 'all',
  searchQuery: '',
  conversations: INITIAL_CONVERSATIONS,
  activeConversationId: 'conv-1',
  isMobileSidebarOpen: false,
  activeModel: 'nemotron-3-nano',
  isLoadingAgents: false,

  selectAgent: (agent) => {
    set({ selectedAgent: agent });
    // If agent changed, create or switch to corresponding conversation
    const existing = get().conversations.find((c) => c.agentId === agent.id);
    if (existing) {
      set({ activeConversationId: existing.id });
    } else {
      const newConvId = `conv-${Date.now()}`;
      const newConv: Conversation = {
        id: newConvId,
        title: `${agent.name} Discussion`,
        agentId: agent.id,
        agentName: agent.name,
        updatedAt: 'Just now',
        pinned: false,
        messages: []
      };
      set((s) => ({
        conversations: [newConv, ...s.conversations],
        activeConversationId: newConvId
      }));
    }
  },

  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleMobileSidebar: () => set((s) => ({ isMobileSidebarOpen: !s.isMobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),

  createNewChat: (targetAgent) => {
    const agent = targetAgent || get().selectedAgent || INITIAL_SUPER_AI;
    const newId = `conv-${Date.now()}`;
    const newConv: Conversation = {
      id: newId,
      title: `New Chat with ${agent.name}`,
      agentId: agent.id,
      agentName: agent.name,
      updatedAt: 'Just now',
      pinned: false,
      messages: []
    };
    set((s) => ({
      conversations: [newConv, ...s.conversations],
      activeConversationId: newId,
      selectedAgent: agent,
      isMobileSidebarOpen: false
    }));
  },

  selectConversation: (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (conv) {
      const agent = get().agents.find((a) => a.id === conv.agentId) || INITIAL_SUPER_AI;
      set({ activeConversationId: id, selectedAgent: agent, isMobileSidebarOpen: false });
    }
  },

  togglePinConversation: (id) => {
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    }));
  },

  deleteConversation: (id) => {
    set((s) => {
      const remaining = s.conversations.filter((c) => c.id !== id);
      const nextActive = s.activeConversationId === id ? (remaining[0]?.id ?? null) : s.activeConversationId;
      return {
        conversations: remaining,
        activeConversationId: nextActive
      };
    });
  },

  addMessageToActive: (message) => {
    set((s) => {
      const activeId = s.activeConversationId;
      if (!activeId) return s;
      return {
        conversations: s.conversations.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              updatedAt: 'Just now',
              messages: [...c.messages, message]
            };
          }
          return c;
        })
      };
    });
  },

  setActiveModel: (model) => set({ activeModel: model }),

  fetchAgents: async () => {
    set({ isLoadingAgents: true });
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.agents) && data.agents.length > 0) {
        const mapped: Agent[] = data.agents.map((a: any) => {
          const isSuper = a.id === 'auto' || a.name === 'Super AI Agent' || a.name === 'Super AI' || a.category === 'Orchestrator';
          let num = '001';
          if (isSuper) num = '301';
          else if (a.displayNumber) num = a.displayNumber;
          else {
            const rawId = a.agent_id || a.id || '';
            const parsed = parseInt(rawId.replace(/\D/g, ''), 10);
            if (!isNaN(parsed)) num = String(parsed).padStart(3, '0');
          }

          return {
            id: a.id || a.agent_id || `agent-${num}`,
            agent_id: a.agent_id || a.id,
            name: a.name || a.displayName || `Agent ${num}`,
            displayName: a.displayName || a.name,
            displayNumber: num,
            category: a.category || a.domain || 'General',
            domain: a.domain || a.category,
            description: a.description || 'Specialized autonomous AI agent.',
            status: a.status || 'ready',
            model: a.model || 'nemotron-3-nano',
            isSuperAI: isSuper,
            examples: a.examples || [],
            capabilities: a.capabilities || [],
            tools: a.tools || []
          };
        });

        // Ensure 301 Super AI is present at the front or clearly identified
        const hasSuper = mapped.some((a) => a.isSuperAI);
        const finalAgents = hasSuper ? mapped : [INITIAL_SUPER_AI, ...mapped];
        set({ agents: finalAgents });
      }
    } catch {
      // Keep initial bundled agents on network error / offline
    } finally {
      set({ isLoadingAgents: false });
    }
  }
}));
