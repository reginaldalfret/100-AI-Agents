# 301 SUPER AI — Windows / Fedora Operational Boundary

## 1. Core Operating Principles

1. **No Migration of Production Services:** Windows remains the host for the Gateway, Web UI, Desktop Electron app, and Production Ollama instance.
2. **Zero Shell Exposure:** The Web Workbench does NOT execute arbitrary shell commands inside WSL. Instead, it sends typed jobs to `ResearchJobManager`.
3. **Storage Boundary:**
   * Linux-native filesystem (`~/301-ai-research/`): Used for high-frequency compilation, virtual environments, PyTorch wheel caches, and scratch files.
   * Windows E: drive (`/mnt/e/Smart Automation/100-AI-Agents`): Authoritative repository for code, persistent datasets, model deliverables, and Obsidian notes.
   * Windows C: drive: Strictly prohibited for project data.
4. **Hardware Access:**
   * Windows holds the display output.
   * Fedora accesses the NVIDIA RTX 2050 via WSL2 Direct3D/DXCore driver passthrough (`/usr/lib/wsl/lib/libcuda.so.1`).
   * When Fedora is training, Windows Ollama should pause heavy inference to avoid VRAM contention.
