#!/usr/bin/env python3
import os
import re
import json
import random
from pathlib import Path

ROOT = Path("/mnt/e/Smart Automation/100-AI-Agents")
RAW_CHAT = ROOT / "data/raw/chat/WhatsApp Chat with Kaviya.txt"
OUTPUT_DIR = ROOT / "data/fine-tuning/personal-style/kaviya-style-v2-enriched"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')

SENSITIVE_REPLACEMENTS = {
    "80981": "[REDACTED_NUM]",
    "dheeraj": "[friend]",
    "Dheeraj": "[friend]",
    "Saveetha": "[college]",
    "saveetha": "[college]",
    "Dailygurus": "[workplace]",
    "dailygurus": "[workplace]",
    "Vanagram": "[location]",
    "vanagram": "[location]",
    "Thiruverkadu": "[location]",
    "thiruverkadu": "[location]",
    "Palani": "[location]",
    "palani": "[location]"
}

def scrub_privacy(text):
    text = PHONE_REGEX.sub("[phone_number]", text)
    text = EMAIL_REGEX.sub("[email]", text)
    for k, v in SENSITIVE_REPLACEMENTS.items():
        text = text.replace(k, v)
    return text

def parse_chat():
    with open(RAW_CHAT, "r", encoding="utf-8") as f:
        lines = f.readlines()

    msg_regex = re.compile(r'^(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[apAP][mM])?)\s+-\s+([^:]+):\s+(.*)$')
    
    raw_msgs = []
    curr = None
    for line in lines:
        line_clean = line.rstrip("\r\n")
        if not line_clean:
            continue
        m = msg_regex.match(line_clean)
        if m:
            if curr:
                raw_msgs.append(curr)
            curr = {
                "date": m.group(1),
                "time": m.group(2),
                "sender": m.group(3).strip(),
                "text": m.group(4).strip()
            }
        elif curr:
            curr["text"] += " " + line_clean.strip()
            
    if curr:
        raw_msgs.append(curr)

    valid_msgs = []
    for m in raw_msgs:
        t = m["text"]
        if "<Media omitted>" in t or "This message was deleted" in t or "You deleted this message" in t:
            continue
        if "Messages and calls are end-to-end encrypted" in t:
            continue
        role = "assistant" if m["sender"] == "Kaviya" else "user"
        valid_msgs.append({
            "date": m["date"],
            "time": m["time"],
            "role": role,
            "sender": m["sender"],
            "text": scrub_privacy(t)
        })

    grouped = []
    for m in valid_msgs:
        if grouped and grouped[-1]["role"] == m["role"] and grouped[-1]["date"] == m["date"]:
            grouped[-1]["text"] += " " + m["text"]
        else:
            grouped.append(m)

    return grouped

def build_examples(grouped_turns):
    examples = []
    
    for i in range(len(grouped_turns)):
        turn = grouped_turns[i]
        if turn["role"] == "assistant":
            target_text = turn["text"].strip()
            if len(target_text) < 2:
                continue

            context = []
            lookback_start = max(0, i - 3)
            for j in range(lookback_start, i):
                context.append({"role": grouped_turns[j]["role"], "content": grouped_turns[j]["text"].strip()})

            if not context or context[-1]["role"] != "user":
                continue

            messages = context + [{"role": "assistant", "content": target_text}]
            assert messages[-1]["role"] == "assistant"
            
            examples.append({
                "messages": messages,
                "target_length": len(target_text),
                "num_context_turns": len(context)
            })

    return examples

def main():
    print("Parsing WhatsApp raw chat...")
    turns = parse_chat()
    print(f"Grouped conversational turns: {len(turns)}")

    examples = build_examples(turns)
    print(f"Total context-rich training examples: {len(examples)}")

    seen = set()
    deduped = []
    for ex in examples:
        key = json.dumps(ex["messages"], sort_keys=True)
        if key not in seen:
            seen.add(key)
            deduped.append(ex)

    print(f"After deduplication: {len(deduped)} examples")

    lengths = [ex["target_length"] for ex in deduped]
    lengths.sort()
    avg_len = sum(lengths) / len(lengths)
    med_len = lengths[len(lengths)//2]

    hist = {
        "0-10": sum(1 for l in lengths if l <= 10),
        "11-25": sum(1 for l in lengths if 11 <= l <= 25),
        "26-50": sum(1 for l in lengths if 26 <= l <= 50),
        "51-100": sum(1 for l in lengths if 51 <= l <= 100),
        "101-200": sum(1 for l in lengths if 101 <= l <= 200),
        "200+": sum(1 for l in lengths if l > 200)
    }

    print(f"Average target length: {avg_len:.1f} characters")
    print(f"Median target length: {med_len} characters")
    print("Distribution:", json.dumps(hist, indent=2))

    random.seed(42)
    indices = list(range(len(deduped)))
    random.shuffle(indices)

    n_test = int(len(deduped) * 0.10)
    n_val = int(len(deduped) * 0.10)
    
    test_idx = set(indices[:n_test])
    val_idx = set(indices[n_test:n_test + n_val])
    train_idx = set(indices[n_test + n_val:])

    train_data = [deduped[i] for i in sorted(train_idx)]
    val_data = [deduped[i] for i in sorted(val_idx)]
    test_data = [deduped[i] for i in sorted(test_idx)]

    print(f"Split sizes — Train: {len(train_data)} | Val: {len(val_data)} | Test: {len(test_data)}")

    def save_jsonl(data, path):
        with open(path, "w", encoding="utf-8") as f:
            for item in data:
                f.write(json.dumps({"messages": item["messages"]}, ensure_ascii=False) + "\n")

    save_jsonl(train_data, OUTPUT_DIR / "kaviya_v2_train.jsonl")
    save_jsonl(val_data, OUTPUT_DIR / "kaviya_v2_val.jsonl")
    save_jsonl(test_data, OUTPUT_DIR / "kaviya_v2_test.jsonl")

    audit = {
        "total_examples": len(deduped),
        "train_count": len(train_data),
        "val_count": len(val_data),
        "test_count": len(test_data),
        "average_target_length": round(avg_len, 1),
        "median_target_length": med_len,
        "target_length_histogram": hist,
        "target_speaker": "Kaviya",
        "context_speaker": "Reginald",
        "reginald_target_turns": 0
    }
    with open(OUTPUT_DIR / "dataset_audit.json", "w", encoding="utf-8") as f:
        json.dump(audit, f, indent=2)

    print(f"Exported enriched dataset to {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
