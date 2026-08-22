/**
 * Context Test Suite: Reference & Coreference Resolution
 * Tests resolution of anaphoric expressions (it, this, that, the second one, that code, expand it, etc.)
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { referenceResolver } from '../../platform/context/reference-resolver.js';
import { ReferenceType } from '../../platform/context/schemas.js';

test('Reference Resolution — Pronoun "it" against Active Topic', () => {
  const result = referenceResolver.resolveReferences('write about the types in it', {
    activeTopic: 'Renewable Energy',
    recentMessages: [
      { role: 'user', content: 'Write a professional article about renewable energy.' },
      { role: 'assistant', content: 'Renewable energy is derived from natural sources...' }
    ]
  });

  assert.strictEqual(result.resolved, true, 'Must resolve reference in query');
  assert.ok(result.references.length > 0, 'Must have resolved reference');
  const ref = result.references.find(r => r.surface.toLowerCase() === 'it');
  assert.ok(ref, 'Must find "it" pronoun reference');
  assert.strictEqual(ref.type, ReferenceType.PRONOUN);
  assert.strictEqual(ref.target, 'Renewable Energy');
});

test('Reference Resolution — Ordinal "the second one" against List Entities', () => {
  const result = referenceResolver.resolveReferences('Tell me more about the second one', {
    activeTopic: 'Renewable Energy',
    entities: [
      { id: 'solar', name: 'Solar Energy', type: 'list_item' },
      { id: 'wind', name: 'Wind Energy', type: 'list_item' },
      { id: 'hydro', name: 'Hydroelectric Power', type: 'list_item' }
    ],
    recentMessages: [
      { role: 'user', content: 'What are the types of renewable energy?' },
      { role: 'assistant', content: '1. Solar Energy\n2. Wind Energy\n3. Hydroelectric Power' }
    ]
  });

  assert.strictEqual(result.resolved, true);
  const ref = result.references.find(r => r.type === ReferenceType.ORDINAL);
  assert.ok(ref, 'Must find ordinal reference');
  assert.strictEqual(ref.target, 'Wind Energy');
  assert.strictEqual(ref.index, 1);
});

test('Reference Resolution — Artifact "that code" against Prior Code Snippet', () => {
  const result = referenceResolver.resolveReferences('Now optimize that code with caching', {
    activeTopic: 'Python Function',
    recentMessages: [
      { role: 'user', content: 'Write a Python function to fetch records.' },
      { role: 'assistant', content: '```python\ndef fetch_data():\n    return []\n```' }
    ]
  });

  assert.strictEqual(result.resolved, true);
  const ref = result.references.find(r => r.type === ReferenceType.ARTIFACT);
  assert.ok(ref, 'Must find artifact reference');
  assert.ok(ref.target.includes('code'), 'Target must relate to code');
});

test('Reference Resolution — Directive "make it shorter"', () => {
  const result = referenceResolver.resolveReferences('make it shorter and simpler', {
    activeTopic: 'Executive Summary',
    recentMessages: [
      { role: 'user', content: 'Draft a memo for management.' },
      { role: 'assistant', content: 'Here is the detailed memorandum...' }
    ]
  });

  assert.strictEqual(result.resolved, true);
  const ref = result.references.find(r => r.type === ReferenceType.ACTION || r.type === ReferenceType.PRONOUN);
  assert.ok(ref, 'Must identify action directive / pronoun');
});
