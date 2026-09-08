/**
 * Sovereign AI Workbench — Obsidian Demo Knowledge Generator
 * Populates starter demonstration notes with wikilinks, tags, and frontmatter
 * if and only if the vault is currently empty.
 *
 * 100% On-Premise, Air-Gapped, E: Drive Policy.
 */

import fs from 'node:fs';
import path from 'node:path';
import { obsidianConfig } from './obsidian-config.js';

export const DEMO_NOTES = [
  {
    relativePath: '01-Architecture/301 Architecture.md',
    content: `---
title: 301 Super AI Architecture
domain: engineering
status: VERIFIED
tags:
  - architecture
  - orchestrator
  - airgapped
---

# 301 Super AI Architecture

The **301 Super AI** platform operates a multi-tiered sovereign local AI orchestrator.

## Core Pillars
1. **Zero External Egress**: 100% air-gapped local execution with 0 external network calls.
2. **Hardware Constraints**: Single GPU mutex lock on [[NVIDIA GeForce RTX 2050]] with 4GB VRAM. Parallel lock-free CPU execution on Intel Core i5-11400H.
3. **Knowledge Layer**: Integrated with [[Obsidian Knowledge Bridge]] and local vector store.
4. **Local Runtime**: Powered by local [[Ollama]] daemon on port 11434 with zero cloud dependencies.

## Related Systems
- See [[Quantization]] for 4-bit and 8-bit quantization standards.
- Refer to [[QLoRA]] for domain-specific fine-tuning protocols.
`
  },
  {
    relativePath: '02-Models/Ollama.md',
    content: `---
title: Local Ollama Management
domain: infrastructure
status: VERIFIED
tags:
  - ollama
  - models
  - local
---

# Local Ollama Management

The local Ollama server serves all 12 on-premise foundation and specialist models.

## Service Configuration
- Endpoint: \`http://127.0.0.1:11434\`
- Models Path: \`E:\\Smart Automation\\100-AI-Agents\\models\\ollama\`
- GPU VRAM Guard: Handles single-model execution on RTX 2050 (4GB).
- Process Port: Protected against \`EADDRINUSE\` race conditions during supervisor auto-healing.

## Key Local Models
- **nemotron-3-nano:latest**: 2.8GB VRAM reasoning orchestrator.
- **qwen2.5-coder:1.5b**: 986MB coding specialist with Q4_K_M quantization.
- **llama3.2:1b**: Fast 1.3GB general conversational model.
- **LiquidAI/lfm2.5-350m**: Ultra-fast zero-VRAM CPU model.

See also [[Quantization]] and [[301 Architecture]].
`
  },
  {
    relativePath: '04-Fine-Tuning/QLoRA.md',
    content: `---
title: QLoRA Fine-Tuning Protocols
domain: ml-engineering
status: VERIFIED
tags:
  - qlora
  - finetuning
  - rtx2050
---

# QLoRA Fine-Tuning Protocols

**QLoRA** (Quantized Low-Rank Adaptation) reduces memory requirements by combining 4-bit NormalFloat (NF4) quantization with double quantization and paged optimizers.

## GPU VRAM Efficiency
On an **NVIDIA GeForce RTX 2050 (4GB VRAM)**, standard 16-bit LoRA exceeds memory limits for models over 1B parameters. QLoRA enables training adapters on:
- \`qwen2.5-coder:1.5b\`
- \`gemma3:1b\`
- \`llama3.2:1b\`

## Hyperparameter Standards
- **LoRA Rank (r)**: 8 or 16
- **Alpha**: 32
- **Target Modules**: \`q_proj, v_proj, k_proj, o_proj\`
- **Quantization**: NF4 with double quantization enabled.

Related notes: [[Quantization]], [[Mobile LLM Research]], and [[Cybersecurity]].
`
  },
  {
    relativePath: '06-Mobile-LLM/Mobile LLM Research.md',
    content: `---
title: Mobile & Edge LLM Research
domain: mobile-computing
status: RESEARCH
tags:
  - mobile
  - edge
  - quantization
---

# Mobile & Edge LLM Research

Deploying language models on mobile and edge devices requires extreme parameter efficiency and sub-4-bit weights.

## Edge Deployment Architectures
1. **Liquid Neural Networks**: \`LiquidAI/lfm2.5-350m\` provides continuous-time adaptive inference with minimal memory footprint.
2. **RWKV Recurrent Architecture**: \`mollysama/rwkv-7-g1d:0.4b\` achieves constant-memory sequential inference without KV cache ballooning.
3. **Hardware Accelerators**: ARM NEON and Apple Metal support.

Refer to [[Quantization]] for GGUF formats and [[QLoRA]] for parameter-efficient adaptation.
`
  },
  {
    relativePath: '07-Quantization/Quantization.md',
    content: `---
title: Quantization Formats & Benchmarks
domain: optimization
status: VERIFIED
tags:
  - quantization
  - gguf
  - q4_k_m
---

# Quantization Formats & Benchmarks

Quantization converts 16-bit floating-point weights (FP16) to lower bit representations to maximize throughput and minimize VRAM.

## GGUF Quantization Types
- **Q4_K_M**: 4-bit medium k-quant. Optimal balance of perplexity retention and memory footprint. Used across all GPU models in 301 Super AI.
- **Q8_0**: 8-bit standard quantization for high-precision CPU models.
- **FP16**: Full precision baseline (requires ~2GB VRAM per 1B parameters).

## RTX 2050 Benchmarks
- \`nemotron-3-nano:latest\` (Q4_K_M): 34.2 tokens/sec, 735ms TTFT.
- \`qwen2.5-coder:1.5b\` (Q4_K_M): 58.2 tokens/sec, 160ms TTFT.
- \`llama3.2:1b\` (Q4_K_M): 62.5 tokens/sec, 135ms TTFT.

See [[Ollama]], [[301 Architecture]], and [[QLoRA]].
`
  },
  {
    relativePath: '12-Cybersecurity/Cybersecurity.md',
    content: `---
title: Sovereign Cybersecurity Intelligence
domain: cybersecurity
status: VERIFIED
tags:
  - cybersecurity
  - security
  - airgapped
---

# Sovereign Cybersecurity Intelligence

Our industrial cybersecurity protocols enforce automated threat hunting and zero-trust verification on local networks.

## Threat Analysis Model
- Specialist model: \`qwen3-1.7b-cyber\`
- Specialization: Vulnerability assessment, CVE correlation, firewall log audits, and air-gap verification.
- Zero-Egress Guard: \`NetworkPolicyService\` blocks all outbound cloud calls to protect refinery infrastructure.

Related notes: [[301 Architecture]] and [[QLoRA]].
`
  },
  {
    relativePath: '13-Healthcare/Healthcare.md',
    content: `---
title: Healthcare Clinical Intelligence
domain: healthcare
status: VERIFIED
tags:
  - healthcare
  - medgemma
  - clinical
---

# Healthcare Clinical Intelligence

Clinical note analysis and medical research synthesis operating under strict HIPAA-compliant air-gapped isolation.

## Specialist Model
- Specialist: \`medgemma:4b\` (quantized 4-bit adapter)
- Domain: Clinical observation extraction, lab result interpretation, and pharmaceutical contraindication cross-referencing.
- Offline Guarantee: No patient records or clinical summaries ever leave the local machine.

See also [[301 Architecture]] and [[Quantization]].
`
  }
];

export async function initDemoVaultIfEmpty(config = obsidianConfig) {
  config.ensureDirectories();
  const vaultPath = path.resolve(config.vaultPath);

  // Check if vault already contains any .md files
  let hasExistingNotes = false;
  try {
    const checkDir = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          checkDir(path.join(dir, item.name));
        } else if (item.isFile() && item.name.toLowerCase().endsWith('.md')) {
          hasExistingNotes = true;
          return;
        }
      }
    };
    checkDir(vaultPath);
  } catch {}

  if (hasExistingNotes) {
    return { created: false, message: 'Vault already contains user notes. Skipped demo creation.' };
  }

  // Create demo notes
  let createdCount = 0;
  for (const note of DEMO_NOTES) {
    const targetPath = path.join(vaultPath, note.relativePath);
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, note.content, 'utf8');
    createdCount++;
  }

  return { created: true, count: createdCount, message: `Created ${createdCount} demo knowledge notes in ${vaultPath}` };
}
