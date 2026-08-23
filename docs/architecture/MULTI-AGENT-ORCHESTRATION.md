# Multi-Agent Orchestration Protocol

## Protocol Specifications

### 1. Handoff Contract
```json
{
  "workflowId": "wf-1740324800-abc12",
  "subtaskId": "subtask-1-cpp",
  "sourceAgent": "agent-101",
  "targetAgent": "agent-057",
  "targetAgentName": "C++ AI Agent",
  "technology": "C++",
  "objective": "Write idiomatic, optimized C++ palindrome program",
  "dependencies": [],
  "expectedOutput": "Self-contained, well-commented C++ code"
}
```

### 2. Execution Result Contract
```json
{
  "workflowId": "wf-1740324800-abc12",
  "subtaskId": "subtask-1-cpp",
  "agentId": "agent-057",
  "agentName": "C++ AI Agent",
  "status": "completed",
  "model": "qwen2.5-coder:1.5b",
  "durationMs": 2140,
  "artifacts": [
    {
      "filename": "palindrome.cpp",
      "lines": 34,
      "sha256": "8f3b...e1"
    }
  ]
}
```
