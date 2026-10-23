# Verification Report — Phase 0.3.0: Drag-to-Draw & Live Rendering

- **Target:** `@open-draw/canvas@0.3.0` (with `@open-draw/schema@0.1.0` unchanged)
- **Branch:** `main`
- **Date:** 2026-10-23
- **Status:** Complete & Verified Green (All 9 CI fences green, zero API drift, all 33 test suites passing)

---

## 1. Executive Summary & Goals

Phase 0.3.0 delivers major canvas interaction and visual feedback capabilities to `@open-draw/canvas`:
1. **Strict Drag-to-Draw Shape Creation:** Shape instantiation and DOM mounting are deferred until pointer travel exceeds 3px (`dist > 3`), preventing accidental shape insertion on clicks and keeping the store/history stack clean.
2. **60 FPS Live Rendering & 1-Step Undo:** Shapes and freehand ink paths update and mount in real-time as the cursor moves across the canvas, while intermediate states are transparently collapsed via `mergeLastHistoryEntry()`.
3. **Selection Outline Glitch Fix:** Eliminated unrotated browser focus-visible outlines on rotated shapes by tagging selected shapes with `.od-selected` and setting `outline: none !important`.
4. **Marquee Multi-Selection Crash Fix:** Added defensive bounds validation, fallback dimensions in `textGeometry`/`noteGeometry`, single-selection handle teardown, and default props merging.
5. **Zero Runtime Dependencies Preserved:** Strictly zero dependencies outside `@open-draw/schema`.
6. **Architectural Guardrails Intact:** Zero shape-type branching outside shape plugins, all source files under 300 lines limit, and 100% frozen public API surface.

---

## 2. Release Configuration & Packaging

### Package Release Configuration
- `packages/schema/package.json`: `version: "0.1.0"`, unchanged.
- `packages/canvas/package.json`: `version: "0.3.0"`, `dependencies: { "@open-draw/schema": "^0.1.0" }`.
- `publishConfig`: `{ "access": "public" }`.
- Workspaces `@open-draw/semantics`, `@open-draw/markdown`, and `@open-draw/studio` remain marked `"private": true`.

---

## 3. Verification Suite & Gates Summary

### Guardrail Verification (`npm run verify`)
1. `check:boundaries`: All one-way dependency rules satisfied.
2. `check:deps`: Zero forbidden runtime dependencies (dependencies: `{}`).
3. `check:bitmap`: Zero illegal occurrences of `getContext` in render paths.
4. `check:zoom`: Zero zoom math occurrences outside `camera.ts`.
5. `check:shapes`: Zero hardcoded shape-type branching outside shape plugins.
6. `check:filesize`: All source files within 300 lines limit (`interaction.ts` is 292 lines).
7. `check:links`: Zero non-portable absolute file-URI links in docs.
8. `check:public-api`: Public API exports match `docs/api-0.1.0.snapshot.json` exactly.
- **Unit Test Suites:** 33 passed (178 tests passed).
- **Vite Multi-Page Build:** Clean build of `index.html` and `playground/index.html`.
