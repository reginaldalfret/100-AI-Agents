/**
 * Sovereign AI Workbench — Agent Scope Guard & Polite Domain Boundary Enforcement
 * 
 * Determines whether a specialist agent can legitimately handle a user request based on PRIMARY TASK INTENT.
 * Distinguishes DOING a technical task from EXPLAINING/WRITING about that domain.
 * Generates warm, polite, and helpful guidance with one-click specialist agent switching.
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
  email: {
    id: 'email-communication',
    name: 'Email & Business Correspondence',
    primaryAgents: ['agent-002', 'agent-001'],
    specialtyDesc: 'drafting emails, business correspondence, internship outreach, and message replies',
    patterns: [
      /\b(write|draft|compose|send|reply to|create)\s+(an?\s+)?(email|mail|internship email|cover email|formal email|business email|outreach email)\b/i,
      /\b(email to|email for|email about|draft an email|write an email|write a email)\b/i
    ]
  },
  quiz: {
    id: 'quiz-assessment',
    name: 'Quizzes & Knowledge Assessments',
    primaryAgents: ['agent-004', 'agent-003'],
    specialtyDesc: 'quizzes, assessments, multiple choice questions (MCQs), and knowledge testing',
    patterns: [
      /\b(quiz|mcq|multiple choice|assessment|test questions|trivia|create a quiz|quiz me|generate 10 mcqs|practice questions)\b/i
    ]
  },
  study: {
    id: 'education-study',
    name: 'Education & Study Planning',
    primaryAgents: ['agent-003', 'agent-004'],
    specialtyDesc: 'study schedules, revision timetables, exam preparation, syllabus breakdowns, and learning strategies',
    patterns: [
      /\b(study plan|revision timetable|exam schedule|exam prep|syllabus breakdown|7-day study plan|how to study)\b/i
    ]
  },
  writing: {
    id: 'writing-content',
    name: 'Writing & Editorial',
    primaryAgents: ['agent-001', 'agent-002'],
    specialtyDesc: 'writing articles, formal essays, blog posts, press releases, and editorial content',
    patterns: [
      /\b(write an? article|draft an? essay|write a blog|write a story|write a poem|press release|executive memo|proofread text)\b/i
    ]
  },
  backend: {
    id: 'coding-development',
    name: 'Coding & Software Engineering',
    primaryAgents: ['agent-061', 'agent-075', 'agent-055'],
    specialtyDesc: 'software development, backend APIs, microservices, algorithms, and code generation',
    patterns: [
      /\b(write\s+(a\s+)?(node\.js\s+|python\s+|fastapi\s+|express\s+)?rest\s*api|build\s+(a\s+)?rest\s*api|create\s+(an?\s+)?api|build\s+backend|express\s+handler|fastapi\s+route|crud\s+endpoint|node\.js\s+server|flask\s+endpoint|spring\s+boot|implement\s+algorithm|fix\s+this\s+bug|build\s+an?\s+app)\b/i
    ]
  },
  database: {
    id: 'database-sql',
    name: 'Database & SQL Engineering',
    primaryAgents: ['agent-071', 'agent-048'],
    specialtyDesc: 'SQL queries, database schemas, table migrations, index tuning, and database optimization',
    patterns: [
      /\b(write a sql|sql query|join these tables|database migration|create table schema|database indexing|optimize query|postgresql trigger|foreign key constraint)\b/i
    ]
  },
  devops: {
    id: 'devops-cloud',
    name: 'DevOps & Infrastructure',
    primaryAgents: ['agent-072', 'agent-073', 'agent-074'],
    specialtyDesc: 'Docker containers, Kubernetes, CI/CD pipelines, cloud deployment, and infrastructure scripts',
    patterns: [
      /\b(deploy to aws|docker deployment|kubernetes manifest|ci\/cd pipeline|terraform script|dockerfile|helm chart|nginx config|deploy this)\b/i
    ]
  },
  image: {
    id: 'image-vision',
    name: 'Image & Visual Analysis',
    primaryAgents: ['agent-051', 'agent-052'],
    specialtyDesc: 'analyzing visual media, photographs, technical diagrams, P&ID schematics, and OCR extraction',
    patterns: [
      /\b(analyze this image|extract text from photo|ocr this document|read diagram|inspect visual photo|detect objects|p&id schematic)\b/i
    ]
  },
  spreadsheet: {
    id: 'spreadsheet-analytics',
    name: 'Spreadsheets & Data Analytics',
    primaryAgents: ['agent-047', 'agent-048'],
    specialtyDesc: 'spreadsheet data analysis, Excel calculations, CSV processing, and statistical deviations',
    patterns: [
      /\b(spreadsheet|excel|analyze csv|vlookup|pivot table|cell deviation)\b/i
    ]
  },
  research: {
    id: 'research-intelligence',
    name: 'Research & Knowledge Discovery',
    primaryAgents: ['agent-021', 'agent-040'],
    specialtyDesc: 'web research, literature reviews, market intelligence, and competitive benchmarking',
    patterns: [
      /\b(research on|literature review|market trends|competitor analysis|search web for)\b/i
    ]
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
    const agentName = agent.name || `Agent ${num}`;

    // Rule 1: Agent 101 Super AI Agent is Master Orchestrator (Always In-Scope for all requests)
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

    // Rule 3: Detect specific specialist identities
    const isWritingAgent = num === 1 || agentName.toLowerCase().includes('writing');
    const isEmailAgent = num === 2 || agentName.toLowerCase().includes('email');
    const isStudyAgent = num === 3 || agentName.toLowerCase().includes('study');
    const isQuizAgent = num === 4 || agentName.toLowerCase().includes('quiz');
    const isFlashcardAgent = num === 5 || agentName.toLowerCase().includes('flashcard');
    const isImageAgent = num === 51 || num === 66 || num === 67 || agentName.toLowerCase().includes('image') || agentName.toLowerCase().includes('vision');
    const isDevOpsAgent = num === 15 || num === 62 || num === 63 || agentName.toLowerCase().includes('devops') || agentName.toLowerCase().includes('cloud');
    const isDatabaseAgent = num === 11 || num === 31 || agentName.toLowerCase().includes('database') || agentName.toLowerCase().includes('sql');
    const isCodingAgent = (num >= 6 && num <= 9) || num === 18 || num === 33 || num === 46 || num === 61 || agentName.toLowerCase().includes('code') || agentName.toLowerCase().includes('backend') || agentName.toLowerCase().includes('python') || agentName.toLowerCase().includes('javascript');

    // =========================================================================
    // IN-SCOPE ALLOW-LIST CHECKS FOR SPECIFIC AGENTS
    // =========================================================================

    // Case 1: Email Agent
    if (isEmailAgent) {
      if (DOMAIN_PROFILES.email.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('email') || lowerTask.includes('mail') || lowerTask.includes('letter') || lowerTask.includes('inbox') || lowerTask.includes('reply')) {
        return { inScope: true, confidence: 0.98, detectedDomain: 'email-communication' };
      }
      // Out of scope requests sent to Email Agent:
      if (DOMAIN_PROFILES.quiz.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'quiz', 'drafting emails, formal outreach, and professional correspondence');
      }
      if (DOMAIN_PROFILES.backend.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'backend', 'drafting emails, formal outreach, and professional correspondence');
      }
      if (DOMAIN_PROFILES.database.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'database', 'drafting emails, formal outreach, and professional correspondence');
      }
      if (DOMAIN_PROFILES.devops.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'devops', 'drafting emails, formal outreach, and professional correspondence');
      }
    }

    // Case 2: Quiz Agent
    if (isQuizAgent) {
      if (DOMAIN_PROFILES.quiz.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('quiz') || lowerTask.includes('mcq') || lowerTask.includes('assessment') || lowerTask.includes('questions') || lowerTask.includes('test me')) {
        return { inScope: true, confidence: 0.98, detectedDomain: 'quiz-assessment' };
      }
      // Out of scope requests sent to Quiz Agent:
      if (DOMAIN_PROFILES.email.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('email') || lowerTask.includes('mail')) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'email', 'quizzes, assessments, and question generation');
      }
      if (DOMAIN_PROFILES.backend.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'backend', 'quizzes, assessments, and question generation');
      }
      if (DOMAIN_PROFILES.database.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'database', 'quizzes, assessments, and question generation');
      }
      if (DOMAIN_PROFILES.devops.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'devops', 'quizzes, assessments, and question generation');
      }
    }

    // Case 3: Study Agent
    if (isStudyAgent) {
      if (isExplanationIntent || isExamOrStudyIntent || DOMAIN_PROFILES.study.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('study') || lowerTask.includes('exam') || lowerTask.includes('revision') || lowerTask.includes('syllabus')) {
        return { inScope: true, confidence: 0.95, detectedDomain: 'education-study' };
      }
      // Technical execution asked of Study Agent:
      if (DOMAIN_PROFILES.backend.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'backend', 'study planning, revision schedules, exam preparation, and learning strategies');
      }
      if (DOMAIN_PROFILES.database.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'database', 'study planning, revision schedules, exam preparation, and learning strategies');
      }
      if (DOMAIN_PROFILES.devops.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'devops', 'study planning, revision schedules, exam preparation, and learning strategies');
      }
      if (DOMAIN_PROFILES.email.patterns.some(p => p.test(lowerTask)) && !isExamOrStudyIntent) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'email', 'study planning, revision schedules, exam preparation, and learning strategies');
      }
    }

    // Case 4: Writing Agent
    if (isWritingAgent) {
      if (isWritingArticleIntent || DOMAIN_PROFILES.writing.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('write an article') || lowerTask.includes('essay') || lowerTask.includes('blog') || lowerTask.includes('story') || lowerTask.includes('proofread')) {
        return { inScope: true, confidence: 0.95, detectedDomain: 'writing-content' };
      }
      if (DOMAIN_PROFILES.devops.patterns.some(p => p.test(lowerTask)) && !isWritingArticleIntent) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'devops', 'writing articles, essays, and editorial content');
      }
      if (DOMAIN_PROFILES.backend.patterns.some(p => p.test(lowerTask)) && !isWritingArticleIntent) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'backend', 'writing articles, essays, and editorial content');
      }
      if (DOMAIN_PROFILES.database.patterns.some(p => p.test(lowerTask)) && !isWritingArticleIntent) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'database', 'writing articles, essays, and editorial content');
      }
      if (DOMAIN_PROFILES.quiz.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'quiz', 'writing articles, essays, and editorial content');
      }
    }

    // Case 5: Coding / Backend Agent
    if (isCodingAgent) {
      if (DOMAIN_PROFILES.backend.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('code') || lowerTask.includes('script') || lowerTask.includes('function') || lowerTask.includes('algorithm') || lowerTask.includes('api')) {
        return { inScope: true, confidence: 0.95, detectedDomain: 'backend-development' };
      }
      if (DOMAIN_PROFILES.quiz.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'quiz', 'software development, coding, algorithms, and backend APIs');
      }
      if (DOMAIN_PROFILES.study.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'study', 'software development, coding, algorithms, and backend APIs');
      }
      if (DOMAIN_PROFILES.email.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'email', 'software development, coding, algorithms, and backend APIs');
      }
    }

    // Case 6: Image Analysis Agent
    if (isImageAgent) {
      if (DOMAIN_PROFILES.image.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('image') || lowerTask.includes('photo') || lowerTask.includes('ocr') || lowerTask.includes('diagram') || lowerTask.includes('drawing')) {
        return { inScope: true, confidence: 0.95, detectedDomain: 'image-vision' };
      }
      if (DOMAIN_PROFILES.database.patterns.some(p => p.test(lowerTask)) && !lowerTask.includes('diagram')) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'database', 'analyzing visual media, photographs, technical diagrams, and document OCR');
      }
      if (DOMAIN_PROFILES.backend.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'backend', 'analyzing visual media, photographs, technical diagrams, and document OCR');
      }
      if (DOMAIN_PROFILES.email.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'email', 'analyzing visual media, photographs, technical diagrams, and document OCR');
      }
      if (DOMAIN_PROFILES.quiz.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'quiz', 'analyzing visual media, photographs, technical diagrams, and document OCR');
      }
    }

    // Case 7: Database / SQL Agent
    if (isDatabaseAgent) {
      if (DOMAIN_PROFILES.database.patterns.some(p => p.test(lowerTask)) || lowerTask.includes('sql') || lowerTask.includes('query') || lowerTask.includes('database') || lowerTask.includes('table') || lowerTask.includes('schema')) {
        return { inScope: true, confidence: 0.95, detectedDomain: 'database-sql' };
      }
      if (DOMAIN_PROFILES.quiz.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'quiz', 'SQL queries, database schemas, table migrations, and database engineering');
      }
      if (DOMAIN_PROFILES.email.patterns.some(p => p.test(lowerTask))) {
        return this._buildOutOfScopeResponse(agent, cleanTask, 'email', 'SQL queries, database schemas, table migrations, and database engineering');
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
        name: this._getDefaultAgentName(agId),
        category: domain.name
      };
      
      const numStr = found.agent_id.replace(/\D/g, '').padStart(3, '0');
      recommendedAgents.push({
        id: found.agent_id,
        displayNumber: numStr,
        displayName: found.name || `Specialist AI Agent`,
        name: found.name || `Specialist AI Agent`,
        category: found.category || domain.name,
        reason: `Specialized in ${domain.specialtyDesc}.`
      });
    }

    const primaryRec = recommendedAgents[0] || { id: 'agent-046', displayNumber: '046', displayName: 'Backend AI Agent', name: 'Backend AI Agent' };
    const curId = currentAgent.agent_id || currentAgent.id || 'agent-001';
    const curNum = curId.replace(/\D/g, '').padStart(3, '0');
    const curName = currentAgent.name || `Agent ${curNum}`;

    // Polite, non-judgmental, professional wording (strictly avoids harsh words: cannot, not my job, wrong agent, rejected, error)
    const politeMessage = `This request is outside my specialization.\n\nI'm specialized in ${specialtyDescription}. This request is better handled by the **${primaryRec.displayName}**.`;

    return {
      inScope: false,
      status: 'out_of_scope',
      confidence: 0.98,
      currentAgentId: curNum,
      currentAgentName: curName,
      recommendedAgentId: primaryRec.displayNumber,
      recommendedAgentName: primaryRec.displayName,
      currentAgent: {
        id: curId,
        displayNumber: curNum,
        name: curName,
        specialty: specialtyDescription
      },
      recommendedAgent: primaryRec,
      recommendedAgents: recommendedAgents.slice(0, 2),
      detectedDomain: domain.name,
      reason: `${domain.name} is outside the ${curName} domain boundary.`,
      originalPrompt: userPrompt,
      userPrompt,
      politeMessage
    };
  }

  _getDefaultAgentName(agentId) {
    const map = {
      'agent-001': 'Writing AI Agent',
      'agent-002': 'Email AI Agent',
      'agent-003': 'Study AI Agent',
      'agent-004': 'Quiz AI Agent',
      'agent-005': 'Flashcard AI Agent',
      'agent-007': 'Code Generator AI Agent',
      'agent-010': 'UI/UX Design AI Agent',
      'agent-011': 'Database AI Agent',
      'agent-015': 'DevOps AI Agent',
      'agent-018': 'Python AI Agent',
      'agent-021': 'Web Research AI Agent',
      'agent-031': 'SQL AI Agent',
      'agent-033': 'JavaScript AI Agent',
      'agent-046': 'Backend AI Agent',
      'agent-047': 'Frontend AI Agent',
      'agent-051': 'Image Analysis AI Agent',
      'agent-062': 'Cloud Infrastructure AI Agent',
      'agent-063': 'Kubernetes AI Agent',
      'agent-066': 'Computer Vision AI Agent',
      'agent-067': 'Diagram Intelligence AI Agent',
      'agent-084': 'Business Analyst AI Agent',
      'agent-101': 'Super AI Agent'
    };
    return map[agentId] || 'Specialist AI Agent';
  }
}

export const agentScopeGuard = new AgentScopeGuard();

