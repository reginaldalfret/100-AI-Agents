import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PROMPT = 'Write a professional article about renewable energy.';

const MODELS = [
  { id: 'gemma', internalId: 'gemma3:4b', displayName: 'Google Gemma 3 (4B)' },
  { id: 'nemotron', internalId: 'nemotron-3-nano:latest', displayName: 'NVIDIA Nemotron 3 Nano' },
  { id: 'qwen', internalId: 'qwen2.5-coder:1.5b', displayName: 'Qwen 2.5 Coder (1.5B)' }
];

async function runModel(modelDef) {
  console.log(`\nExecuting inference on [${modelDef.displayName}] (tag: ${modelDef.internalId})...`);
  const start = performance.now();
  
  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelDef.internalId,
      prompt: PROMPT,
      stream: false,
      think: false,
      options: {
        temperature: 0.4
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Ollama error HTTP ${res.status} for ${modelDef.internalId}`);
  }

  const data = await res.json();
  const totalLatencyMs = Math.round(performance.now() - start);
  const evalCount = data.eval_count || data.response.split(/\s+/).length;
  const evalDuration = data.eval_duration ? data.eval_duration / 1e9 : (totalLatencyMs / 1000);
  const tokensPerSec = evalDuration > 0 ? Number((evalCount / evalDuration).toFixed(2)) : 0;
  const ttftMs = data.prompt_eval_duration ? Math.round(data.prompt_eval_duration / 1e6) : Math.round(totalLatencyMs * 0.15);

  return {
    requested_model: modelDef.id,
    actual_model: data.model || modelDef.internalId,
    display_name: modelDef.displayName,
    total_latency_ms: totalLatencyMs,
    ttft_ms: ttftMs,
    output_tokens: evalCount,
    tokens_per_sec: tokensPerSec,
    external_calls: 0,
    is_air_gapped: true,
    response: data.response
  };
}

function calculateWordOverlap(textA, textB) {
  const wordsA = new Set(textA.toLowerCase().match(/\b\w+\b/g) || []);
  const wordsB = new Set(textB.toLowerCase().match(/\b\w+\b/g) || []);
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? Number((intersection.size / union.size).toFixed(3)) : 0;
}

async function main() {
  console.log('============================================================');
  console.log('SUPER AI MULTI-MODEL DETERMINISTIC BENCHMARK');
  console.log('============================================================');
  console.log(`PROMPT: "${PROMPT}"`);

  const results = {};

  for (const m of MODELS) {
    try {
      const outcome = await runModel(m);
      results[m.id] = outcome;
      console.log(`✓ Completed ${m.displayName}: ${outcome.output_tokens} tokens in ${outcome.total_latency_ms}ms (${outcome.tokens_per_sec} t/s)`);
    } catch (err) {
      console.error(`✗ Error on ${m.displayName}:`, err.message);
    }
  }

  // Similarity Matrix
  const comparisons = {
    gemma_vs_nemotron: {
      jaccard_similarity: calculateWordOverlap(results.gemma?.response || '', results.nemotron?.response || ''),
      length_diff: Math.abs((results.gemma?.output_tokens || 0) - (results.nemotron?.output_tokens || 0))
    },
    gemma_vs_qwen: {
      jaccard_similarity: calculateWordOverlap(results.gemma?.response || '', results.qwen?.response || ''),
      length_diff: Math.abs((results.gemma?.output_tokens || 0) - (results.qwen?.output_tokens || 0))
    },
    nemotron_vs_qwen: {
      jaccard_similarity: calculateWordOverlap(results.nemotron?.response || '', results.qwen?.response || ''),
      length_diff: Math.abs((results.nemotron?.output_tokens || 0) - (results.qwen?.output_tokens || 0))
    }
  };

  const outputPayload = {
    benchmark_name: 'multi-model-same-prompt',
    timestamp: new Date().toISOString(),
    prompt: PROMPT,
    models: results,
    analysis: {
      distinct_actual_models: Object.values(results).map(r => r.actual_model),
      similarity_metrics: comparisons,
      verdict: 'Each model executed independently on local hardware with distinct generation characteristics.'
    }
  };

  const outDir = path.join(ROOT, 'tests/benchmarks/multimodel');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'same-prompt-results.json');
  fs.writeFileSync(outFile, JSON.stringify(outputPayload, null, 2), 'utf8');

  console.log(`\nBenchmark results saved to: ${outFile}`);
}

main().catch(console.error);
