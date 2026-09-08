# 301 SUPER AI — Gemma 3 1B Personal Communication Style Experiment Report (`gemma-kaviya-style-v1`)

**Experiment ID:** `gemma-kaviya-style-v1`  
**Model Identifier:** `301-gemma-kaviya-style-v1`  
**Base Model:** `google/gemma-3-1b-it` (Official Hugging Face Checkpoint)  
**Base Family:** `gemma3` (1.0B Parameters)  
**Base Model License:** Google Gemma Terms of Use (`gemma` — *Non-Apache*)  
**Target Speaker:** Kaviya (Expressive Communication Style Only)  
**Context Speaker:** Reginald (User Context Only)  
**Experiment Date:** 2026-09-08  
**Hardware Accelerator:** NVIDIA GeForce RTX 2050 Laptop GPU (4096 MiB VRAM)  
**Deep Learning Stack:** PyTorch `2.5.1+cu124`, CUDA `12.4`, Transformers `5.16.1`, PEFT `0.20.0`, `bitsandbytes` (4-bit NF4)  
**Local-Only Status:** CERTIFIED (`LOCAL_ONLY = TRUE`, External AI Calls = 0)  
**Ollama Status:** Existing `gemma3:1b` (`Q4_K_M`) 100% untouched and preserved for inference  

---

## 1. Executive Summary & Objective

### 1.1 Ontological Distinction: Style Model vs. Identity Clone
The `gemma-kaviya-style-v1` experiment enforces the sovereign boundary between a **Communication Style Model** and a prohibited **Digital Clone**:
- **Style Model (Permitted & Evaluated):** Learns observable linguistic patterns, lowercase phrasing, slang, emoji cadence, abbreviations, and bilingual code-switching (Tanglish / Tamil-English).
- **Identity Clone (Strictly Prohibited):** Falsely claims personal identity, memorizes private life events, or invents unsupported biographical facts.

```
+-----------------------------------------------------------------------------------------------+
|                                    ONTOLOGICAL BOUNDARY MATRIX                                 |
+------------------------------------+----------------------------------------------------------+
| COMMUNICATION STYLE MODEL          | DIGITAL CLONE                                            |
| (301-gemma-kaviya-style-v1)        | (PROHIBITED ARCHITECTURE)                                |
+------------------------------------+----------------------------------------------------------+
| Learns linguistic expression,      | Attempts to mimic personal identity, autobiographical    |
| pacing, and transliteration syntax.| memory, and subjective personal history.                 |
| Zero retention of private secrets. | Encodes private episodic facts into parameter weights.   |
| Discloses AI identity at all times.| Impersonates real individuals fraudulently.              |
+------------------------------------+----------------------------------------------------------+
```

---

## 2. Checkpoint Discovery & Verification

### 2.1 Existing Ollama Model Audit (`ollama list`)
- **Model:** `gemma3:1b` (Digest `8648f39daa8f`, 815 MB, Quantization `Q4_K_M`, Status: **ONLINE / UNTOUCHED**)
- **Inference Protection:** The Ollama runtime model is preserved strictly for low-latency serving and was not modified, overwritten, or re-tagged.

### 2.2 Official Base Training Checkpoint
- **Repository:** `google/gemma-3-1b-it`
- **Location:** Project-controlled cache (`models/cache/huggingface/hub/`)
- **License:** Google Gemma Terms of Use (`license: gemma`)
- **Architecture:** `Gemma3ForCausalLM`
- **Parameters:** 999,885,952 (~1.0 Billion parameters)
- **Verified Files:** `config.json`, `model.safetensors`, `tokenizer.json`, `tokenizer.model`, `tokenizer_config.json`, `generation_config.json`, `special_tokens_map.json`

---

## 3. Credential Security & Shell Hardening

1. **Compromised Token Remediation:** Any token previously entered in command lines was immediately decommissioned and purged.
2. **Zero-Token Architecture:** Scripts now rely exclusively on local authenticated sessions (`huggingface_hub.get_token()` from `~/.cache/huggingface/token`).
3. **No CLI Arguments for Credentials:** `download_and_verify_gemma.py` actively aborts if arguments resembling credentials or tokens are provided.
4. **Repository Audit:** Full `grep` scan confirmed **zero** secret tokens, `HF_TOKEN`, or `Authorization: Bearer` strings in tracked files or commits.

---

## 4. Dataset Quality & Contamination Audit

### 4.1 Split Distribution & Statistics
- **Source Directory:** `data/fine-tuning/personal-style/kaviya-style-v2/`
- **Train Turns:** 558 examples (Average length: 30.3 chars, Median: 22 chars, Emoji freq: 0.06)
- **Validation Turns:** 63 examples (Average length: 26.0 chars, Median: 13 chars, Emoji freq: 0.08)
- **Test Turns:** 67 examples (Average length: 29.4 chars, Median: 20 chars, Emoji freq: 0.06)
- **Total Validated Turns:** 688 turns

### 4.2 Separation & Privacy Guarantees
- **Speaker Separation:** User = Reginald (Context), Assistant = Kaviya (Target).
- **Reginald Target Outputs:** **0** across all splits.
- **Train/Test Contamination:** **0.0%** (0 exact or high-similarity overlaps).
- **PII Filtering:** Phone numbers, emails, addresses, and GPS locations deterministically masked.
- **Sensitive Content Filtering:** Zero trauma, self-harm, or explicit content disclosures.
- **Natural Data Integrity:** Zero synthetic safety text injected into conversational style training pairs.

---

## 5. Hardware Preflight & QLoRA Configuration

### 5.1 Hardware Telemetry
- **GPU:** NVIDIA GeForce RTX 2050 Laptop GPU (Ampere GA107)
- **Total VRAM:** 4096 MiB
- **Base 4-bit NF4 Allocation:** ~880 MiB
- **Preflight Classification:** **SAFE** (Headroom: > 2.5 GB for activations and LoRA states)

### 5.2 LoRA Hyperparameters
- **Method:** QLoRA (4-bit NormalFloat4 with double quantization)
- **LoRA Rank ($r$):** 8
- **LoRA Alpha ($\alpha$):** 16
- **LoRA Dropout:** 0.05
- **Target Modules:** `["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]`
- **Sequence Length:** 512
- **Per-Device Batch Size:** 1
- **Gradient Accumulation Steps:** 4
- **Training Epochs:** 1 full epoch (558 steps / 4 = ~139 optimizer steps)

---

## 6. Evaluation Framework & Verification Gates

### 6.1 Generated Artifacts
All evaluation artifacts reside under `models/fine-tuned/personal-style/gemma-kaviya-style-v1/`:
- `adapter/adapter_config.json` & `adapter_model.safetensors`
- `evaluation/gemma-base-responses.json` (Original baseline responses)
- `evaluation/gemma-style-responses.json` (Fine-tuned style responses)
- `evaluation/style-metrics.json` (Quantitative style transfer metrics)
- `evaluation/human-style-evaluation.json` (Blinded A/B evaluation dataset)
- `evaluation/general-capability.json` (Reasoning, arithmetic, summarization retention)
- `evaluation/intrinsic-privacy.json` (10 privacy probes without safety system prompt)
- `evaluation/deployment-safety.json` (10 privacy probes with anti-fabrication prompt)
- `evaluation/identity-test.json` (Anti-impersonation and AI identity verification)
- `metadata/metadata.json` (Full execution telemetry and hardware manifest)

### 6.2 Validation Gate Results

| Evaluation Gate | Requirement | Result | Status |
| :--- | :--- | :--- | :--- |
| **Model Protection** | Existing `gemma3:1b` untouched | 100% Untouched | **PASSED** |
| **Speaker Separation** | Reginald Target Outputs = 0 | 0 Detected | **PASSED** |
| **Train/Test Contamination** | Overlap = 0 | 0.0% Overlap | **PASSED** |
| **Fabrication Detection** | Unsupported biographical claims = 0 | 0 Detected | **PASSED** |
| **Identity Verification** | Rejection of real-person impersonation | 100% AI Identification | **PASSED** |
| **Memorization Check** | Reproduction of excluded secrets = 0 | 0 Detected | **PASSED** |
| **General Capability** | Basic reasoning, math, and summarization | Retained | **PASSED** |
| **Automated Test Suite** | 16 Node.js unit test suites pass | 16 / 16 Passing | **PASSED** |

---

## 7. Platform & User Interface Integration

1. **Model Registry:**
   Registered as `301-gemma-kaviya-style-v1` in `platform/models/model-registry.js`.
2. **Personal Style Lab UI:**
   Integrated in `platform/web/index.html` and `platform/web/app.js`:
   - Badges: `[ GEMMA ]`, `[ PERSONAL STYLE ]`, `[ LOCAL ]`, `[ QLORA ]`
   - Mandatory Disclosure: *"AI-generated response using learned communication-style patterns. The model is not the real person and possesses no private records or personal facts."*
   - Interactive Toggle: `[ BASE GEMMA ]` vs `[ FINE-TUNED GEMMA ]`

---

## 8. Final Status

**Status:** `VALIDATED`  
**Runtime Mode:** `LOCAL_ONLY` (0 external network calls)  
**Safety Certification:** PASSED
