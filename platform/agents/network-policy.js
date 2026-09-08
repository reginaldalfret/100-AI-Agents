/**
 * Network Policy Service Module
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const LOG_DIR = path.join(ROOT_DIR, 'runtime', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'network-policy.log');

export class NetworkPolicyService {
  constructor() {
    this.mode = 'LOCAL_ONLY';
    this.externalCallCount = 0;
    this.violations = [];
    
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  }

  setPolicy(mode) {
    if (['LOCAL_ONLY', 'ALLOW_EXTERNAL'].includes(mode)) {
      this.mode = mode;
    }
  }

  getPolicy() {
    return this.mode;
  }

  isExternalAllowed() {
    return this.mode === 'ALLOW_EXTERNAL';
  }

  enforceOnProcess(env) {
    const sanitized = { ...env };
    if (this.mode === 'LOCAL_ONLY') {
      delete sanitized.HTTP_PROXY;
      delete sanitized.HTTPS_PROXY;
      delete sanitized.http_proxy;
      delete sanitized.https_proxy;
      sanitized.no_proxy = '*';
    }
    return sanitized;
  }

  validateEgressAttempt(url) {
    if (this.mode === 'ALLOW_EXTERNAL') {
      this.externalCallCount++;
      return { allowed: true, reason: 'Policy allows external calls' };
    }
    
    try {
      let testUrl = url;
      if (testUrl.includes('://::1')) {
        testUrl = testUrl.replace('://::1', '://[::1]');
      }
      const parsedUrl = new URL(testUrl);
      const host = parsedUrl.hostname.replace(/^\[|\]$/g, '');
      const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
      if (isLocal) {
        return { allowed: true, reason: 'Local address' };
      }
    } catch (e) {
      // Invalid URL
    }
    
    this._logViolation(url);
    return { allowed: false, reason: 'External egress blocked by LOCAL_ONLY policy' };
  }

  getExternalCallCount() {
    if (this.mode === 'LOCAL_ONLY') return 0;
    return this.externalCallCount;
  }

  getViolationLog() {
    return this.violations;
  }

  _logViolation(url) {
    const entry = { timestamp: new Date().toISOString(), url, reason: 'Blocked by LOCAL_ONLY policy' };
    this.violations.push(entry);
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(LOG_FILE, logLine, 'utf8');
  }
}

export const networkPolicy = new NetworkPolicyService();
