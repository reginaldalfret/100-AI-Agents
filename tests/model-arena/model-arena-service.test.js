import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../..');

describe('Model Arena Service Module', () => {
  const servicePath = path.join(ROOT, 'platform', 'model-arena', 'model-arena-service.js');
  
  it('service file exists', () => {
    assert.ok(fs.existsSync(servicePath), 'model-arena-service.js should exist');
  });
  
  it('exports ModelArenaService class', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('export class ModelArenaService'), 'Should export ModelArenaService');
  });
  
  it('exports singleton instance', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('export const modelArenaService'), 'Should export modelArenaService singleton');
  });
  
  it('exports DEFAULT_ARENA_MODELS', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('export const DEFAULT_ARENA_MODELS'), 'Should export DEFAULT_ARENA_MODELS');
  });
  
  it('DEFAULT_ARENA_MODELS contains exactly 8 models', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    const match = content.match(/DEFAULT_ARENA_MODELS\s*=\s*\[([^\]]+)\]/);
    assert.ok(match, 'Should define DEFAULT_ARENA_MODELS as array');
    const items = match[1].split(',').map(s => s.trim()).filter(Boolean);
    assert.equal(items.length, 8, 'Should have exactly 8 default models');
  });
  
  it('has OllamaAdapter class', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('class OllamaAdapter'), 'Should have OllamaAdapter');
  });
  
  it('has sequential queue mechanism', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('processQueue') || content.includes('queue'), 'Should have queue processing');
  });
  
  it('has compare method', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('compare(') || content.includes('async compare('), 'Should have compare method');
  });
  
  it('has cancelComparison method', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('cancelComparison('), 'Should have cancelComparison method');
  });
  
  it('has clearComparison method', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('clearComparison('), 'Should have clearComparison method');
  });
  
  it('uses Ollama endpoint', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('11434'), 'Should reference Ollama port 11434');
  });
  
  it('imports from model-registry', () => {
    const content = fs.readFileSync(servicePath, 'utf8');
    assert.ok(content.includes('model-registry'), 'Should import from model-registry');
  });
});
