/**
 * platform/specialists/specialist-manager.js
 * 
 * 301 SUPER AI — TWO-DOMAIN SPECIALIST SYSTEM
 * Production / Demo Workflow strictly dedicated to:
 * 1. CYBERSECURITY -> babar_jamali/qwen3-1.7b-cyber:latest
 * 2. HEALTHCARE -> medgemma:4b-it-q4_K_M
 * 
 * Sovereign Local Execution (100% Air-Gapped, 0 External Calls).
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const SpecialistDomain = {
  CYBERSECURITY: 'cybersecurity',
  HEALTHCARE: 'healthcare'
};

export const SPECIALIST_REGISTRY = {
  [SpecialistDomain.CYBERSECURITY]: {
    id: 'cybersecurity',
    domain: 'CYBERSECURITY',
    model: 'babar_jamali/qwen3-1.7b-cyber:latest',
    displayName: 'Cybersecurity AI Specialist',
    specialistTitle: 'Cybersecurity Fine-Tuned LLM',
    badge: 'CYBERSECURITY',
    secondaryBadge: 'SPECIALIZED LLM',
    provider: 'Babar Ali Jamali',
    baseFamily: 'Qwen3 1.7B',
    parameters: '1.72B Q4_K_M',
    contextLength: 40960,
    runtime: 'ollama',
    endpoint: 'http://127.0.0.1:11434',
    hardware: 'RTX 2050 (4GB VRAM)',
    disclaimer: null,
    starterPrompts: [
      'Explain the security issue in this dataset.',
      'Summarize the most common incident categories.',
      'Identify the highest-frequency security event.',
      'What defensive action should be prioritized?'
    ]
  },
  [SpecialistDomain.HEALTHCARE]: {
    id: 'healthcare',
    domain: 'HEALTHCARE',
    model: 'medgemma:4b-it-q4_K_M',
    displayName: 'Healthcare AI Specialist',
    specialistTitle: 'Healthcare Fine-Tuned LLM',
    badge: 'HEALTHCARE',
    secondaryBadge: 'MEDICAL AI',
    provider: 'Google',
    baseFamily: 'MedGemma 4B',
    parameters: '4.3B Q4_K_M',
    contextLength: 131072,
    runtime: 'ollama',
    endpoint: 'http://127.0.0.1:11434',
    hardware: 'RTX 2050 (4GB VRAM)',
    disclaimer: 'For informational and decision-support use only. Not a substitute for a qualified healthcare professional.',
    starterPrompts: [
      'Summarize the healthcare dataset.',
      'What are the most common categories?',
      'Explain the trends shown in this dataset.',
      'Summarize the synthetic healthcare cases.'
    ]
  }
};

/**
 * Automatically classifies an uploaded dataset into CYBERSECURITY or HEALTHCARE
 */
export function detectDatasetDomain(filename = '', columns = [], sampleRows = []) {
  const nameLower = (filename || '').toLowerCase();
  const colStr = columns.map(c => String(c).toLowerCase()).join(' ');
  const sampleStr = JSON.stringify(sampleRows).toLowerCase();

  const cyberKeywords = [
    'cyber', 'cve', 'threat', 'attack', 'vulnerability', 'incident',
    'ip', 'auth', 'port', 'soc', 'firewall', 'malware', 'security',
    'exploit', 'breach', 'ssh', 'bruteforce', 'payload', 'mitre'
  ];

  const healthcareKeywords = [
    'health', 'medical', 'patient', 'diagnosis', 'symptom', 'clinical',
    'disease', 'dosage', 'heart_rate', 'ecg', 'blood_pressure', 'treatment',
    'vital', 'pathology', 'hospital', 'icd', 'pharma', 'dr_', 'triage'
  ];

  let cyberScore = 0;
  let healthScore = 0;

  cyberKeywords.forEach(kw => {
    if (nameLower.includes(kw)) cyberScore += 3;
    if (colStr.includes(kw)) cyberScore += 2;
    if (sampleStr.includes(kw)) cyberScore += 1;
  });

  healthcareKeywords.forEach(kw => {
    if (nameLower.includes(kw)) healthScore += 3;
    if (colStr.includes(kw)) healthScore += 2;
    if (sampleStr.includes(kw)) healthScore += 1;
  });

  if (cyberScore > healthScore && cyberScore > 0) {
    return {
      domain: SpecialistDomain.CYBERSECURITY,
      domainLabel: 'Cybersecurity',
      confidence: Math.min(0.99, 0.6 + cyberScore * 0.05),
      specialist: SPECIALIST_REGISTRY[SpecialistDomain.CYBERSECURITY]
    };
  } else if (healthScore > cyberScore && healthScore > 0) {
    return {
      domain: SpecialistDomain.HEALTHCARE,
      domainLabel: 'Healthcare',
      confidence: Math.min(0.99, 0.6 + healthScore * 0.05),
      specialist: SPECIALIST_REGISTRY[SpecialistDomain.HEALTHCARE]
    };
  }

  return {
    domain: 'UNKNOWN',
    domainLabel: 'Please select dataset domain',
    confidence: 0,
    options: [SpecialistDomain.CYBERSECURITY, SpecialistDomain.HEALTHCARE]
  };
}

/**
 * Specialist Session Manager
 */
export class SpecialistChatSessionManager {
  constructor(baseDir = 'E:\\Smart Automation\\100-AI-Agents\\data\\specialists') {
    this.baseDir = baseDir;
    this.sessions = new Map();
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch (e) {}
  }

  createSession({ domain, dataset_id = null, dataset_name = null }) {
    const normalizedDomain = (domain || '').toLowerCase().trim();
    if (!SPECIALIST_REGISTRY[normalizedDomain]) {
      throw new Error(`Invalid domain "${domain}". Supported domains: cybersecurity, healthcare.`);
    }

    const specialist = SPECIALIST_REGISTRY[normalizedDomain];
    const sessionId = `spec_sess_${crypto.randomBytes(6).toString('hex')}`;

    const session = {
      session_id: sessionId,
      domain: normalizedDomain,
      domain_label: specialist.domain,
      dataset_id: dataset_id,
      dataset_name: dataset_name,
      specialist_id: specialist.id,
      model: specialist.model, // Hard locked model
      model_display_name: specialist.displayName,
      specialist_title: specialist.specialistTitle,
      runtime: 'ollama',
      network_mode: 'LOCAL_ONLY',
      external_calls: 0,
      disclaimer: specialist.disclaimer,
      starter_prompts: specialist.starterPrompts,
      created_at: new Date().toISOString(),
      messages: []
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  appendMessage(sessionId, message) {
    const session = this.getSession(sessionId);
    if (!session) return null;
    session.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    return session;
  }

  resetSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
    }
  }
}

export const specialistSessionManager = new SpecialistChatSessionManager();

/**
 * Checks health of the two specialist models in Ollama
 */
export async function checkSpecialistModelsHealth() {
  return new Promise((resolve) => {
    http.get('http://127.0.0.1:11434/api/tags', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const modelNames = (json.models || []).map(m => m.name);
          const cyberReady = modelNames.includes(SPECIALIST_REGISTRY[SpecialistDomain.CYBERSECURITY].model);
          const healthReady = modelNames.includes(SPECIALIST_REGISTRY[SpecialistDomain.HEALTHCARE].model);

          resolve({
            status: 'ok',
            cybersecurity: {
              model: SPECIALIST_REGISTRY[SpecialistDomain.CYBERSECURITY].model,
              ready: cyberReady,
              status: cyberReady ? 'READY' : 'SPECIALIST MODEL UNAVAILABLE'
            },
            healthcare: {
              model: SPECIALIST_REGISTRY[SpecialistDomain.HEALTHCARE].model,
              ready: healthReady,
              status: healthReady ? 'READY' : 'SPECIALIST MODEL UNAVAILABLE'
            }
          });
        } catch (e) {
          resolve({
            status: 'error',
            error: e.message,
            cybersecurity: { ready: false, status: 'SPECIALIST MODEL UNAVAILABLE' },
            healthcare: { ready: false, status: 'SPECIALIST MODEL UNAVAILABLE' }
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        status: 'error',
        error: err.message,
        cybersecurity: { ready: false, status: 'SPECIALIST MODEL UNAVAILABLE' },
        healthcare: { ready: false, status: 'SPECIALIST MODEL UNAVAILABLE' }
      });
    });
  });
}

/**
 * Dispatches inference to the strictly locked Ollama specialist model
 */
export async function querySpecialistModel({ domain, prompt, stream = false, datasetContext = null }) {
  const normalizedDomain = (domain || '').toLowerCase().trim();
  const specialist = SPECIALIST_REGISTRY[normalizedDomain];
  if (!specialist) {
    throw new Error(`Domain "${domain}" is not supported. Must be "cybersecurity" or "healthcare".`);
  }

  // Enforce zero external egress & strict model lock
  const lockedModel = specialist.model;

  let systemPrompt = '';
  if (normalizedDomain === SpecialistDomain.CYBERSECURITY) {
    systemPrompt = 'You are the Cybersecurity AI Specialist. Provide rigorous, precise, technical insights on SOC operations, threat intelligence, and vulnerability mitigation. Keep outputs technical and actionable.';
  } else if (normalizedDomain === SpecialistDomain.HEALTHCARE) {
    systemPrompt = 'You are the Healthcare AI Specialist. Provide informative clinical decision-support and medical context explanations. Note: This output is strictly for informational and decision-support use only and is not a substitute for a qualified healthcare professional.';
  }

  let userContent = prompt;
  if (datasetContext) {
    userContent = `[DOMAIN DATASET CONTEXT]:\n${datasetContext}\n\n[USER QUESTION]:\n${prompt}`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: lockedModel,
      messages: messages,
      stream: false,
      options: {
        num_ctx: 2048,
        temperature: 0.2,
        top_p: 0.9
      }
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const responseText = json.message ? json.message.content : (json.response || '');
          resolve({
            domain: normalizedDomain,
            specialist: specialist.displayName,
            specialist_title: specialist.specialistTitle,
            model: lockedModel,
            runtime: 'Ollama',
            external_calls: 0,
            network_mode: 'LOCAL_ONLY',
            response: responseText,
            disclaimer: specialist.disclaimer,
            duration_ms: json.total_duration ? Math.round(json.total_duration / 1e6) : null
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
