/**
 * Sovereign AI Workbench — Role-Aware Model Benchmark Runner
 * HARDWARE-SAFE LOW-LOAD MODE: NVIDIA RTX 2050 4GB VRAM & 8GB System RAM
 * Measures performance strictly by specialized role with zero external network calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const BENCHMARK_CONFIG = {
  mode: process.env.BENCHMARK_MODE || 'development', // 'development' | 'full'
  max_output_tokens: Number(process.env.BENCHMARK_MAX_OUTPUT_TOKENS || 128),
  warmup_runs: Number(process.env.WARMUP_RUNS || 1),
  measured_runs: Number(process.env.MEASURED_RUNS || 2),
  cooldown_ms: Number(process.env.COOLDOWN_MS || 2000),
  max_concurrency: 1,
  gpu_vram_limit_mb: 4096,
  vram_critical_pct: 95
};

const OLLAMA_URL = 'http://127.0.0.1:11434';

function postOllamaGenerate(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const startTime = performance.now();
    let firstTokenTime = null;
    let tokenCount = 0;
    let fullText = '';

    const req = http.request(
      `${OLLAMA_URL}/api/generate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 180000
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Ollama returned HTTP ${res.statusCode}`));
          return;
        }

        res.setEncoding('utf8');
        let buffer = '';

        res.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.response) {
                if (!firstTokenTime) firstTokenTime = performance.now();
                fullText += parsed.response;
                tokenCount++;
              }

              if (parsed.done) {
                const totalLatency = Math.round(performance.now() - startTime);
                const ttft = firstTokenTime ? Math.round(firstTokenTime - startTime) : totalLatency;
                const evalCount = parsed.eval_count || tokenCount;
                const evalSec = (parsed.eval_duration || (totalLatency * 1e6)) / 1e9;
                const tps = evalSec > 0 ? Number((evalCount / evalSec).toFixed(2)) : 0;

                resolve({
                  text: fullText,
                  model: parsed.model || payload.model,
                  tokens: evalCount,
                  ttft_ms: ttft,
                  total_latency_ms: totalLatency,
                  tokens_per_sec: tps,
                  external_calls: 0
                });
              }
            } catch {
              // Partial line
            }
          }
        });

        res.on('end', () => {
          if (!fullText) resolve({ text: '', tokens: 0, ttft_ms: 0, total_latency_ms: 0, tokens_per_sec: 0, external_calls: 0 });
        });

        res.on('error', reject);
      }
    );

    req.on('timeout', () => req.destroy(new Error('Inference timeout')));
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const TASKS = {
  // 10 Multimodal & Vision Tasks (Gemma 3)
  gemma_vision: [
    { id: 'vis-01', name: 'Diagram Component Identification', prompt: 'In a process flow diagram, identify the purpose of a reflux drum connected downstream from a distillation column.' },
    { id: 'vis-02', name: 'P&ID Valve Type Extraction', prompt: 'List 3 standard P&ID symbol characteristics that distinguish a control valve from a manual ball valve.' },
    { id: 'vis-03', name: 'Scanned Inspection Table Reading', prompt: 'From an ultrasonic test table: TML-01=4.2mm, TML-02=3.8mm, TML-03=4.5mm (nominal=5.0mm). State which point shows highest metal loss.' },
    { id: 'vis-04', name: 'Corrosion Defect Classification', prompt: 'Classify localized pitting corrosion versus general galvanic thinning on a 316L stainless steel pipe section.' },
    { id: 'vis-05', name: 'Chart Trend Explanation', prompt: 'Explain the engineering significance when vibration FFT spectrum shows a prominent spike at 1X rotational frequency.' },
    { id: 'vis-06', name: 'Plant Equipment Visual Recognition', prompt: 'Describe the key visual differences between a shell-and-tube heat exchanger and a plate-and-frame exchanger.' },
    { id: 'vis-07', name: 'Instrument Loop Diagram Parsing', prompt: 'Given tag FT-101 wired to FIC-101 and FCV-101, trace the signal flow from primary element to final control element.' },
    { id: 'vis-08', name: 'Hazard Marking OCR Translation', prompt: 'Explain the meaning of NFPA 704 Diamond values: Health=3, Flammability=2, Instability=0.' },
    { id: 'vis-09', name: 'Piping Isometric Readout', prompt: 'Explain what an isometric spool drawing bill of materials indicates by "SCH 40 SMLS ASTM A106 Gr.B".' },
    { id: 'vis-10', name: 'Thermal Thermography Interpretation', prompt: 'How does an engineer interpret a 25°C temperature difference between phase conductors on a 415V MCC panel?' }
  ],

  // 10 Reasoning & Planning Tasks (Nemotron 3)
  nemotron_reasoning: [
    { id: 'rsn-01', name: 'Multi-Step Investigation Planning', prompt: 'Draft a 4-step DAG plan to investigate an unexpected centrifugal pump seal failure.' },
    { id: 'rsn-02', name: 'Evidence Conflict Resolution', prompt: 'Report A says corrosion rate is 0.12 mm/yr, Report B says 0.45 mm/yr on the same elbow. Formulate resolution steps.' },
    { id: 'rsn-03', name: 'Missing Information Identification', prompt: 'To calculate remaining service life of a pressure vessel, identify the 3 essential parameters missing if you only have current thickness.' },
    { id: 'rsn-04', name: 'Autonomous Task Decomposition', prompt: 'Decompose the goal "Prepare plant for annual turnaround" into 3 distinct engineering work packages.' },
    { id: 'rsn-05', name: 'Replanning on Tool Failure', prompt: 'If an ultrasonic NDT thickness gauge fails on site, propose two valid alternative non-destructive evaluation methods.' },
    { id: 'rsn-06', name: 'Safety Risk Assessment & Interlocks', prompt: 'Assess the risk if a high-pressure trip transmitter (PT-204) is bypassed during startup.' },
    { id: 'rsn-07', name: 'Epistemic Evidence Synthesis', prompt: 'Synthesize evidence: Oil analysis shows high Fe particles, acoustic emission detects 4kHz pulses, motor amps normal. What is the root failure mechanism?' },
    { id: 'rsn-08', name: 'Multi-Agent Workforce Delegation', prompt: 'Which 3 specialist agents should be dispatched to handle a boiler tube leak: Inspection, Chemical, or Electrical?' },
    { id: 'rsn-09', name: 'Root Cause Hierarchy Mapping', prompt: 'Differentiate the immediate physical cause, human factor, and latent management system cause of a pipe overpressure event.' },
    { id: 'rsn-10', name: 'Final Remediation Recommendation', prompt: 'Recommend a prioritized action plan for a heat exchanger with 14 months remaining life before minimum allowable thickness is breached.' }
  ],

  // 10 Coding & Computation Tasks (Qwen 2.5 Coder)
  qwen_coding: [
    { id: 'cod-01', name: 'Remaining Life Formula Calculation', prompt: 'Write a Python function to calculate remaining life: (current_thickness - t_min) / corrosion_rate.' },
    { id: 'cod-02', name: 'Corrosion CSV Parser', prompt: 'Write a concise Python script using csv module to filter rows where metal_loss_pct > 20.0.' },
    { id: 'cod-03', name: 'Bug Fix in Unit Converter', prompt: 'Fix this bug: def bar_to_psi(bar): return bar * 1.45038 (Hint: 1 bar = 14.5038 psi).' },
    { id: 'cod-04', name: 'SQL Schema for Inspection Logs', prompt: 'Write a PostgreSQL CREATE TABLE statement for equipment_inspections with foreign key to equipment_id.' },
    { id: 'cod-05', name: 'JSON Schema Validator Helper', prompt: 'Write a JavaScript function that verifies an object has required keys: ["agent_id", "task", "status"].' },
    { id: 'cod-06', name: 'Regex for Equipment Tag Extraction', prompt: 'Write a regular expression to match tags like HX-204, P-101A, and TK-9002.' },
    { id: 'cod-07', name: 'Pump Affinity Law Calculator', prompt: 'Write a Python function to calculate new flow Q2 given Q1, N1, N2 using pump affinity laws: Q2 = Q1 * (N2 / N1).' },
    { id: 'cod-08', name: 'Safe REST Client with Retry', prompt: 'Write a Node.js fetch wrapper function that retries up to 3 times on HTTP 503.' },
    { id: 'cod-09', name: 'Moving Average Smoothing for Sensor Data', prompt: 'Write a Python function that computes a 3-point simple moving average over an array of floats.' },
    { id: 'cod-10', name: 'Binary Search for Threshold Index', prompt: 'Write a Python binary search function to find the first index in a sorted array exceeding a threshold.' }
  ],

  // 10 Generic Utility Tasks
  generic_utility: [
    { id: 'gen-01', name: 'Industrial Domain Classification', prompt: 'Classify this task into Mechanical, Electrical, or Safety: "Inspect breaker contact resistance on 11kV switchgear."' },
    { id: 'gen-02', name: 'One-Sentence Executive Summary', prompt: 'Summarize in 1 sentence: Heat exchanger HX-204 inspected, thinning detected in tube bundle B, 14 months remaining life.' },
    { id: 'gen-03', name: 'Structured JSON Key Extraction', prompt: 'Convert to JSON: Equipment Pump-101, Location Unit-2, Status Operational, Vibration 2.4 mm/s.' },
    { id: 'gen-04', name: 'Hazard Priority Level Tagging', prompt: 'Tag with CRITICAL, HIGH, or LOW: "Steam leak near high-traffic personnel walkway."' },
    { id: 'gen-05', name: 'Unit Normalization', prompt: 'Convert 150 psig to bar gauge (round to 2 decimals).' },
    { id: 'gen-06', name: 'Keyword Extractor', prompt: 'Extract the 4 most important technical keywords from: "Ultrasonic thickness measurement of crude distillation overhead condenser shell."' },
    { id: 'gen-07', name: 'Action Verb Replacer', prompt: 'Rewrite using an active engineering verb: "We did a check on the relief valve calibration."' },
    { id: 'gen-08', name: 'Entity Disambiguation', prompt: 'Disambiguate: In oil refinery context, does "FCC" stand for Fluid Catalytic Cracking or Federal Communications Commission?' },
    { id: 'gen-09', name: 'Boolean Compliance Check', prompt: 'Answer True or False: Relief valves must have locked-open isolation valves upstream unless interlocked.' },
    { id: 'gen-10', name: 'Brief Alert Formatter', prompt: 'Format a 1-line industrial alert banner for: High level detected in tank TK-402.' }
  ]
};

async function executeBenchmarkSuite() {
  console.log('============================================================');
  console.log('101 SUPER AI AGENTS — ROLE-AWARE BENCHMARK SUITE');
  console.log('============================================================');
  console.log(`Mode: ${BENCHMARK_CONFIG.mode.toUpperCase()} (Hardware-Safe RTX 2050 4GB)`);
  console.log(`Max Output Tokens: ${BENCHMARK_CONFIG.max_output_tokens}`);
  console.log(`Warmup Runs: ${BENCHMARK_CONFIG.warmup_runs}, Measured Runs: ${BENCHMARK_CONFIG.measured_runs}`);
  console.log(`Concurrency: ${BENCHMARK_CONFIG.max_concurrency} (Sequential Only)`);
  console.log('============================================================\n');

  const results = {
    benchmark_version: '2.0.0-role-aware',
    timestamp: new Date().toISOString(),
    hardware: {
      gpu: 'NVIDIA GeForce RTX 2050',
      vram_mb: 4096,
      system_ram_mb: 8192,
      platform: 'Local Sovereign Air-Gapped',
      external_calls: 0
    },
    config: BENCHMARK_CONFIG,
    models: {}
  };

  const modelsToTest = [
    { key: 'qwen', tag: 'qwen2.5-coder:1.5b', displayName: 'Qwen 2.5 Coder (1.5B)', taskSet: TASKS.qwen_coding, role: 'Coding & Technical Computation' },
    { key: 'nemotron', tag: 'nemotron-3-nano:latest', displayName: 'NVIDIA Nemotron 3 Nano (4B)', taskSet: TASKS.nemotron_reasoning, role: 'Reasoning & Planning' },
    { key: 'gemma', tag: 'gemma3:4b', displayName: 'Google Gemma 3 (4B)', taskSet: TASKS.gemma_vision, role: 'Vision & Multimodal Understanding' }
  ];

  for (const modelDef of modelsToTest) {
    console.log(`\n▶ Benchmarking [${modelDef.displayName}] — Role: ${modelDef.role}`);
    
    // 1. Warmup
    console.log(`  [Warmup] Executing 1 minimal warmup generation...`);
    try {
      await postOllamaGenerate({
        model: modelDef.tag,
        prompt: 'Say READY',
        stream: false,
        options: { num_predict: 8 }
      });
    } catch (e) {
      console.warn(`  [Warmup warning] ${e.message}`);
    }

    await new Promise(r => setTimeout(r, BENCHMARK_CONFIG.cooldown_ms));

    const taskResults = [];
    const latencies = [];
    const ttfts = [];
    const tpsList = [];

    // Run representative tasks (first 4 in development mode, all 10 in full mode)
    const activeTasks = BENCHMARK_CONFIG.mode === 'development' ? modelDef.taskSet.slice(0, 4) : modelDef.taskSet;

    for (let i = 0; i < activeTasks.length; i++) {
      const task = activeTasks[i];
      process.stdout.write(`  [${i + 1}/${activeTasks.length}] Task: ${task.name}... `);

      const runs = [];
      for (let r = 0; r < BENCHMARK_CONFIG.measured_runs; r++) {
        try {
          const runRes = await postOllamaGenerate({
            model: modelDef.tag,
            prompt: task.prompt,
            stream: true,
            options: {
              temperature: 0.2,
              num_predict: BENCHMARK_CONFIG.max_output_tokens
            }
          });
          runs.push(runRes);
          latencies.push(runRes.total_latency_ms);
          ttfts.push(runRes.ttft_ms);
          tpsList.push(runRes.tokens_per_sec);
        } catch (err) {
          console.error(`Error on run ${r + 1}: ${err.message}`);
        }
        await new Promise(res => setTimeout(res, 800));
      }

      if (runs.length > 0) {
        const avgLat = Math.round(runs.reduce((a, b) => a + b.total_latency_ms, 0) / runs.length);
        const avgTps = Number((runs.reduce((a, b) => a + b.tokens_per_sec, 0) / runs.length).toFixed(1));
        console.log(`✓ ${avgLat}ms (${avgTps} t/s)`);
        taskResults.push({
          task_id: task.id,
          task_name: task.name,
          avg_latency_ms: avgLat,
          avg_tokens_per_sec: avgTps,
          sample_output: runs[0].text.slice(0, 100) + '...'
        });
      }
      await new Promise(res => setTimeout(res, BENCHMARK_CONFIG.cooldown_ms));
    }

    // Compute aggregate statistics
    latencies.sort((a, b) => a - b);
    const median = latencies[Math.floor(latencies.length / 2)] || 0;
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1));
    const min = latencies[0] || 0;
    const max = latencies[latencies.length - 1] || 0;
    const avgTtft = Math.round(ttfts.reduce((a, b) => a + b, 0) / (ttfts.length || 1));
    const avgTps = Number((tpsList.reduce((a, b) => a + b, 0) / (tpsList.length || 1)).toFixed(2));

    results.models[modelDef.key] = {
      model_name: modelDef.displayName,
      tag: modelDef.tag,
      primary_role: modelDef.role,
      metrics: {
        avg_latency_ms: avg,
        median_latency_ms: median,
        min_latency_ms: min,
        max_latency_ms: max,
        avg_ttft_ms: avgTtft,
        avg_tokens_per_sec: avgTps,
        tasks_tested: taskResults.length
      },
      task_details: taskResults
    };
  }

  // Model Switching Test (Sequential Gemma -> Nemotron -> Qwen -> Gemma)
  console.log('\n▶ Measuring Model Transition / Switch Latencies...');
  const switches = [
    { from: 'gemma3:4b', to: 'nemotron-3-nano:latest', name: 'Gemma 3 -> Nemotron 3' },
    { from: 'nemotron-3-nano:latest', to: 'qwen2.5-coder:1.5b', name: 'Nemotron 3 -> Qwen Coder' },
    { from: 'qwen2.5-coder:1.5b', to: 'gemma3:4b', name: 'Qwen Coder -> Gemma 3' }
  ];

  const switchResults = [];
  for (const sw of switches) {
    process.stdout.write(`  [Switch] ${sw.name}... `);
    const t0 = performance.now();
    try {
      const swRes = await postOllamaGenerate({
        model: sw.to,
        prompt: 'Say OK',
        stream: false,
        options: { num_predict: 4 }
      });
      const duration = Math.round(performance.now() - t0);
      console.log(`✓ ${duration}ms (TTFT: ${swRes.ttft_ms}ms)`);
      switchResults.push({
        transition: sw.name,
        switch_latency_ms: duration,
        target_model: sw.to
      });
    } catch (swErr) {
      console.warn(`Failed: ${swErr.message}`);
    }
    await new Promise(r => setTimeout(r, BENCHMARK_CONFIG.cooldown_ms));
  }
  results.model_transitions = switchResults;

  // Save results to file
  const outDir = path.join(ROOT, 'tests', 'benchmarks', 'role-aware');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'benchmark-results.json');
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), 'utf8');

  console.log('\n============================================================');
  console.log(`✓ Benchmark Results successfully written to:`);
  console.log(`  ${outFile}`);
  console.log('============================================================\n');
}

executeBenchmarkSuite().catch(err => {
  console.error('Fatal benchmark execution error:', err);
  process.exit(1);
});
