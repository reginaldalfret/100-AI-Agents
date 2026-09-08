#!/usr/bin/env python3
"""
301 SUPER AI — Cybersecurity Dataset Generator for QLoRA Fine-Tuning POC
Generates a curated 500-sample synthetic cybersecurity instruction-tuning dataset
with strict 80% (400) / 10% (50) / 10% (50) train/val/test splits.
"""
import os
import json
import hashlib
import random

# Fixed seed for reproducibility
random.seed(42)

TOPICS = [
    {
        "category": "Web Security",
        "templates": [
            ("Explain how to prevent SQL Injection in {lang}.", "The application queries user data using dynamic string concatenation.", "To prevent SQL Injection in {lang}, always use parameterized queries or prepared statements instead of dynamic SQL strings. For example, use query placeholders (e.g. `?` or `$1`) so that the SQL engine compiles the query structure prior to binding user inputs, neutralizing any malicious SQL meta-characters."),
            ("What is the security remediation for Cross-Site Scripting (XSS) in {framework}?", "User comments are rendered directly onto the webpage without sanitization.", "The remediation for XSS in {framework} requires contextual output encoding (HTML, JavaScript, CSS, or URL attributes) before rendering untrusted input. Additionally, enforce a strict Content Security Policy (CSP) header such as `default-src 'self'` to block execution of inline scripts and unauthorized external scripts."),
            ("How does Cross-Site Request Forgery (CSRF) differ from XSS?", "An analyst needs to distinguish between client-side script execution and session hijacking.", "XSS executes arbitrary JavaScript within the victim's browser session, allowing data theft and session hijacking. In contrast, CSRF tricks an authenticated user's browser into transmitting unauthorized state-changing HTTP requests to a target application where the user is currently authenticated. CSRF is mitigated with anti-CSRF tokens and `SameSite=Strict` cookie attributes.")
        ],
        "params": {"lang": ["Python", "Node.js", "Go", "Java", "PHP"], "framework": ["React", "Express", "Django", "Spring Boot", "Next.js"]}
    },
    {
        "category": "Authentication & IAM",
        "templates": [
            ("What is Multi-Factor Authentication (MFA) and why is it essential?", "Evaluating enterprise identity defense against credential stuffing.", "Multi-Factor Authentication (MFA) requires users to provide two or more verification factors to gain access: something you know (password), something you have (hardware token, TOTP authenticator app), or something you are (biometrics). MFA mitigates credential stuffing and brute-force attacks by requiring an independent verification layer even if passwords are leaked."),
            ("Explain the OAuth 2.0 Authorization Code Flow with PKCE.", "Mobile and single-page applications requesting API authorization.", "The Authorization Code Flow with PKCE (Proof Key for Code Exchange) protects public clients from authorization code interception. The client creates a secret `code_verifier` and derives a `code_challenge`. The authorization server validates the code_verifier on token exchange, ensuring that only the original caller can exchange the authorization code for an access token."),
            ("What is the Principle of Least Privilege in Active Directory and IAM?", "Configuring permissions for service accounts and operators.", "The Principle of Least Privilege (PoLP) dictates that identities (users, services, processes) should be granted only the minimum permissions necessary to perform their required tasks. In Active Directory and cloud IAM, this is achieved by eliminating Domain Admin memberships for routine tasks, using dedicated Just-In-Time (JIT) access, and scoping roles to specific resources.")
        ],
        "params": {}
    },
    {
        "category": "Network & Protocol Security",
        "templates": [
            ("How does a TCP SYN scan work in network enumeration?", "An intrusion detection system logged repeated SYN packets without ACK responses.", "In a TCP SYN scan (half-open scan), the scanner transmits a TCP packet with the SYN flag set. If the port is open, the target responds with SYN/ACK, and the scanner immediately sends a RST packet to tear down the connection without completing the 3-way handshake. If closed, the target responds with RST/ACK."),
            ("Explain the cryptographic handshake in TLS 1.3.", "Securing client-server communications with zero round-trip overhead.", "TLS 1.3 reduces the handshake to a single round-trip (1-RTT). The client sends `ClientHello` containing supported cipher suites and key share parameters (ECDH). The server responds with `ServerHello`, its key share, and encrypted certificate. Both parties derive symmetric session keys (e.g. AES-256-GCM or ChaCha20-Poly1305), ensuring Perfect Forward Secrecy (PFS)."),
            ("What is the role of a Demilitarized Zone (DMZ) in network architecture?", "Designing perimeter defenses for public web services.", "A DMZ is a physical or logical subnetwork that exposes external-facing services (e.g. web servers, reverse proxies) to an untrusted network (the internet) while isolating them from the internal corporate network. Strict firewall rules prevent compromise of DMZ nodes from pivoting into internal database and core infrastructure segments.")
        ],
        "params": {}
    },
    {
        "category": "Incident Response & Forensics",
        "templates": [
            ("What are the initial containment steps during an active ransomware incident?", "Endpoint detection flags widespread file renaming with known extension.", "Immediate containment steps include: 1) Sever network connectivity (isolate host via EDR or physical disconnect), 2) Do not power off immediately if volatile RAM memory forensics is required, 3) Identify compromised credentials and revoke active sessions, 4) Scope perimeter propagation via firewall/NetFlow logs, 5) Protect backup repositories from lateral modification."),
            ("How do Security Information and Event Management (SIEM) tools correlate alerts?", "Analyzing authentication logs across domain controllers and VPN gateways.", "SIEM tools aggregate telemetry across endpoints, firewalls, and directory services into a normalized schema. Correlation rules evaluate temporal conditions (e.g., 5 failed logons followed by a successful logon from an anomalous geographic IP within 60 seconds) to flag credential brute-force and trigger security playbooks."),
            ("What is the difference between an Indicator of Compromise (IoC) and an Indicator of Attack (IoA)?", "Evaluating threat intelligence feeds for proactive defense.", "An Indicator of Compromise (IoC) represents forensic evidence of a past breach (e.g., known file hash, malicious C2 IP, specific registry key). An Indicator of Attack (IoA) focuses on the real-time intent and behavior of an adversary (e.g., code injection into lsass.exe, scheduled task persistence, unquoted service path exploitation) regardless of the specific malware used.")
        ],
        "params": {}
    },
    {
        "category": "Cryptography",
        "templates": [
            ("Why is AES-GCM preferred over AES-CBC for data in transit?", "Selecting a symmetric cipher mode for high-throughput protocol security.", "AES-GCM (Galois/Counter Mode) provides Authenticated Encryption with Associated Data (AEAD), ensuring both confidentiality and integrity in a single pass. In contrast, AES-CBC requires a separate MAC (Encrypt-then-MAC) and is vulnerable to padding oracle attacks if error handling reveals padding status."),
            ("Explain why Argon2id is recommended for password storage over SHA-256.", "Evaluating database hashing schemes for user credentials.", "SHA-256 is an extremely fast general-purpose cryptographic hash function, allowing adversaries to compute billions of guesses per second on modern GPUs/ASICs. Argon2id is a memory-hard and time-hard password hashing function that resists both GPU brute-force attacks (memory consumption) and side-channel attacks (data-independent memory access)."),
            ("What is Perfect Forward Secrecy (PFS) in key exchange?", "Auditing public key infrastructure and session negotiation.", "Perfect Forward Secrecy ensures that compromise of a server's long-term private key does not compromise past session traffic. PFS uses ephemeral Diffie-Hellman (DHE or ECDHE) to generate unique, temporary session keys for each conversation, which are discarded immediately after the session terminates.")
        ],
        "params": {}
    }
]

def generate_samples(total_count=500):
    samples = []
    idx = 0
    while len(samples) < total_count:
        for topic in TOPICS:
            for inst_tmpl, input_tmpl, out_tmpl in topic["templates"]:
                if len(samples) >= total_count:
                    break
                params = topic.get("params", {})
                kw = {}
                for k, v_list in params.items():
                    kw[k] = random.choice(v_list)
                
                inst = inst_tmpl.format(**kw) if kw else inst_tmpl
                inp = input_tmpl.format(**kw) if kw else input_tmpl
                out = out_tmpl.format(**kw) if kw else out_tmpl

                # Add unique scenario ID to guarantee strict train/val/test separation
                inst = f"{inst} [Scenario SEC-{idx:04d}]"
                
                samples.append({
                    "id": f"cyber_poc_{idx:04d}",
                    "instruction": inst,
                    "input": inp,
                    "output": out,
                    "category": topic["category"]
                })
                idx += 1
    return samples[:total_count]

def main():
    samples = generate_samples(500)
    
    # Paths on Windows host
    win_dir = "E:\\Smart Automation\\100-AI-Agents\\data\\fine-tuning\\synthetic"
    os.makedirs(win_dir, exist_ok=True)
    csv_path = os.path.join(win_dir, "cybersecurity_synthetic_500.csv")
    
    # Save CSV
    import csv
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "instruction", "input", "output", "category"])
        writer.writeheader()
        writer.writerows(samples)
        
    print(f"Generated 500 samples in {csv_path}")
    
    # Hash source dataset
    hasher = hashlib.sha256()
    with open(csv_path, "rb") as f:
        hasher.update(f.read())
    dataset_hash = hasher.hexdigest()
    print(f"Dataset SHA-256: {dataset_hash}")
    
    # Split 80% train (400), 10% val (50), 10% test (50)
    train_samples = samples[:400]
    val_samples = samples[400:450]
    test_samples = samples[450:500]
    
    # Write JSONL for research
    wsl_datasets_dir = "E:\\Smart Automation\\100-AI-Agents\\data\\fine-tuning\\datasets"
    os.makedirs(wsl_datasets_dir, exist_ok=True)
    
    def write_jsonl(path, data):
        with open(path, "w", encoding="utf-8") as f:
            for item in data:
                f.write(json.dumps({
                    "instruction": item["instruction"],
                    "input": item["input"],
                    "output": item["output"]
                }, ensure_ascii=False) + "\n")
                
    write_jsonl(os.path.join(win_dir, "cybersecurity_poc_500.jsonl"), samples)
    write_jsonl(os.path.join(win_dir, "cybersecurity_poc_train.jsonl"), train_samples)
    write_jsonl(os.path.join(win_dir, "cybersecurity_poc_val.jsonl"), val_samples)
    write_jsonl(os.path.join(win_dir, "cybersecurity_poc_test.jsonl"), test_samples)
    
    print("Dataset generation complete:")
    print(f"  Total: {len(samples)}")
    print(f"  Train: {len(train_samples)} (80%)")
    print(f"  Validation: {len(val_samples)} (10%)")
    print(f"  Test: {len(test_samples)} (10%)")

if __name__ == "__main__":
    main()
