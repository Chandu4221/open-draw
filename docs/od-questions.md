# OpenDraw — Questions Log (`docs/od-questions.md`)

This document records any open questions, ambiguous specifications, or blockers encountered during development.
Per OpenDraw working rules: **never invent**. Anything unspecified is logged here, marked in code with `// OD-QUESTION:`, and raised with the maintainer.

| ID | Date | Component | Question / Ambiguity | Resolution | Status |
|---|---|---|---|---|---|
| `Q-001` | 2026-10-20 | Canvas Renderer (Culling) | At what shape count threshold should viewport culling (DOM element detachment) be activated? Empirical benchmark SPK-001 indicates that 1,000 shapes (3,002 DOM elements) maintain 60fps pan and <0.01ms drag blocking natively without virtualization. Should culling activate at >= 2,000 shapes or remain deferred until Phase 2.x stress tests? | Culling threshold is measured from SPK-002 data (10k shapes = 30k DOM nodes still yields 52fps pan, <0.01ms drag block, 295ms TTFF). The real trigger for culling is complex shapes' node-per-shape ratio (frames/connectors/ink paths); revisit at first perf regression — not now. Zero culling code written. Evidence: `docs/od-verification/2x/culling-stress-results.json`. | Resolved |
| `Q-002` | 2026-10-20 | Canvas Engine (Parenting) | ADR-002 specifies that a child dragged out of bounds does NOT auto-detach (no continuous recompute), and explicit detach requires user action. What is the explicit detach affordance in v0.x? | In v0.x, explicit detachment is provided programmatically via `editor.clipping.detachChild(childId, store)` and meta clearing, which emits `onChildOrphaned`. Interactive gesture detachment (e.g. Alt/Option-drag out of container) is scheduled for Phase 2.y gesture system. | Resolved |

