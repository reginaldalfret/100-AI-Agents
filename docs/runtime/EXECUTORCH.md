# 301 SUPER AI — ExecuTorch Edge Research Runtime

## 1. Overview
ExecuTorch is PyTorch's native end-to-end framework for deploying models on edge devices (microcontrollers to mobile smartphones).

## 2. Export Pipeline
```text
PyTorch Model (nn.Module)
       │
       ▼ (torch.export)
ExportedProgram (ATen Dialect)
       │
       ▼ (to_edge)
EdgeProgramManager (Edge Dialect)
       │
       ▼ (Delegation: XNNPACK / Vulkan / NPU)
Lowered Backend Module
       │
       ▼ (export_to_exec_prog)
ExecuTorch Binary (.pte)
```
* **Location in Fedora:** `~/301-ai-research/executorch/`
* **Deliverable Path:** `E:\Smart Automation\100-AI-Agents\models\mobile\executorch\`
