# Phase 2 — DOM Canvas Core Verification Report

- **Repository:** `github.com/Chandu4221/open-draw`
- **Branch:** `build/phase-2`
- **Exit Date:** 2026-10-20
- **Status:** PASS (All B1–B7 deliverables verified, all guardrails live with red/green proofs)

---

## 1. Executive Summary

Phase 2 established the architectural foundation of OpenDraw's **DOM Canvas Core**:
1. **Schema Geometry Core (`@open-draw/schema`):** Pure mathematical boundary functions, containment semantics (inclusive top-left, exclusive bottom-right), and core structural types.
2. **Immutable Canvas Store:** Shape lifecycle operations, transaction atomicity with automatic rollback, undo/redo stack, and snapshot schema validation with meta validator hooks.
3. **The Camera:** Pure coordinate transform functions (`pageToScreen`, `screenToPage`), cursor-anchored `zoomAroundPoint`, and root SVG transform generation. Enforced via a CI guardrail isolating all zoom math to `camera.ts`.
4. **The Overlay-Invariant E2E (Soul Test):** Failing spec committed *before* renderer implementation; verified in Chromium across hard pans (±2,000px) and extreme zooms ($0.2\times$ to $5\times$) for both flat and nested-grouped shapes ($\pm 1\text{px}$ drift, identity transform relative to wrapper, pointer-events none).
5. **Shape Registry & Rect Plugin:** ADR-005 contract, pluggable `ShapeDefinition<P>` with in-place `update` DOM patching, privileged capabilities (text, connector, clipping) without shape-type branching, and a mechanical CI guardrail with red/green proof.
6. **Benchmark Spike:** Empirical observations for 100, 500, and 1,000 shapes recorded on defined hardware with zero performance budget claims; culling question scheduled in `docs/od-questions.md`.

---

## 2. Step-by-Step Deliverables & Evidence

| Step | Scope | Implementation | Verification & Evidence | Status |
|---|---|---|---|:---:|
| **B1** | Schema Geometry Core | [`packages/schema/src/geometry.ts`](packages/schema/src/geometry.ts), [`packages/schema/src/types.ts`](packages/schema/src/types.ts) | 28 unit tests passing ([`packages/schema/src/geometry.test.ts`](packages/schema/src/geometry.test.ts)) | **PASS** |
| **B2** | The Canvas Store | [`packages/canvas/src/store.ts`](packages/canvas/src/store.ts) | 9 unit tests passing ([`packages/canvas/src/store.test.ts`](packages/canvas/src/store.test.ts)) covering atomicity, transactions, and undo/redo | **PASS** |
| **B3** | The Camera & Coordinate Math | [`packages/canvas/src/camera.ts`](packages/canvas/src/camera.ts) | 18 unit tests passing ([`packages/canvas/src/camera.test.ts`](packages/canvas/src/camera.test.ts)) with exact-number anchor fixtures | **PASS** |
| **B3 CI** | Isolated Zoom Guardrail | [`scripts/check-isolated-zoom.js`](scripts/check-isolated-zoom.js), [`scripts/check-isolated-zoom.test.ts`](scripts/check-isolated-zoom.test.ts) | Red Proof: [`camera-red.png`](camera-red.png) (Run `39407265890`)<br>Green Proof: [`camera-green.png`](camera-green.png) (Run `39408335765`) | **PASS** |
| **B4** | Overlay-Invariant E2E (Soul Test) | [`packages/canvas/src/renderer.ts`](packages/canvas/src/renderer.ts), [`packages/canvas/src/editor.ts`](packages/canvas/src/editor.ts) | Failing spec committed first (`2cc8a1c`); green in Chromium ([`packages/canvas/e2e/overlay-invariant.spec.ts`](packages/canvas/e2e/overlay-invariant.spec.ts))<br>Screenshots: [`overlay-0.2x.png`](overlay-0.2x.png), [`overlay-1x.png`](overlay-1x.png), [`overlay-5x.png`](overlay-5x.png) | **PASS** |
| **B5** | Registry Contract & Rect Plugin | [`docs/adr/ADR-005-registry.md`](docs/adr/ADR-005-registry.md), [`packages/canvas/src/registry.ts`](packages/canvas/src/registry.ts), [`packages/canvas/src/shapes/rect.ts`](packages/canvas/src/shapes/rect.ts) | Unit tests passing ([`packages/canvas/src/registry.test.ts`](packages/canvas/src/registry.test.ts)); Rect Tool E2E green ([`packages/canvas/e2e/rect-tool.spec.ts`](packages/canvas/e2e/rect-tool.spec.ts)) | **PASS** |
| **B5 CI** | Shape Branching Guardrail | [`scripts/check-no-shape-branching.js`](scripts/check-no-shape-branching.js), [`scripts/check-no-shape-branching.test.ts`](scripts/check-no-shape-branching.test.ts) | Red Proof: [`shapes-red.png`](shapes-red.png) (Run `39413262289`)<br>Green Proof: [`shapes-green.png`](shapes-green.png) (Run `39413525348`) | **PASS** |
| **B6** | Benchmark Spike | [`packages/canvas/e2e/benchmarks.spec.ts`](packages/canvas/e2e/benchmarks.spec.ts), [`docs/od-verification/2/benchmarks.md`](benchmarks.md) | Observations recorded in [`docs/od-spike-notes.md`](docs/od-spike-notes.md) (`SPK-001`); culling question in [`docs/od-questions.md`](docs/od-questions.md) (`Q-001`); **zero perf budgets claimed** | **PASS** |

---

## 3. Summary of Architectural Guardrails

The repository enforces six automated CI checks on every commit:
1. **Import Boundaries Check** ([`scripts/check-boundaries.js`](scripts/check-boundaries.js)): Strictly enforces one-way layered dependencies (`schema` $\to$ `canvas` $\to$ `semantics` $\to$ `markdown` $\to$ `studio`).
2. **Zero Runtime Dependencies Check** ([`scripts/check-dependencies.js`](scripts/check-dependencies.js)): Enforces `"dependencies": {}` across all workspace packages.
3. **DOM Canvas Bitmap Check** ([`scripts/check-no-bitmap.js`](scripts/check-no-bitmap.js)): Strictly forbids `getContext` in render paths. (Red/green proven in Phase 1.1).
4. **Camera Isolated Zoom Math Check** ([`scripts/check-isolated-zoom.js`](scripts/check-isolated-zoom.js)): Strictly isolates all screen $\leftrightarrow$ page coordinate scaling to `camera.ts`. (Red/green proven in Phase 2).
5. **No Shape Branching Check** ([`scripts/check-no-shape-branching.js`](scripts/check-no-shape-branching.js)): Forbids shape type branching (`shape.type === '...'`) outside individual shape plugins. (Red/green proven in Phase 2).
6. **Portable Documentation Links Check** ([`scripts/check-portable-links.js`](scripts/check-portable-links.js)): Ensures zero non-portable absolute file links exist in documentation.

---

## 4. Phase 2 Exit Checklist

- [x] B1–B6 all green, in order, each with cited evidence
- [x] Overlay-invariant E2E green (pixel + structural, flat + grouped shapes, 0.2×–5×)
- [x] All three CI fences (boundaries, camera-math, type-branching) live with red/green proofs
- [x] Registry ADR-005 committed; rect is a plugin; zero special cases
- [x] Benchmark observations recorded; **no perf budgets claimed anywhere**
- [x] All documentation links verified portable repo-relative paths
- [x] Questions log reviewed (`Q-001` culling threshold scheduled for Phase 2.x)
