# 301 SUPER AI — AI Research Environment Specification

## 1. Directory Structure inside Fedora Native Filesystem (`~/301-ai-research/`)

```text
~/301-ai-research/
├── .venv/               # Isolated Python 3.11.16 virtual environment with PyTorch CUDA 12.4
├── models/              # Research model checkouts
├── datasets/            # Training/evaluation corpora
├── training/            # Fine-tuning runs, logs, checkpoints
├── quantization/        # Quantization working trees
├── llama.cpp/           # llama.cpp build and GGUF tools
├── mlc/                 # MLC LLM compilation workspace
├── executorch/          # ExecuTorch edge export workspace
├── benchmarks/          # Benchmark runs and reproducibility reports
├── experiments/         # Parameter tracking and run configs
├── scripts/             # Native Linux helper scripts
└── logs/                # Hardware and execution logs
```

## 2. Shared Artifact Directory (`E:\Smart Automation\100-AI-Agents\models\`)

```text
models/
├── research/            # Experimental model artifacts
├── fine-tuned/          # Merged and adapter models from QLoRA
├── quantized/           # GGUF Q8, Q6, Q5, Q4, Q3, Q2 variants
├── mobile/              # .pte, MLC, and edge packages
└── cache/               # Hugging Face & tokenizer cache (E: drive)
```

## 3. Environment Variables
* `HF_HOME="/mnt/e/Smart Automation/100-AI-Agents/models/cache/huggingface"`
* `TRANSFORMERS_CACHE="/mnt/e/Smart Automation/100-AI-Agents/models/cache/transformers"`
* `TORCH_HOME="/mnt/e/Smart Automation/100-AI-Agents/models/cache/torch"`
