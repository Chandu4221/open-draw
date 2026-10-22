# Phase 2.y — Selection & Handles Verification Report

- **Repository:** `github.com/Chandu4221/open-draw`
- **Branch:** `build/phase-2y`
- **Exit Date:** 2026-10-22
- **Status:** PASS (All §0–§7 milestones verified, 38/38 Playwright E2E tests passing, 157/157 unit tests passing, all 7 guardrails green)

---

## 1. Executive Summary

Phase 2.y built the comprehensive interaction layer for OpenDraw:
1. **§0 Cleanup & Memory Alignment:** Deleted duplicate shape stubs, unified the store directory under `packages/canvas/src/store/`, aligned project memory.
2. **§1 Selection Model:** Multi-selection via `SelectionManager`, additive Shift-click, marquee drag with exact-intersecting ID set, group-aware click descent (first click selects root group, Shift/Ctrl descends directly), Tab z-order cycling, and Escape clearing. Selection visuals (bounding outline + handles) render inside the `od-overlay-slot`. Selection is strictly view state and does not create document undo transactions.
3. **§2 Keyboard Module:** Data-driven declarative keymap (`keymap.ts`), centralized dispatcher (`keyboard.ts`), and command registry (`commands.ts`). Complete shortcut set: tool shortcuts (`V`, `R`, `O`, `T`, `F`, `N`, `A`, `D`/`P`, `E`, `H`), selection shortcuts (Cmd/Ctrl+A, Esc, Tab), editing shortcuts (Delete/Backspace, Cmd/Ctrl+D, Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z), and z-order shortcuts (`]`, `[`, `Cmd+]`, `Cmd+[`). Rapid arrow nudges merge within a 500ms sliding window into a single undo entry. Keyboard commands automatically suspend while in text-editing mode. Zero-mouse golden-path verified.
4. **§3 8-Handle Resize & Rotate:** 8 cardinal and diagonal handles (`nw`, `n`, `ne`, `e`, `se`, `s`, `sw`, `w`) plus top rotate handle. Exact numerical resizing fixtures verified. Aspect ratio preserved with `ShiftKey`; symmetric resize from center with `AltKey`. Rotate handle supports smooth dragging with 15° snapping on Shift. Handles maintain constant screen-space pixel size across zoom levels (proven at 0.5× and 2× zoom) via isolated `1/camera.zoom` counter-scaling exemption. Rotated overlay slot invariant verified.
5. **§4 Z-Order Operations:** `bringForward`, `sendBackward`, `bringToFront`, `sendToBack` modify snapshot array order and DOM element order. Operations commit to history in a single undo transaction and maintain full shortcut support.
6. **§5 Gesture Re-Parenting (Closes Q-002):** Dragging a shape $> 12\text{px}$ screen-space outside its parent frame container detaches it (clearing `meta.parent` and emitting an orphan event). Dropping a shape fully inside a frame parents it to that frame, with smallest-area tiebreak on overlapping frames. Entire re-parent/detach gesture commits in a single undo transaction.
7. **§6 Stroke Eraser (Resolves Q-004):** `E` tool drag path intersection deletes intersected shapes on pointer-up in a single undo transaction. Live highlight (`.od-erase-target`, opacity 0.35) during gesture. Implements the frame-respecting rule: child shapes take priority (erasing child leaves parent frame intact; erasing empty header/padding deletes frame).

---

## 2. Deliverables & Verification Evidence

| Milestone | Scope | Implementation | Verification & Evidence | Status |
|---|---|---|---|:---:|
| **§0** | Cleanup & Store Unification | `packages/canvas/src/store/` | Duplicate shape stubs deleted, tests green | **PASS** |
| **§1** | Selection Model & Marquee | `packages/canvas/src/selection/` | E2E: `packages/canvas/e2e/selection.spec.ts`<br>Screenshot: `selection.png` | **PASS** |
| **§2** | Keyboard Module & Golden Path | `packages/canvas/src/input/` | E2E: `packages/canvas/e2e/keyboard-golden-path.spec.ts`<br>Screenshot: `keyboard-golden-path.png` | **PASS** |
| **§3** | 8-Handle Resize & Rotate | `packages/canvas/src/selection/` | E2E: `packages/canvas/e2e/handles.spec.ts`<br>Screenshot: `handles.png` | **PASS** |
| **§4** | Z-Order Operations | `packages/canvas/src/store/zorder.ts` | E2E: `packages/canvas/e2e/zorder.spec.ts`<br>Screenshot: `zorder.png` | **PASS** |
| **§5** | Gesture Re-Parenting | `packages/canvas/src/selection/reparent.ts` | E2E: `packages/canvas/e2e/reparent.spec.ts`<br>Screenshot: `reparent.png`<br>Closes `Q-002` | **PASS** |
| **§6** | Stroke Eraser | `packages/canvas/src/eraser/` | E2E: `packages/canvas/e2e/eraser.spec.ts`<br>Screenshot: `eraser.png`<br>Resolves `Q-004` | **PASS** |
| **§7** | Overlay Invariant | `packages/canvas/e2e/overlay-invariant.spec.ts` | Verified across pan, zoom, hierarchy, and rotation | **PASS** |

---

## 3. Verification Screenshots

- **Selection Model:** `docs/od-verification/2y/selection.png`
- **Keyboard Golden Path:** `docs/od-verification/2y/keyboard-golden-path.png`
- **Z-Order Operations:** `docs/od-verification/2y/zorder.png`
- **8-Handle Resize & Rotate:** `docs/od-verification/2y/handles.png`
- **Gesture Re-Parenting:** `docs/od-verification/2y/reparent.png`
- **Stroke Eraser:** `docs/od-verification/2y/eraser.png`

---

## 4. Mechanical CI Guardrails

The repository enforces seven automated CI checks on every commit:
1. **File Size Discipline** (`scripts/check-file-sizes.js`): Enforces $\le 300$ lines per source file. All source files within 300 lines limit.
2. **Zero Shape-Type Branching** (`scripts/check-no-shape-branching.js`): Forbids hardcoded `shape.type === '...'` outside shape definitions.
3. **Isolated Zoom Math** (`scripts/check-isolated-zoom.js`): Strictly confines coordinate transform math to `camera.ts` (with single audited counter-scaling exemption in `handlesView.ts`).
4. **DOM Canvas Bitmap Check** (`scripts/check-no-bitmap.js`): Strictly forbids `getContext` in render paths.
5. **Import Boundaries Check** (`scripts/check-boundaries.js`): Enforces one-way dependencies across packages (`studio` $\to$ `markdown` $\to$ `semantics` $\to$ `canvas` $\to$ `schema`) and within canvas (`packages/canvas/src/shapes/` and `capabilities/` import from `registry.ts` and `store/` — NOT vice versa).
6. **Zero Runtime Dependencies** (`scripts/check-dependencies.js`): Enforces empty dependencies across all workspaces.
7. **Portable Links Check** (`scripts/check-portable-links.js`): Enforces repo-relative paths in documentation.

---

## 5. Questions Log Review

All questions in `docs/od-questions.md` are answered and resolved:
- **`Q-001` (Culling Threshold):** Resolved with SPK-002 empirical stress data; zero culling code written.
- **`Q-002` (Explicit Child Detach):** Closed in Phase 2.y §5 via 12px screen detach threshold and drag-and-drop re-parenting with single undo transaction.
- **`Q-003` (Ink Pressure & Smoothing):** Resolved with v0.x constant width per stroke (`strokeWidth: 3` / `20`).
- **`Q-004` (Stroke Eraser Frame vs Child Resolution):** Resolved in Phase 2.y §6 via child priority rule. Erasing child shapes inside a container frame spares the parent frame; erasing empty header/interior padding deletes the container frame.

---

## 6. Phase 2.y Exit Checklist

- [x] §0 cleanup done; memory files updated to 2.y-next + master context referenced
- [x] Selection model green (marquee exact-id fixture, group logic, selection ≠ document state)
- [x] Keyboard module live: full shortcut set, nudge undo-merge, editing-mode suspension, keymap injectable; **keyboard-only golden-path E2E green (zero mouse events)**
- [x] 8-handle resize + rotate: exact-number fixtures green, per-shape resize via registry only, constant-size handles proven at 0.5×/2×
- [x] Z-order ops + shortcuts green
- [x] Gesture re-parenting green (Q-002 closed)
- [x] Stroke eraser green
- [x] Overlay-invariant extended to selection frame + handles — green
- [x] All existing guardrails still green (boundaries, deps, bitmap, links, zoom-math, type-branching, file-size)
- [x] REPORT.md in `docs/od-verification/2y/` citing every claim; screenshots per feature; questions doc reviewed — every entry answered or scheduled, none silently dropped
- [x] CI green end-to-end; ready to merge to `main`
