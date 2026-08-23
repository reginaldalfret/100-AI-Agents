import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  ragReferenceResolver, 
  RAGReferenceResolver 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 10. Coreference & Ordinal Reference Resolution Test Suite', () => {
  const resolver = new RAGReferenceResolver();

  test('1. Resolves pronouns ("it", "its") using active topic and conversation context', () => {
    const context = {
      activeTopic: 'Crude Storage Tank TK-101',
      subtopic: 'Shell Course 3',
      recentMessages: [
        { role: 'user', content: 'What is the inspection status of Crude Storage Tank TK-101?' },
        { role: 'assistant', content: 'TK-101 was inspected in May 2026 under standard API-653.' }
      ]
    };

    const res = resolver.resolveQuery('What is its minimum retirement thickness?', context);

    assert.strictEqual(res.resolved, true);
    assert.ok(res.resolvedQuery.includes('Crude Storage Tank TK-101'));
    assert.ok(res.confidence >= 0.90);
    assert.strictEqual(res.resolvedReferences[0].type, 'PRONOUN');
    assert.strictEqual(res.resolvedReferences[0].surface, 'its');
  });

  test('2. Resolves demonstrative references ("this report", "that document")', () => {
    const context = {
      activeTopic: 'Refinery Q3 Turnaround Inspection Report',
      recentMessages: [
        { role: 'user', content: 'Summarize the Refinery Q3 Turnaround Inspection Report' }
      ]
    };

    const res = resolver.resolveQuery('What were the critical findings in this report?', context);

    assert.strictEqual(res.resolved, true);
    assert.ok(res.resolvedQuery.includes('Refinery Q3 Turnaround Inspection Report'));
    assert.strictEqual(res.resolvedReferences[0].type, 'DEMONSTRATIVE_NOUN');
  });

  test('3. Resolves ordinal references ("the second finding", "the first one", "the latter")', () => {
    const context = {
      recentMessages: [
        {
          role: 'assistant',
          content: [
            'Inspection Findings for Crude Unit:',
            '1. Shell course wall thinning detected on Tank TK-101',
            '2. Corrosion Under Insulation (CUI) observed on steam tracing line FV-204',
            '3. Vibration severity exceeded on booster pump P-102A'
          ].join('\n')
        }
      ]
    };

    const res = resolver.resolveQuery('What repair procedure applies to the second finding?', context);

    assert.strictEqual(res.resolved, true);
    assert.ok(res.resolvedQuery.includes('Corrosion Under Insulation (CUI) observed on steam tracing line FV-204'));
    assert.strictEqual(res.resolvedReferences[0].type, 'ORDINAL');
    assert.strictEqual(res.resolvedReferences[0].index, 1);
  });

  test('4. Resolves ordinals from structured previous findings or entity memory', () => {
    const context = {
      previousFindings: [
        'API-653 Course 1 Thickness (8.50 mm)',
        'API-653 Course 2 Thickness (7.20 mm)',
        'API-653 Course 3 Thickness (6.80 mm)'
      ]
    };

    const res = resolver.resolveQuery('Tell me the calculation formula for the third standard', context);

    assert.strictEqual(res.resolved, true);
    assert.ok(res.resolvedQuery.includes('API-653 Course 3 Thickness (6.80 mm)'));
    assert.strictEqual(res.resolvedReferences[0].index, 2);
  });

  test('5. Fast-path: self-contained queries pass through unchanged', () => {
    const res = resolver.resolveQuery('What is the minimum pressure required by OISD-STD-129?');
    assert.strictEqual(res.resolved, false);
    assert.strictEqual(res.resolvedQuery, 'What is the minimum pressure required by OISD-STD-129?');
    assert.strictEqual(res.confidence, 1.0);
  });
});
