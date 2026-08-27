/**
 * Agent Capability Matrix Module
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const REGISTRY_PATH = path.join(ROOT_DIR, 'registry', 'agent-integrations.json');

function loadRegistry() {
  try {
    const data = fs.readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { integrations: [] };
  }
}

/**
 * Get capabilities for a specific agent.
 * @param {string} agentId
 * @returns {string[]}
 */
export function getAgentCapabilities(agentId) {
  const registry = loadRegistry();
  const agent = registry.integrations.find(a => a.id === agentId);
  return agent ? agent.capabilities : [];
}

/**
 * Check if an agent can handle a task type.
 * @param {string} agentId
 * @param {string} taskType
 * @returns {boolean}
 */
export function canAgentHandle(agentId, taskType) {
  const capabilities = getAgentCapabilities(agentId);
  return capabilities.includes(taskType);
}

/**
 * Find the best agent for a task intent and constraints.
 * @param {string} taskIntent 
 * @param {Object} constraints 
 * @returns {Object|null}
 */
export function findBestAgent(taskIntent, constraints = {}) {
  const registry = loadRegistry();
  let candidates = registry.integrations.filter(agent => agent.capabilities.includes(taskIntent));
  
  if (constraints.requires_gpu !== undefined) {
    candidates = candidates.filter(agent => agent.requires_gpu === constraints.requires_gpu);
  }
  
  if (candidates.length === 0) return null;
  return candidates[0]; // simplistic selection
}

/**
 * Get the full capability matrix of all agents.
 * @returns {Object}
 */
export function getCapabilityMatrix() {
  const registry = loadRegistry();
  const matrix = {};
  registry.integrations.forEach(agent => {
    matrix[agent.id] = agent.capabilities;
  });
  return matrix;
}
