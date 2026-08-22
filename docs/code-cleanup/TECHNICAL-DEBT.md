# Super AI — Technical Debt & Future Roadmap

This document explicitly catalogs known non-blocking architectural items, future optimizations, and roadmap enhancements.

---

## 1. Tracked Future Enhancements

| Item ID | Category | Description | Priority | Target Milestone |
|---|---|---|---|---|
| **TD-001** | Performance | Implement fine-grained token-level streaming cancellation via AbortController on `/api/chat`. | Medium | Post-SIH v2.1 |
| **TD-002** | Scaling | Add multi-node GPU cluster dispatch support via local gRPC for distributed agent workloads. | Low | Enterprise Scale |
| **TD-003** | Knowledge | Add automated background PDF vector indexing watcher for newly dropped NDT scan folders in `data/demo/`. | Medium | v2.2 |
| **TD-004** | Deliverables | Expand PowerPoint slide template themes to include custom refinery corporate branding palettes. | Low | v2.2 |

---

## 2. Invariants Preserved

- **Air-Gap Guarantee**: Zero external network egress must remain enforced under all future extensions.
- **Local Model Exclusivity**: 100% on-premise execution with zero cloud LLM reliance.
- **Single Source of Truth**: All agent definitions must remain centralized in `registry/sih-agent-mapping.json`.
