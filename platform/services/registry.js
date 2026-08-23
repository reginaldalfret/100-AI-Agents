/**
 * Sovereign AI Workbench — Service Registry Reader
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getServiceRegistry() {
  const jsonPath = path.join(__dirname, 'service-registry.json');
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}
