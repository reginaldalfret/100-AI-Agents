import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  reranker, 
  Reranker 
} from '../../platform/rag/index.js';

describe('RAG Subsystem — 7. Lightweight Reranker & Score Fusion Test Suite', () => {
  const customReranker = new Reranker({
    phraseBoost: 3.0,
    headingBoost: 2.0,
    densityWeight: 1.5,
    originalScoreWeight: 1.0
  });

  test('1. Exact phrase matching boosts relevant chunk to rank 1', () => {
    const candidates = [
      {
        chunkId: 'chk_partial_1',
        heading: 'General Inspection Guidelines',
        text: 'The standard specifies various thickness parameters and shell course inspections across all tanks.',
        score: 0.85
      },
      {
        chunkId: 'chk_exact_match',
        heading: 'Retirement Thresholds',
        text: 'According to standards, the exact minimum retirement thickness is 6.80 mm for crude storage tank course 3.',
        score: 0.70 // Lower initial score
      },
      {
        chunkId: 'chk_partial_2',
        heading: 'Corrosion Monitoring',
        text: 'Ultrasonic thickness testing is conducted periodically to detect shell wall thinning.',
        score: 0.80
      }
    ];

    const query = 'minimum retirement thickness is 6.80 mm';
    const reranked = customReranker.rerank(query, candidates, { topK: 3 });

    // The second candidate has an exact phrase match and must be reranked to position 0
    assert.strictEqual(reranked[0].chunkId, 'chk_exact_match');
    assert.ok(reranked[0].rerankScore > reranked[1].rerankScore);
  });

  test('2. Query term coverage and density promotes comprehensive answers', () => {
    const candidates = [
      {
        chunkId: 'chk_single_term',
        heading: 'Fire System Pressure',
        text: 'The water system provides pressure throughout the plant network.',
        score: 0.75
      },
      {
        chunkId: 'chk_full_coverage',
        heading: 'OISD-STD-129 Fire Water Specifications',
        text: 'OISD-STD-129 fire water ring main requires 7.0 kg/cm2 header pressure with diesel driven booster pumps.',
        score: 0.72
      }
    ];

    const query = 'OISD-STD-129 fire water ring main 7.0 kg/cm2 pressure';
    const reranked = customReranker.rerank(query, candidates);

    assert.strictEqual(reranked[0].chunkId, 'chk_full_coverage');
    assert.strictEqual(reranked[0].termCoverageRatio, 1.0);
  });

  test('3. Heading and Title match boosting', () => {
    const candidates = [
      {
        chunkId: 'chk_body_match',
        heading: 'Miscellaneous Maintenance',
        text: 'Ensure all steam tracing lines are checked for leaks during winter turnaround.',
        score: 0.60
      },
      {
        chunkId: 'chk_heading_match',
        heading: 'Steam Tracing Line Inspection Procedure',
        text: 'Routine walk-through of overhead headers to ensure thermal integrity.',
        score: 0.60
      }
    ];

    const query = 'Steam Tracing Line Inspection Procedure';
    const reranked = customReranker.rerank(query, candidates);

    assert.strictEqual(reranked[0].chunkId, 'chk_heading_match');
    assert.ok(reranked[0].rerankScore > reranked[1].rerankScore);
  });

  test('4. Code symbol name matching boost', () => {
    const candidates = [
      {
        chunkId: 'chk_general_code',
        heading: 'Utility Helpers',
        text: 'function helper() { return true; }',
        codeMetadata: { symbol: 'helper', symbolType: 'function' },
        score: 0.65
      },
      {
        chunkId: 'chk_target_func',
        heading: 'FUNCTION: calculateRetirementThickness',
        text: 'export function calculateRetirementThickness(radius, height, stress) { ... }',
        codeMetadata: { symbol: 'calculateRetirementThickness', symbolType: 'function' },
        score: 0.60
      }
    ];

    const query = 'calculateRetirementThickness function implementation';
    const reranked = customReranker.rerank(query, candidates);

    assert.strictEqual(reranked[0].chunkId, 'chk_target_func');
    assert.ok(reranked[0].rerankScore > reranked[1].rerankScore);
  });

  test('5. Handles empty inputs and single candidate safely', () => {
    assert.deepStrictEqual(reranker.rerank('', []), []);
    assert.deepStrictEqual(reranker.rerank('test query', null), []);

    const single = [{ chunkId: 'chk_1', text: 'Solo', score: 0.5 }];
    const res = reranker.rerank('Solo', single);
    assert.strictEqual(res.length, 1);
  });
});
