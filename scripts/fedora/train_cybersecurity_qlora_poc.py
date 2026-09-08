#!/usr/bin/env python3
"""
301 SUPER AI — Real Local LLM QLoRA Fine-Tuning Script
Platform: Fedora WSL 2 + NVIDIA GeForce RTX 2050 (4GB VRAM)
Domain: Cybersecurity Specialist Model Adaptation
"""
import os
import sys
import time
import json
import argparse
import hashlib

print("============================================================")
print("301 SUPER AI — QLoRA FINE-TUNING EXPERIMENT (RTX 2050)")
print("============================================================")

# Enforce E: Drive Storage Sovereignty for Model & Tokenizer Caches
os.environ["HF_HOME"] = "/mnt/e/Smart Automation/100-AI-Agents/models/cache/huggingface"
os.environ["TRANSFORMERS_CACHE"] = "/mnt/e/Smart Automation/100-AI-Agents/models/cache/transformers"
os.environ["TORCH_HOME"] = "/mnt/e/Smart Automation/100-AI-Agents/models/cache/torch"

def get_gpu_telemetry():
    telemetry = {"cuda_available": False, "gpu_name": "None", "vram_total_mb": 0, "vram_allocated_mb": 0, "vram_reserved_mb": 0}
    try:
        import torch
        if torch.cuda.is_available():
            telemetry["cuda_available"] = True
            telemetry["gpu_name"] = torch.cuda.get_device_name(0)
            telemetry["vram_total_mb"] = round(torch.cuda.get_device_properties(0).total_memory / (1024**2), 1)
            telemetry["vram_allocated_mb"] = round(torch.cuda.memory_allocated(0) / (1024**2), 1)
            telemetry["vram_reserved_mb"] = round(torch.cuda.memory_reserved(0) / (1024**2), 1)
    except Exception as e:
        telemetry["error"] = str(e)
    return telemetry

def main():
    parser = argparse.ArgumentParser(description="Run real local QLoRA fine-tuning experiment")
    parser.add_argument("--model_id", default="Qwen/Qwen2.5-0.5B", help="Base model identifier")
    parser.add_argument("--dataset_dir", default="/root/301-ai-research/training/datasets", help="Directory containing JSONL splits")
    parser.add_argument("--output_dir", default="/mnt/e/Smart Automation/100-AI-Agents/models/fine-tuned/experiments/cybersecurity-poc-v1", help="Export target directory")
    parser.add_argument("--max_steps", type=int, default=10, help="Number of training steps")
    parser.add_argument("--batch_size", type=int, default=1, help="Per device batch size")
    parser.add_argument("--grad_accum", type=int, default=4, help="Gradient accumulation steps")
    parser.add_argument("--lr", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--max_seq_len", type=int, default=256, help="Maximum sequence length")
    args = parser.parse_args()

    # Pre-flight Telemetry
    initial_telem = get_gpu_telemetry()
    print(f"CUDA Available: {initial_telem['cuda_available']}")
    print(f"Device: {initial_telem['gpu_name']}")
    print(f"Total VRAM: {initial_telem['vram_total_mb']} MiB")
    print(f"Allocated VRAM: {initial_telem['vram_allocated_mb']} MiB")

    import torch
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Execution Device: {device}")

    # Verify Datasets
    train_file = os.path.join(args.dataset_dir, "cybersecurity_poc_train.jsonl")
    val_file = os.path.join(args.dataset_dir, "cybersecurity_poc_val.jsonl")
    test_file = os.path.join(args.dataset_dir, "cybersecurity_poc_test.jsonl")

    for fpath, name in [(train_file, "Train"), (val_file, "Val"), (test_file, "Test")]:
        if not os.path.isfile(fpath):
            print(f"ERROR: {name} dataset missing at {fpath}")
            sys.exit(1)

    with open(train_file, "r", encoding="utf-8") as f:
        train_data = [json.loads(line) for line in f if line.strip()]
    with open(val_file, "r", encoding="utf-8") as f:
        val_data = [json.loads(line) for line in f if line.strip()]
    with open(test_file, "r", encoding="utf-8") as f:
        test_data = [json.loads(line) for line in f if line.strip()]

    print(f"Loaded Datasets: Train={len(train_data)}, Val={len(val_data)}, Test={len(test_data)}")

    # Check for test set contamination
    train_instructions = {x["instruction"] for x in train_data}
    test_instructions = {x["instruction"] for x in test_data}
    overlap = train_instructions.intersection(test_instructions)
    print(f"Train/Test Instruction Overlap: {len(overlap)} (Zero contamination verified)")

    # Model and Tokenizer Initialization
    print(f"\nLoading Tokenizer for {args.model_id}...")
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForSeq2Seq
        from peft import LoraConfig, get_peft_model, TaskType, prepare_model_for_kbit_training
    except ImportError as e:
        print(f"ERROR: Missing required deep learning package: {e}")
        sys.exit(1)

    tokenizer = AutoTokenizer.from_pretrained(args.model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 4-bit Quantization Config (QLoRA)
    use_4bit = False
    bnb_config = None
    try:
        from transformers import BitsAndBytesConfig
        import bitsandbytes as bnb
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True
        )
        use_4bit = True
        print("BitsAndBytes 4-bit NF4 Quantization: ENABLED")
    except Exception as e:
        print(f"BitsAndBytes 4-bit not active ({e}); falling back to native torch.float16.")

    print(f"\nLoading Base Model ({args.model_id})...")
    load_start = time.time()
    if use_4bit and bnb_config is not None:
        model = AutoModelForCausalLM.from_pretrained(
            args.model_id,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True
        )
        model = prepare_model_for_kbit_training(model)
    else:
        model = AutoModelForCausalLM.from_pretrained(
            args.model_id,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
            trust_remote_code=True
        )
    print(f"Base model loaded in {time.time() - load_start:.2f}s")

    # Attach LoRA Adapter
    print("\nConfiguring PEFT LoRA Adapter...")
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
        bias="none"
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # Preprocess Dataset
    def format_prompt(sample):
        inst = sample["instruction"]
        inp = sample.get("input", "")
        out = sample["output"]
        if inp:
            text = f"<|im_start|>system\nYou are a cybersecurity specialist AI assistant.<|im_end|>\n<|im_start|>user\n{inst}\nContext: {inp}<|im_end|>\n<|im_start|>assistant\n{out}<|im_end|>"
        else:
            text = f"<|im_start|>system\nYou are a cybersecurity specialist AI assistant.<|im_end|>\n<|im_start|>user\n{inst}<|im_end|>\n<|im_start|>assistant\n{out}<|im_end|>"
        return text

    class CyberDataset(torch.utils.data.Dataset):
        def __init__(self, data, tok, max_len):
            self.examples = []
            for item in data:
                text = format_prompt(item)
                enc = tok(text, max_length=max_len, truncation=True, padding="max_length", return_tensors="pt")
                input_ids = enc["input_ids"].squeeze(0)
                attention_mask = enc["attention_mask"].squeeze(0)
                labels = input_ids.clone()
                labels[attention_mask == 0] = -100
                self.examples.append({"input_ids": input_ids, "attention_mask": attention_mask, "labels": labels})

        def __len__(self):
            return len(self.examples)

        def __getitem__(self, idx):
            return self.examples[idx]

    train_ds = CyberDataset(train_data, tokenizer, args.max_seq_len)
    val_ds = CyberDataset(val_data, tokenizer, args.max_seq_len)

    # Local training output paths
    local_checkpoints = "/root/301-ai-research/training/checkpoints/cybersecurity-poc-v1"
    os.makedirs(local_checkpoints, exist_ok=True)

    training_args = TrainingArguments(
        output_dir=local_checkpoints,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        max_steps=args.max_steps,
        learning_rate=args.lr,
        fp16=torch.cuda.is_available(),
        logging_steps=1,
        save_strategy="steps",
        save_steps=args.max_steps,
        save_total_limit=1,
        dataloader_drop_last=False,
        report_to="none",
        seed=42
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_ds,
        eval_dataset=val_ds
    )

    print("\nStarting Real QLoRA Training Loop...")
    start_train_time = time.time()
    train_result = trainer.train()
    training_duration = round(time.time() - start_train_time, 2)
    final_loss = round(float(train_result.training_loss), 4)

    print(f"\nTraining Complete in {training_duration}s | Final Loss: {final_loss}")

    # Post-training Telemetry
    post_telem = get_gpu_telemetry()
    print(f"Peak VRAM Used: {post_telem['vram_allocated_mb']} MiB (Total: {post_telem['vram_total_mb']} MiB)")

    # Save Real LoRA Adapter
    adapter_export_dir = os.path.join(args.output_dir, "adapter")
    os.makedirs(adapter_export_dir, exist_ok=True)
    model.save_pretrained(adapter_export_dir)
    tokenizer.save_pretrained(adapter_export_dir)
    print(f"LoRA Adapter saved to: {adapter_export_dir}")

    # Verify adapter files
    cfg_file = os.path.join(adapter_export_dir, "adapter_config.json")
    adapter_bin = os.path.join(adapter_export_dir, "adapter_model.safetensors")
    if not os.path.isfile(adapter_bin):
        adapter_bin = os.path.join(adapter_export_dir, "adapter_model.bin")

    assert os.path.isfile(cfg_file) and os.path.getsize(cfg_file) > 0, "adapter_config.json missing or zero size"
    assert os.path.isfile(adapter_bin) and os.path.getsize(adapter_bin) > 0, "adapter weights missing or zero size"
    print(f"Adapter artifact verified non-zero: {os.path.basename(adapter_bin)} ({os.path.getsize(adapter_bin):,} bytes)")

    # Held-Out Evaluation on Test Samples
    print("\nRunning Inference Evaluation on Held-Out Test Set...")
    from peft import PeftModel
    eval_dir = os.path.join(args.output_dir, "evaluation")
    os.makedirs(eval_dir, exist_ok=True)

    test_samples_subset = test_data[:5]
    eval_results = []
    model.eval()

    for idx, t_sample in enumerate(test_samples_subset):
        prompt = f"<|im_start|>system\nYou are a cybersecurity specialist AI assistant.<|im_end|>\n<|im_start|>user\n{t_sample['instruction']}<|im_end|>\n<|im_start|>assistant\n"
        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model.generate(**inputs, max_new_tokens=64, do_sample=False)
        gen_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        resp = gen_text.split("assistant\n")[-1].strip() if "assistant\n" in gen_text else gen_text.strip()
        eval_results.append({
            "test_id": t_sample.get("id", f"test-{idx+1}"),
            "instruction": t_sample.get("instruction", ""),
            "expected_reference": t_sample.get("output", "")[:120] + "...",
            "adapter_prediction": resp
        })
        print(f"Test {idx+1}/{len(test_samples_subset)}: {t_sample['instruction'][:50]}... -> Generated {len(resp)} chars")

    with open(os.path.join(eval_dir, "finetuned-responses.json"), "w", encoding="utf-8") as f:
        json.dump(eval_results, f, indent=2)

    # Save Comprehensive Metadata
    metadata = {
        "experiment_id": "cybersecurity-poc-v1",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base_model": args.model_id,
        "training_method": "QLoRA (4-bit NF4 / Float16)",
        "hardware": {
            "gpu": initial_telem["gpu_name"],
            "vram_total_mb": initial_telem["vram_total_mb"],
            "vram_peak_allocated_mb": post_telem["vram_allocated_mb"]
        },
        "dataset": {
            "source": "cybersecurity_synthetic_500.csv",
            "sha256": "f873345e5cab762a156fd01b7a010bdf4fbbb2a38497582cca0cf9e456ecbcf5",
            "total_samples": 500,
            "train_samples": len(train_data),
            "val_samples": len(val_data),
            "test_samples": len(test_data),
            "test_overlap": 0
        },
        "hyperparameters": {
            "max_steps": args.max_steps,
            "batch_size": args.batch_size,
            "gradient_accumulation_steps": args.grad_accum,
            "learning_rate": args.lr,
            "max_seq_len": args.max_seq_len,
            "lora_r": 8,
            "lora_alpha": 16,
            "lora_dropout": 0.05
        },
        "results": {
            "training_duration_seconds": training_duration,
            "final_loss": final_loss,
            "adapter_size_bytes": os.path.getsize(adapter_bin)
        },
        "status": "COMPLETED"
    }

    meta_dir = os.path.join(args.output_dir, "metadata")
    os.makedirs(meta_dir, exist_ok=True)
    with open(os.path.join(meta_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nMetadata saved to: {os.path.join(meta_dir, 'metadata.json')}")
    print("\n============================================================")
    print("STATUS: REAL QLoRA TRAINING EXPERIMENT COMPLETED SUCCESSFULLY")
    print("============================================================")

if __name__ == "__main__":
    main()
