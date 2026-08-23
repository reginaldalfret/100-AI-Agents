/**
 * Sovereign AI Workbench — Visual Intent Planner & Project Component Catalog
 * Detects visual explanation opportunities and generates grounded specifications.
 */

import { VisualType } from './schema.js';

export const PROJECT_ARCHITECTURE_CATALOG = {
  layers: [
    {
      id: 'ui_layer',
      name: 'Presentation & UI Layer',
      components: [
        { id: 'web_workbench', name: 'Sovereign AI Workbench', role: 'Liquid Glass iPhone-inspired UI', badge: 'Frontend' },
        { id: 'hud_inspector', name: 'Inspector & Diagnostics HUD', role: 'Telemetry, VRAM & Model Status', badge: 'Dev HUD' }
      ]
    },
    {
      id: 'gateway_layer',
      name: 'Gateway & Orchestration Layer',
      components: [
        { id: 'central_gateway', name: '100-to-1 Central Gateway', role: 'Port 8300, SSE Token Streamer', badge: 'HTTP/SSE' },
        { id: 'scope_guard', name: 'Agent Scope Guard', role: 'Domain Boundary & Authorization', badge: 'Security' },
        { id: 'task_classifier', name: 'Task Classifier & Planner', role: 'Agent 101 Master Orchestrator', badge: 'Intelligence' }
      ]
    },
    {
      id: 'model_layer',
      name: 'Local Neural Model Layer (Ollama)',
      components: [
        { id: 'gemma_vision', name: 'Google Gemma 3 4B', role: 'Multimodal Vision & Visual OCR', badge: 'Vision Engine' },
        { id: 'nemotron_reasoning', name: 'NVIDIA Nemotron 3', role: 'Reasoning, Synthesis & Planning', badge: 'Reasoning Engine' },
        { id: 'qwen_coder', name: 'Qwen 2.5 Coder 1.5B', role: 'Code Execution, Data & Scripts', badge: 'Coding Engine' }
      ]
    },
    {
      id: 'memory_layer',
      name: 'Persistent State & Sovereign Storage',
      components: [
        { id: 'conversation_memory', name: 'Conversational Memory', role: 'Multi-Turn Context & Reference Resolution', badge: 'Memory' },
        { id: 'evidence_graph', name: 'Evidence Graph & Citations', role: 'Grounded Citations & 0 External Egress', badge: 'Provenance' }
      ]
    }
  ]
};

export class VisualPlanner {
  /**
   * Evaluates a user prompt or agent context to determine if a diagram should be generated.
   * @param {string} prompt
   * @param {Object} context
   * @returns {Object} { visualRecommended, visualType, reason }
   */
  static planVisual(prompt = '', context = {}) {
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return { visualRecommended: false, visualType: null, reason: 'Empty prompt' };
    }

    const p = prompt.toLowerCase();

    // 1. Explicit Architecture requests
    if (p.includes('architecture') || p.includes('system design') || p.includes('components') || p.includes('subsystem')) {
      return {
        visualRecommended: true,
        visualType: VisualType.ARCHITECTURE,
        reason: 'User requested system architecture / component overview.'
      };
    }

    // 2. Explicit Sequence / Interaction requests
    if (p.includes('sequence') || p.includes('lifecycle') || p.includes('what happens when') || p.includes('step by step flow') || p.includes('how does a request travel')) {
      return {
        visualRecommended: true,
        visualType: VisualType.SEQUENCE,
        reason: 'User requested execution sequence or interaction flow.'
      };
    }

    // 3. Flowcharts and Process Workflows
    if (p.includes('flowchart') || p.includes('workflow') || p.includes('process map') || p.includes('pipeline') || p.includes('how it works') || p.includes('explain how')) {
      return {
        visualRecommended: true,
        visualType: VisualType.FLOWCHART,
        reason: 'User requested a process flowchart or workflow map.'
      };
    }

    // 4. Timelines & History
    if (p.includes('timeline') || p.includes('history') || p.includes('roadmap') || p.includes('milestone')) {
      return {
        visualRecommended: true,
        visualType: VisualType.TIMELINE,
        reason: 'User requested a sequential timeline or milestone roadmap.'
      };
    }

    // 5. Data & Charts
    if (p.includes('chart') || p.includes('graph') || p.includes('trend') || p.includes('plot') || p.includes('distribution') || p.includes('breakdown')) {
      if (p.includes('pie') || p.includes('share') || p.includes('percentage')) {
        return { visualRecommended: true, visualType: VisualType.PIE_CHART, reason: 'User requested data share/percentage chart.' };
      }
      if (p.includes('line') || p.includes('time series') || p.includes('over time')) {
        return { visualRecommended: true, visualType: VisualType.LINE_CHART, reason: 'User requested a time-series trend chart.' };
      }
      return { visualRecommended: true, visualType: VisualType.BAR_CHART, reason: 'User requested a comparative bar chart.' };
    }

    return {
      visualRecommended: false,
      visualType: null,
      reason: 'No visual diagram indicator found in task.'
    };
  }

  /**
   * Generates a grounded architecture specification for the Sovereign AI Workbench.
   */
  static getSovereignPlatformArchitectureSpec() {
    return {
      type: VisualType.ARCHITECTURE,
      title: '101 Super AI Agents — Sovereign AI Workbench Architecture',
      description: 'End-to-end 100% on-premise air-gapped agentic intelligence architecture on NVIDIA RTX 2050',
      nodes: [
        { id: 'user_req', label: 'User Request / Web Browser', kind: 'client', layer: 'Presentation' },
        { id: 'web_ui', label: 'Liquid Glass Web UI (Port 8300)', kind: 'default', layer: 'Presentation' },
        { id: 'gateway', label: '100-to-1 Central Gateway', kind: 'gateway', layer: 'Gateway' },
        { id: 'scope_guard', label: 'Agent Scope Guard & Auth', kind: 'security', layer: 'Gateway' },
        { id: 'agent_101', label: 'Super AI Master Agent 101', kind: 'agent', layer: 'Orchestration' },
        { id: 'specialists', label: '100 Specialist AI Agents', kind: 'agent', layer: 'Workforce' },
        { id: 'model_router', label: 'Local Model Router & Lock', kind: 'default', layer: 'Inference' },
        { id: 'gemma_vision', label: 'Google Gemma 3 4B (Vision/OCR)', kind: 'model', layer: 'Models' },
        { id: 'nemotron_reason', label: 'NVIDIA Nemotron 3 (Reasoning)', kind: 'model', layer: 'Models' },
        { id: 'qwen_code', label: 'Qwen 2.5 Coder 1.5B (Code/Data)', kind: 'model', layer: 'Models' },
        { id: 'memory', label: 'Conversation Memory & Context', kind: 'storage', layer: 'Storage' },
        { id: 'evidence', label: 'Evidence Graph & Citations', kind: 'evidence', layer: 'Storage' }
      ],
      edges: [
        { from: 'user_req', to: 'web_ui', label: 'HTTPS / WSS' },
        { from: 'web_ui', to: 'gateway', label: 'POST /api/chat (SSE Stream)' },
        { from: 'gateway', to: 'scope_guard', label: 'Scope Check' },
        { from: 'scope_guard', to: 'agent_101', label: 'Dispatch Intent' },
        { from: 'agent_101', to: 'specialists', label: 'Task Decomposition' },
        { from: 'agent_101', to: 'model_router', label: 'Route Model' },
        { from: 'model_router', to: 'gemma_vision', label: 'Multimodal / Images' },
        { from: 'model_router', to: 'nemotron_reason', label: 'Reasoning / Synthesis' },
        { from: 'model_router', to: 'qwen_code', label: 'Coding / Tables' },
        { from: 'specialists', to: 'evidence', label: 'Grounded Evidence' },
        { from: 'gateway', to: 'memory', label: 'Persist Turns' }
      ]
    };
  }
}
