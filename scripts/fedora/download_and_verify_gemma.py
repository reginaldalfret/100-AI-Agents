#!/usr/bin/env python3
"""
301 SUPER AI — Gemma 3 1B Checkpoint Downloader & Integrity Verifier
Safe credential-hardened version:
- Relies strictly on Hugging Face local session (hf auth login)
- Rejects and forbids passing tokens via command-line arguments
- Zero token printing or logging
"""
import os
import sys
import json
import time
from pathlib import Path

HF_CACHE_DIR = "/mnt/e/Smart Automation/100-AI-Agents/models/cache/huggingface"
os.environ["HF_HOME"] = HF_CACHE_DIR
os.environ["TRANSFORMERS_CACHE"] = HF_CACHE_DIR

REPO_ID = "google/gemma-3-1b-it"

def main():
    # Strict validation: Do NOT accept token from command line arguments
    if len(sys.argv) > 1:
        print("[SECURITY ERROR] Passing credentials or tokens via command-line arguments is strictly prohibited.")
        print("Please authenticate using local session ('hf auth login') inside the environment.")
        sys.exit(1)

    print("============================================================")
    print("301 SUPER AI — GEMMA 3 1B SAFE DOWNLOAD & VERIFICATION")
    print(f"Target Repository: {REPO_ID}")
    print(f"Local Destination: {HF_CACHE_DIR}")
    print("============================================================")

    import huggingface_hub
    
    # Check local session authentication
    token = huggingface_hub.get_token()
    if not token:
        print("[AUTH ERROR] No active Hugging Face session detected.")
        print("Please run 'hf auth login' in the Fedora WSL environment to authenticate securely.")
        sys.exit(1)

    print("AUTHENTICATED = TRUE")

    # Verify access to repository
    try:
        api = huggingface_hub.HfApi()
        model_info = api.model_info(REPO_ID)
        print("GEMMA_ACCESS = GRANTED")
        print(f"Model ID: {model_info.id} | Gated: {getattr(model_info, 'gated', 'unknown')}")
    except Exception as e:
        print("GEMMA_ACCESS = DENIED")
        print(f"[ERROR] Access verification failed: {e}")
        sys.exit(1)

    print("\n--- Initiating/Resuming Snapshot Download ---")
    start_time = time.time()
    try:
        download_path = huggingface_hub.snapshot_download(
            repo_id=REPO_ID,
            cache_dir=HF_CACHE_DIR,
            local_files_only=False
        )
        duration = time.time() - start_time
        print(f"\n[SUCCESS] Checkpoint snapshot verified/downloaded in {duration:.1f}s")
        print(f"Snapshot directory: {download_path}")
    except Exception as e:
        print(f"\n[ERROR] Failed during snapshot download: {e}")
        sys.exit(1)

    # Verify expected files
    print("\n--- Auditing Downloaded Files ---")
    expected_files = [
        "config.json",
        "model.safetensors",
        "tokenizer.json",
        "tokenizer.model",
        "tokenizer_config.json",
        "generation_config.json",
        "special_tokens_map.json"
    ]

    missing = []
    file_stats = {}
    total_bytes = 0

    p = Path(download_path)
    for fname in expected_files:
        fpath = p / fname
        if fpath.exists():
            sz = fpath.stat().st_size
            total_bytes += sz
            file_stats[fname] = {
                "exists": True,
                "size_mb": round(sz / (1024**2), 2),
                "is_symlink": fpath.is_symlink()
            }
            print(f"  ✓ {fname} ({round(sz / (1024**2), 2)} MB)")
        else:
            missing.append(fname)
            print(f"  ✗ {fname} (MISSING)")

    if missing:
        print(f"[ERROR] Missing required files: {missing}")
        sys.exit(1)

    print(f"Total Model Checkpoint Size: {round(total_bytes / (1024**3), 2)} GB")

    # Read config.json
    config_file = p / "config.json"
    with open(config_file, "r") as f:
        config_data = json.load(f)

    print("\n--- Model Architecture & Metadata ---")
    print(f"  Architectures: {config_data.get('architectures')}")
    print(f"  Model Type: {config_data.get('model_type')}")
    print(f"  Hidden Size: {config_data.get('hidden_size')}")
    print(f"  Num Hidden Layers: {config_data.get('num_hidden_layers')}")
    print(f"  Num Attention Heads: {config_data.get('num_attention_heads')}")
    print(f"  Num Key Value Heads: {config_data.get('num_key_value_heads')}")
    print(f"  License: Google Gemma Terms of Use (gemma)")

    # Test loading with Transformers
    print("\n--- Verifying Transformers & Chat Template Compatibility ---")
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

    print(f"PyTorch version: {torch.__version__} | CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    tokenizer = AutoTokenizer.from_pretrained(download_path)
    print(f"  Tokenizer vocabulary size: {len(tokenizer)}")
    print(f"  BOS token: {tokenizer.bos_token} (id: {tokenizer.bos_token_id})")
    print(f"  EOS token: {tokenizer.eos_token} (id: {tokenizer.eos_token_id})")
    print(f"  Pad token: {tokenizer.pad_token} (id: {tokenizer.pad_token_id})")

    test_chat = [
        {"role": "user", "content": "Hi, how are you?"}
    ]
    formatted = tokenizer.apply_chat_template(test_chat, tokenize=False, add_generation_prompt=True)
    print("  Applied chat template format:")
    print("  " + repr(formatted))

    # Test 4-bit load to check GPU VRAM fit
    print("\n--- Test Loading in 4-bit NF4 onto RTX 2050 ---")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
        bnb_4bit_use_double_quant=True
    )

    load_start = time.time()
    model = AutoModelForCausalLM.from_pretrained(
        download_path,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.bfloat16
    )
    load_duration = time.time() - load_start
    allocated_vram = torch.cuda.memory_allocated(0) / (1024**2)
    reserved_vram = torch.cuda.memory_reserved(0) / (1024**2)

    print(f"  Model loaded in {load_duration:.1f}s")
    print(f"  VRAM Allocated: {allocated_vram:.1f} MiB")
    print(f"  VRAM Reserved: {reserved_vram:.1f} MiB")

    # Run single forward pass / generation test
    print("\n--- Base Model Single Generation Test ---")
    inputs = tokenizer(formatted, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=25,
            do_sample=False,
            pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id
        )
    gen_text = tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
    print(f"  Prompt: 'Hi, how are you?'")
    print(f"  Response: '{gen_text.strip()}'")

    # Checkpoint integrity report (Contains zero secrets)
    out_report = {
        "status": "VERIFIED",
        "repo_id": REPO_ID,
        "download_path": download_path,
        "total_size_gb": round(total_bytes / (1024**3), 2),
        "file_stats": file_stats,
        "config": config_data,
        "license": "Google Gemma Terms of Use (gemma)",
        "vram_allocated_mb": round(allocated_vram, 1),
        "test_generation": gen_text.strip(),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

    report_path = Path("/mnt/e/Smart Automation/100-AI-Agents/models/fine-tuned/personal-style/gemma-kaviya-style-v1/metadata/checkpoint-verification.json")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(out_report, f, indent=2)

    print(f"\nVerification report written to: {report_path}")
    print("============================================================")
    print("CHECKPOINT VERIFICATION PASSED — READY FOR QLORA TRAINING")
    print("============================================================")

if __name__ == "__main__":
    main()
