# Super AI — Unused & Legacy File Audit

This audit classifies every non-standard, backup, and legacy file across the repository as `SAFE_DELETE`, `ARCHIVE`, or `KEEP`.

---

## 1. Candidate Inventory & Classification Table

| Target File / Directory | Classification | Current Status | Risk Level | Rationale |
|---|---|---|---|---|
| `platform/web/index.html.backup-20260813-203444` | **SAFE_DELETE** | Stale HTML backup | Low | Superseded by canonical `platform/web/index.html`. |
| `platform/web/index.html.backup-before-agent-workspace` | **SAFE_DELETE** | Stale HTML backup | Low | Superseded by canonical `platform/web/index.html`. |
| `platform/web/index.html.backup-before-gateway-response-fix-20260813-233539` | **SAFE_DELETE** | Stale HTML backup | Low | Superseded by canonical `platform/web/index.html`. |
| `platform/web/index.html.backup-before-json-filter-20260813-232738` | **SAFE_DELETE** | Stale HTML backup | Low | Superseded by canonical `platform/web/index.html`. |
| `platform/web/index.html.backup-before-rejection-ui-20260813-232318` | **SAFE_DELETE** | Stale HTML backup | Low | Superseded by canonical `platform/web/index.html`. |
| `platform/web/index.html.backup-before-tabs-20260813-210213` | **SAFE_DELETE** | Stale HTML backup | Low | Superseded by canonical `platform/web/index.html`. |
| `platform/web/ui-polish.css.backup-before-agent-workspace` | **SAFE_DELETE** | Stale CSS backup | Low | Superseded by canonical `platform/web/styles.css`. |
| `platform/web/ui-polish.js.backup-before-agent-workspace` | **SAFE_DELETE** | Stale JS backup | Low | Superseded by canonical `platform/web/app.js`. |
| `agent-template/backend/src/agent.js.backup-before-capability-gate` | **SAFE_DELETE** | Stale template backup | Low | Superseded by active template code. |
| `agent-template/backend/src/capability-gate.js.backup-before-strict-20260813-231503` | **SAFE_DELETE** | Stale template backup | Low | Superseded by active template code. |
| `agent-template/frontend/index.html.backup` | **SAFE_DELETE** | Stale template backup | Low | Superseded by active template code. |
| `agents/agent-001-writing-agent/backend/src/server.js.backup` | **SAFE_DELETE** | Stale agent backup | Low | Superseded by active agent implementation. |
| `agents/agent-001-writing-agent/frontend/index.html.backup` | **SAFE_DELETE** | Stale agent backup | Low | Superseded by active agent implementation. |
| `registry/agents.json.backup-before-capability-fix-20260813-225206` | **SAFE_DELETE** | Stale registry backup | Low | Superseded by `registry/sih-agent-mapping.json`. |
| `dashboard/` | **SAFE_DELETE** | Prototype UI folder | Low | Fully replaced by `platform/web/`. Not imported by any tests or gateway. |
| `control-plane/` | **SAFE_DELETE** | Prototype server folder | Low | Fully replaced by `platform/gateway/`. Not imported by any tests or gateway. |
| `archive/` | **ARCHIVE** | Historical build backups | Low | Retained in archive for historical development provenance. |
| `docs/benchmark/hardware-profile.json` | **KEEP** | Historical benchmark | Zero | Valid benchmark baseline for hardware comparison. |

---

## 2. Deletion Action Checklist

- [ ] Remove `platform/web/*.backup*`
- [ ] Remove `agent-template/**/*.backup*`
- [ ] Remove `agents/agent-001-writing-agent/**/*.backup`
- [ ] Remove `registry/agents.json.backup-*`
- [ ] Remove unused prototype directory `dashboard/`
- [ ] Remove unused prototype directory `control-plane/`
- [ ] Verify that all 28 SIH test suites and 101/101 fleet tests pass after removal.
