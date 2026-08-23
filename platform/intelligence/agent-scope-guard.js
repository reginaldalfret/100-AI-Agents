/**
 * Sovereign AI Workbench — Agent Scope Guard & Polite Domain Boundary Enforcement
 * 
 * Determines whether a specialist agent can legitimately handle a user request based on PRIMARY TASK INTENT.
 * Distinguishes DOING a technical task from EXPLAINING/WRITING about that domain.
 * Generates warm, polite, and helpful guidance with one-click agent switching.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.env.PROJECT_ROOT || 'E:\\Smart Automation\\100-AI-Agents';
const REGISTRY_PATH = path.join(ROOT, 'registry', 'sih-agent-mapping.json');

let agentsRegistry = [];
try {
  if (fs.existsSync(REGISTRY_PATH)) {
    agentsRegistry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  }
} catch {
  agentsRegistry = [];
}

/**
 * Domain & Intent Catalog mapping keywords/actions to specialist categories
 */
const DOMAIN_PROFILES = {
  backend: {
    id: 'backend-development',
    name: 'Backend & API Development',
    primaryAgents: ['agent-046', 'agent-033', 'agent-018', 'agent-007'], // Backend, JS, Python, Code Generator
    executionKeywords: ['write a rest api', 'create an api', 'build backend', 'express handler', 'fastapi route', 'crud endpoint', 'database route', 'node.js server', 'flask endpoint', 'spring boot controller'],
    verbs: ['write', 'build', 'create', 'develop', 'implement', 'code', 'refactor', 'debug']
  },
  database: {
    id: 'database-sql',
    name: 'Database & SQL Engineering',
    primaryAgents: ['agent-031', 'agent-011', 'agent-046'], // SQL, Database, Backend
    executionKeywords: ['write a sql query', 'sql migration', 'create table schema', 'database indexing', 'optimize query', 'postgresql trigger', 'foreign key constraint'],
    verbs: ['write', 'create', 'execute', 'run', 'migrate', 'optimize']
  },
  devops: {
    id: 'devops-cloud',
    name: 'DevOps & Infrastructure',
    primaryAgents: ['agent-015', 'agent-062', 'agent-063'], // DevOps, Cloud, Kubernetes
    executionKeywords: ['deploy to aws', 'docker deployment', 'kubernetes manifest', 'ci/cd pipeline', 'terraform script', 'dockerfile', 'helm chart', 'nginx config'],
    verbs: ['deploy', 'configure', 'provision', 'setup', 'build pipeline']
  },
  study: {
    id: 'education-study',
    name: 'Education & Study Planning',
    primaryAgents: ['agent-003', 'agent-004', 'agent-005'], // Study, Quiz, Flashcard
    executionKeywords: ['study plan', 'exam preparation', 'flashcards', 'quiz me', 'revision schedule', 'syllabus breakdown', 'practice questions'],
    verbs: ['plan', 'quiz', 'prepare', 'test', 'revise', 'schedule']
  },
  writing: {
    id: 'writing-content',
    name: 'Writing & Editorial',
    primaryAgents: ['agent-001', 'agent-002', 'agent-051'], // Writing, Email, Documentation
    executionKeywords: ['write an article', 'draft an essay', 'compose an email', 'write a blog post', 'proofread text', 'press release', 'executive memo'],
    verbs: ['write', 'draft', 'compose', 'proofread', 'rewrite', 'summarize']
  },
  image: {
    id: 'image-vision',
    name: 'Image & Visual Analysis',
    primaryAgents: ['agent-051', 'agent-066', 'agent-067'], // Image Analysis, Vision
    executionKeywords: ['analyze this image', 'extract text from photo', 'ocr this document', 'read diagram', 'inspect visual photo', 'detect objects'],
    verbs: ['analyze', 'ocr', 'inspect', 'detect', 'extract']
  },
  uiux: {
    id: 'ui-ux-design',
    name: 'UI/UX & Frontend Design',
    primaryAgents: ['agent-010', 'agent-047', 'agent-033'], // UI/UX, Frontend, JavaScript
    executionKeywords: ['design interface', 'figma wireframe', 'user flow', 'css layout', 'react component styling', 'design system'],
    verbs: ['design', 'layout', 'style', 'prototype']
  }
};

export class AgentScopeGuard {
  /**
   * Evaluates if a given task is in-scope for the selected agent.
   * @param {Object} agent - { agent_id, name, category, capabilities }
   * @param {string} task - User task prompt
   * @param {Object} context - Optional conversation context
   * @returns {Object} ScopeDecision
   */
  checkScope(agent, task, context = {}) {
    if (!agent || !task || typeof task !== 'string') {
      return { inScope: true, confidence: 1.0 };
    }

    const agentId = agent.agent_id || agent.id || '';
    const rawNum = agentId.replace(/\D/g, '');
    const num = parseInt(rawNum, 10);

    // Rule 1: Agent 101 Super AI Agent is Master Orchestrator (Always In-Scope)
    if (num === 101 || agentId === 'agent-101' || agentId === 'auto' || agent.name === 'Super AI Agent') {
      return {
        inScope: true,
        isMasterOrchestrator: true,
        confidence: 1.0,
        detectedDomain: 'multi-agent-orchestration'
      };
    }

    const cleanTask = task.trim();
    const lowerTask = cleanTask.toLowerCase();

    // Rule 2: Distinguish Explanation / Study / Writing ABOUT a topic from EXECUTING that domain task
    // e.g. "Explain Docker for my exam" -> Study AI Agent (IN-SCOPE)
    // e.g. "Write an article about Kubernetes" -> Writing AI Agent (IN-SCOPE)
    // e.g. "Explain how REST APIs work" -> Study / General (IN-SCOPE)
    const isExplanationIntent = /\b(explain|what is|how does|why does|tell me about|teach me|overview of|summary of|concept of)\b/i.test(lowerTask);
    const isExamOrStudyIntent = /\b(for my exam|for my test|for studying|for revision|in simple terms|like i am 5)\b/i.test(lowerTask);
    const isWritingArticleIntent = /\b(write an article|write a blog|draft an essay|write a story|write a poem)\b/i.test(lowerTask);

    // Check agent identity
    const isStudyAgent = num === 3 || agent.name?.toLowerCase().includes('study');
    const isWritingAgent = num === 1 || agent.name?.toLowerCase().includes('writing');
    const isImageAgent = num === 51 || num === 66 || agent.name?.toLowerCase().includes('image');
    const isDevOpsAgent = num === 15 || agent.name?.toLowerCase().includes('devops');
    const isCodingAgent = (num >= 6 && num <= 9) || num === 18 || num === 33 || num === 46 || num === 61 || agent.name?.toLowerCase().includes('code') || agent.name?.toLowerCase().includes('backend') || agent.name?.toLowerCase().includes('python') || agent.name?.toLowerCase().includes('javascript');
    const isDatabaseAgent = num === 11 || num === 31 || agent.name?.toLowerCase().includes('database') || agent.name?.toLowerCase().includes('sql');

    // Case A: Study Agent receiving conceptual/study questions regarding any topic
    if (isStudyAgent && (isExplanationIntent || isExamOrStudyIntent || lowerTask.includes('study') || lowerTask.includes('flashcard') || lowerTask.includes('quiz') || lowerTask.includes('exam') || lowerTask.includes('revision') || lowerTask.includes('plan'))) {
      return { inScope: true, confidence: 0.95, detectedDomain: 'education-study' };
    }

    // Case B: Writing Agent receiving writing/article requests about any domain
    if (isWritingAgent && (isWritingArticleIntent || lowerTask.includes('write an article') || lowerTask.includes('compose an email') || lowerTask.includes('draft a letter') || lowerTask.includes('proofread'))) {
      return { inScope: true, confidence: 0.95, detectedDomain: 'writing-content' };
    }

    // Case C: Heavy technical execution requested on NON-technical agents
    // 1. Study Agent asked to BUILD / WRITE production software code
    if (isStudyAgent) {
      if (/\b(write a rest api|build a rest api|create an api endpoint|node\.js handler|express server|docker deployment|deploy to aws|kubernetes cluster|write a sql migration|production database)\b/i.test(lowerTask)) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'backend', 'study planning, revision, exam preparation, flashcards, and learning support');
      }
    }

    // 2. Writing Agent asked to DO infrastructure / software operations
    if (isWritingAgent) {
      if (/\b(deploy this|deploy to aws|docker deployment|run sql query|write a rest api|build an app|fix this bug in python)\b/i.test(lowerTask) && !isWritingArticleIntent) {
        const targetDomain = lowerTask.includes('deploy') || lowerTask.includes('docker') ? 'devops' : 'backend';
        return this._buildOutOfScopeResponse(agent, cleanTask, targetDomain, 'writing articles, essays, emails, documentation, and editorial content');
      }
    }

    // 3. Image Analysis Agent asked for SQL database or code synthesis
    if (isImageAgent) {
      if (/\b(write a sql|sql query|join these tables|database migration|build a website|write a python script)\b/i.test(lowerTask) && !lowerTask.includes('image') && !lowerTask.includes('diagram')) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'database', 'analyzing visual media, photographs, technical diagrams, and document OCR');
      }
    }

    // 4. Coding Agent asked for exam timetable or high school study schedule
    if (isCodingAgent) {
      if (/\b(exam study plan|revision timetable|quiz me on history|biology flashcards|7-day study plan)\b/i.test(lowerTask)) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'study', 'software development, code synthesis, algorithms, debugging, and APIs');
      }
    }

    // Default: Conservative in-scope execution
    return { inScope: true, confidence: 0.90 };
  }

  _buildOutOfScopeResponse(currentAgent, userPrompt, targetDomainKey, specialtyDescription) {
    const domain = DOMAIN_PROFILES[targetDomainKey] || DOMAIN_PROFILES.backend;
    
    // Find matching recommended agents from registry
    const recommendedAgents = [];
    for (const agId of domain.primaryAgents) {
      const found = agentsRegistry.find(a => a.agent_id === agId) || {
        agent_id: agId,
        name: agId === 'agent-046' ? 'Backend AI Agent' : (agId === 'agent-033' ? 'JavaScript AI Agent' : (agId === 'agent-015' ? 'DevOps AI Agent' : (agId === 'agent-031' ? 'SQL AI Agent' : 'Specialist Agent'))),
        category: domain.name
      };
      
      const numStr = found.agent_id.replace(/\D/g, '').padStart(3, '0');
      recommendedAgents.push({
        id: found.agent_id,
        displayNumber: numStr,
        displayName: found.name || `Specialist AI Agent`,
        category: found.category || domain.name,
        reason: `Best match for ${domain.name}.`
      });
    }

    const primaryRec = recommendedAgents[0] || { displayNumber: '046', displayName: 'Backend AI Agent' };
    const secondaryRec = recommendedAgents[1] || null;

    // Polite, respectful, non-judgmental wording
    let politeMessage = `I'd be happy to help, but this task is a little outside my specialty.\n\nI focus on ${specialtyDescription}.\n\nFor ${domain.name.toLowerCase()}, I'd recommend:\n\n**${primaryRec.displayNumber} — ${primaryRec.displayName}**`;
    if (secondaryRec) {
      politeMessage += `\nor **${secondaryRec.displayNumber} — ${secondaryRec.displayName}**`;
    }

    return {
      inScope: false,
      status: 'out_of_scope',
      confidence: 0.96,
      currentAgent: {
        id: currentAgent.agent_id || currentAgent.id,
        name: currentAgent.name,
        specialty: specialtyDescription
      },
      detectedDomain: domain.name,
      userPrompt,
      recommendedAgents: recommendedAgents.slice(0, 2),
      politeMessage
    };
  }
}

export const agentScopeGuard = new AgentScopeGuard();
