# Performance Baseline & Critical Path Profile

**Platform:** Sovereign AI Workbench  
**Hardware:** NVIDIA RTX 2050 (4GB VRAM) / 8GB RAM / Windows  
**Models:** NVIDIA Nemotron 3 Nano (Reasoning), Google Gemma 3 4B (Vision), Qwen 2.5 Coder 1.5B (Coding)  
**Date:** August 2026

---

## 1. Request Critical Path Breakdown

```
[User Clicks Send]
  │
  ├─ 1. Frontend Message Append & UI State Switch: ~2ms
  │
  ├─ 2. Gateway Request Ingestion & JSON Parsing: ~1ms
  │
  ├─ 3. Context & Conversational Memory Preparation: ~2.5ms
  │    └─ Topic resolution + Entity check + Recent window fitting
  │
  ├─ 4. Scope Guard Intent Classification: ~1.2ms
  │    └─ Fast deterministic intent categorization
  │
  ├─ 5. Model Availability & Tag Check: ~25ms (BLOCKING HTTP CALL to 11434 -> Target for Caching)
  │
  ├─ 6. Prompt Assembly & Persona Formatting: ~0.8ms
  │
  ├─ 7. Ollama Local Model Invocation:
  │    ├─ Cold Model Load (if swapping or cold): ~800ms – 1400ms
  │    └─ Warm Model Invocation (with keep-alive): ~45ms – 90ms
  │
  ├─ 8. Time To First Token (TTFT):
  │    ├─ Cold TTFT: ~950ms – 1600ms
  │    └─ Warm TTFT: ~80ms – 140ms
  │
  └─ 9. Token Streaming & Frontend Rendering:
       ├─ Generation Speed: ~38 - 65 tok/s (Qwen 1.5B) / ~22 - 38 tok/s (Nemotron)
       └─ DOM Render Throttling: target < 16ms (60 FPS fluid rendering)
```

---

## 2. Identified Optimization Targets

1. **Tag Check Caching**: Cache local tags with a 60s TTL to eliminate 25ms synchronous HTTP roundtrip on every prompt.
2. **Intelligent Keep-Alive**: Pass `keep_alive: "5m"` to Ollama to maintain model residency across consecutive turns.
3. **Async Non-Critical Background Work**: Ensure disk persistence of memory runs asynchronously without blocking TTFT.
4. **Fluid Stream Rendering**: Use `requestAnimationFrame` batching in frontend `app.js` for smoother rendering under high token generation rates.
