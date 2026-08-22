# Sovereign AI Workbench — RGB Neon & Liquid Glass UI/UX Redesign

**Project:** Sovereign AI Workbench  
**Client / Problem Statement:** Mangalore Refinery and Petrochemicals Limited (MRPL) / Smart India Hackathon  
**Branch:** `feature/sih-neon-liquid-glass-ui`  
**Date:** August 2026  
**Status:** Verified & Production Ready  

---

## 1. Executive Summary & Design Vision

The Sovereign AI Workbench frontend has been transformed into a **luxury next-generation AI operating system** combining:
- **Atmospheric RGB Environment**: 3–5 slowly floating blurred ambient light fields (Blue, Violet, Cyan, Magenta) with 25–38s cycles and a 2% micro-grid texture.
- **5-Level Liquid Glass Hierarchy**: Translucent glass containers (`rgba(12, 16, 28, 0.72)` to `rgba(20, 26, 45, 0.65)`) with `backdrop-filter: blur(24px) saturate(140%)`, 1px borders, and inner light reflections (`inset 0 1px 1px 0 rgba(255, 255, 255, 0.10)`).
- **Subtle RGB Neon Accents**: A balanced 70% professional minimalism / 30% futuristic personality ratio with Electric Blue (primary interaction), Neon Cyan (search/information), Neon Violet (AI reasoning), Emerald (air-gap sovereignty), and Amber (busy/pending).
- **Interactive AI Agent Orb**: Dynamic glowing radial energy core reflecting agent identity in the header and thinking states.
- **Floating Liquid-Glass Composer Capsule**: Pinned 26px rounded glass capsule (`backdrop-filter: blur(28px)`), moving RGB border glow on focus, glass file chips, and gradient send button.
- **Zero Cloud CDNs / 100% On-Premise**: Pure system fonts, local GPU processing, and zero external network calls.

---

## 2. Color Language & RGB Neon System

| Color Token | Hex / Value | Semantic Role |
|---|---|---|
| `--bg-void` | `#04060a` | Deepest atmospheric void |
| `--bg-app` | `#070a12` | Main application foundation |
| `--glass-base` | `rgba(12, 16, 28, 0.72)` | Shell background (sidebar & workspace) |
| `--glass-card` | `rgba(18, 24, 42, 0.60)` | Elevated cards and message bubbles |
| `--glass-capsule` | `rgba(9, 13, 24, 0.86)` | Pinned bottom composer capsule |
| `--neon-blue` | `#3b82f6` | User message bubbles & primary links |
| `--neon-cyan` | `#06b6d4` | Search focus, model badges, active chips |
| `--neon-violet` | `#8b5cf6` | AI intelligence, orchestrator traces |
| `--neon-green` | `#10b981` | Sovereign air-gap badge & healthy agents |
| `--neon-amber` | `#f59e0b` | Busy pulse & pending HITL decisions |
| `--neon-red` | `#ef4444` | Errors and statutory breach alerts |

---

## 3. Five-Level Liquid Glass Hierarchy

1. **Level 1 (Atmosphere & Canvas)**: `#04060a` background with 4 blurred ambient orbs (`.orb-blue`, `.orb-violet`, `.orb-cyan`, `.orb-magenta`) and micro-mesh pattern.
2. **Level 2 (Floating Glass Shell)**: Sidebar (`320px`, `border-radius: 20px`) and Main Workspace (`border-radius: 20px`) floating over the canvas with 12px padding.
3. **Level 3 (Interactive Glass Cards)**: Mini agent rows, tab pills, workflow cards, approval summaries.
4. **Level 4 (Active Neon Glass)**: Active agent row with cyan/violet gradient backdrop, active tab with glowing underline.
5. **Level 5 (Modals & Slide-Out Inspector)**: Slide-out glass drawer (`340px`) with nested spec cards and DAG execution traces.

---

## 4. Key Component Redesigns

### A. Sidebar & Agent Directory
- **Brand Core**: AI Core orb logo with concentric glowing rings and pulsing center.
- **New Chat**: Liquid glass button with light sweep animation on hover.
- **Search Pill**: Glass input with cyan neon focus glow and search icon.
- **101-Agent Cards**: Mini glass cards with glowing emerald/amber status dots and domain categorization.
- **Air-Gap Badge**: Emerald glowing badge with live pulse confirming 0 external calls.

### B. Main Workspace & AI Agent Orb
- **Header**: Identity block with glowing Agent Orb matching agent domain color, status pills, and air-gap badge.
- **Tabs**: Chat, About, Capabilities, Examples with smooth active underline transitions.
- **Empty State**: Centered glowing avatar, specialty statement, and interactive prompt chips.
- **Chat Stream**:
  - User messages: Translucent dark glass with blue accent border.
  - AI responses: Layered glass with violet left accent, grounded citations, deliverable chips, and expandable trace button.

### C. Floating Composer Capsule
- Liquid-glass capsule (`backdrop-filter: blur(28px)`).
- Moving cyan/violet border glow on focus.
- Attachment button supporting PDF, PNG, JPG, DOCX, XLSX.
- Model indicator pill (`AUTO`) and circular glass send button with cyan/indigo gradient and glow.

### D. Slide-Out Inspector & Secondary Views
- 340px floating glass drawer for execution DAG plans, token telemetry, and latency.
- Dedicated liquid-glass views for Investigations, Files & Deliverables, Refinery Knowledge (RAG), Industrial Workflows, Approvals (HITL), Models, and System Status.

---

## 5. Verification & Performance

### Asset Delivery Test
```
http://127.0.0.1:8300/api/health                     200 (287 bytes)
http://127.0.0.1:8300/api/workforce                  200 (147,372 bytes)
http://127.0.0.1:8300/api/agents/agent-042/details   200 (434 bytes)
http://127.0.0.1:8300/                               200 (21,062 bytes HTML)
http://127.0.0.1:8300/styles.css                     200 (39,496 bytes CSS)
http://127.0.0.1:8300/app.js                         200 (41,555 bytes JS)
```

### SIH Platform Regression Matrix
```
node tests/sih/run-all-tests.js
============================================================
ALL 28 TEST SUITES PASSED (100% PASS RATE ACROSS PLATFORM)
EXTERNAL EGRESS: 0 CALLS (100% AIR-GAP VERIFIED)
============================================================
```

### Full Fleet Test
```
node tests/run-all-agents.js --concurrency=10
======================================================
Fleet Test Complete: 101/101 Passed (100.0%) in 9.23s
======================================================
```

---

## 6. Liquid Glass Motion System

### A. Centralized Design Token System
- **Core Surfaces**: `--bg-0` (`#030509`), `--bg-1` (`#060911`), `--bg-2` (`#0a0e1c`).
- **5-Level Glass Layers**:
  - `Level 1` (`--glass-1: rgba(6, 10, 20, 0.40)`): Canvas / ambient underlay.
  - `Level 2` (`--glass-2: rgba(10, 15, 28, 0.68)`): Floating sidebar & workspace shell.
  - `Level 3` (`--glass-3: rgba(16, 22, 40, 0.58)`): Standard cards & empty states.
  - `Level 4` (`--glass-4: rgba(12, 18, 34, 0.82)`): Active cards & composer capsule.
  - `Level 5` (`--glass-5: rgba(8, 12, 24, 0.94)`): Floating model dropdown, inspector, and modals.
- **Blur Hierarchy**: `--blur-sm` (`8px`), `--blur-md` (`18px`), `--blur-lg` (`28px`), `--blur-xl` (`40px`).
- **Transitions**: `--transition-fast` (`0.15s`), `--transition-normal` (`0.22s`), `--transition-slow` (`0.35s`).

### B. Ambient Atmosphere & Light Fields
- Four large blurred ambient orbs (`.orb-blue`, `.orb-violet`, `.orb-cyan`, `.orb-magenta`) with `filter: blur(140px)` and subtle `0.06–0.11` opacity.
- 30–44s slow breathing animations (`@keyframes orbFloat1`, `orbFloat2`, `orbFloat3`) creating a soft atmospheric background without visible distraction.
- Subtle 28px radial micro-mesh dot grid (`.bg-mesh`) at `0.035` opacity.

### C. Glass Depth, Micro-Interactions & Borders
- **Inner Highlights**: Every glass card incorporates `inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)` mimicking real glass refraction.
- **Light Sweep**: A subtle diagonal reflection (`@keyframes lightSweep`) sweeps across the pinned composer capsule every 8s.
- **Dynamic Super AI Orb**: Multi-layered glowing radial core (`@keyframes agentOrbBreath`) with cyan, blue, and violet gradients.
- **Message Entry Motion**: New chat messages animate via `fadeSlideIn` (`translateY(8px → 0)`, `scale(0.99 → 1)`, `opacity 0 → 1`) in `260ms`.
- **Button Micro-Interactions**: Hover elevation (`translateY(-1px)`), active click depressions (`scale(0.96)`), and localized RGB neon glows.

### D. Accessibility & Performance
- **Zero Heavy Packages**: Pure CSS transforms, opacity, gradients, and backdrop-filter without WebGL, Three.js, or external JS animation engines.
- **Prefers-Reduced-Motion**: Full `@media (prefers-reduced-motion: reduce)` support disabling all ambient orb floatings, light sweeps, and message slide transitions.
- **Minimal Thin Glass Scrollbar**: 5px custom scrollbar with translucent glass thumb and cyan hover glow.
