# Progress & Milestones

## Completed (Initial Setup & Phase 1)
- [x] Initialized monorepo skeleton with npm workspaces (`packages/*`, `apps/*`).
- [x] Initialized Git repository on `main`.
- [x] Configured public GitHub repository and pushed initial commit.
- [x] Configured `NPM_TOKEN` repository secret.
- [x] Established persistent `memory/` tracking system.
- [x] Absorbed project constitution (`OPENDRAW.md`), v2 Spec Amendments, and Phase 1 Instructions.

---

## Phase 1 — Monorepo Foundation & Guardrails (Completed)
Target Branch: `build/phase-1` $\longrightarrow$ merged to `main` upon exit.

### Phase 1 Punch List:
- [x] **Step 0 — Commit Constitution & ADRs**:
  - [x] Commit `OPENDRAW.md` to repo root (`5c8fc7c`).
  - [x] Commit 4 ADRs to `docs/adr/` (`ADR-001-rendering.md`, `ADR-002-parenting.md`, `ADR-003-grouping.md`, `ADR-004-responsive.md`).
  - [x] Commit `docs/od-questions.md` and `docs/od-spike-notes.md`.
- [x] **Step 1 — Root `package.json` Cleanup**:
  - [x] Set `"type": "module"`, `"license": "MIT"`, remove scaffold leftovers (`7b9a6bd`).
  - [x] Add scripts (`typecheck`, `test`, `build`, `lint`, `verify`).
  - [x] Add root devDependencies (`typescript`, `vitest`, `esbuild`, `vite`, `@playwright/test`, `publint`).
- [x] **Step 2 — License**:
  - [x] Commit MIT full text to root (`LICENSE`) with copyright `2026 Chandra Shekhar` (`ab5b560`).
- [x] **Step 3 — 5 Packages Scaffolding**:
  - [x] `@open-draw/schema` (new package: `Bounds`, `ShapeId`, `boundsContain` + smoke test).
  - [x] `@open-draw/canvas` (updated with strict tsconfig, smoke test, README).
  - [x] `@open-draw/semantics` (updated with strict tsconfig, smoke test, README).
  - [x] `@open-draw/markdown` (updated with strict tsconfig, smoke test, README).
  - [x] `@open-draw/studio` (`apps/studio` — renamed from `apps/open-draw`, smoke test, README).
  - [x] Verified each has `dependencies: {}`, `publishConfig: { access: public }` (`60db3c6`).
- [x] **Step 4 — CI (`.github/workflows/ci.yml`)**:
  - [x] Run typecheck, test, build on PR and push to `main` and `build/**`.
  - [x] Enforce import boundaries (`studio -> *`, `markdown -> semantics/schema`, `semantics -> schema`, `canvas -> schema`, `schema -> none`).
  - [x] Enforce zero runtime dependencies (`dependencies: {}`).
  - [x] Enforce zero tolerance bitmap check (grep `getContext` in `packages/canvas/src`).
  - [x] Removed `publish.yml` until Phase 2 (`785c12e`).
- [x] **Step 5 — The Red/Green Boundary Proof**:
  - [x] Deliberate violation commit (`semantics` imports `canvas`) $\to$ verified CI RED in GitHub Actions run `39398304246` $\to$ saved screenshot `docs/od-verification/1/ci-red.png` (`f7598aa`).
  - [x] Reverted violation $\to$ verified CI GREEN in GitHub Actions run `39398686496` $\to$ saved screenshot `docs/od-verification/1/ci-green.png` (`77ace07`).
- [x] **Step 6 — REPORT.md & Phase Exit**:
  - [x] Complete `docs/od-verification/1/REPORT.md` with evidence citations for every checklist item (`0f1e2c6`).
  - [x] Merge `build/phase-1` $\to$ `main`.

---

## Phase 1.1 Patch (Completed)
Target Branch: `build/phase-1.1` $\longrightarrow$ merged to `main` upon exit (`a92d354`).
- [x] Item A1: Bitmap check red/green proof (`bitmap-red.png`, `bitmap-green.png`) and Vitest unit test (`scripts/check-no-bitmap.test.ts`).
- [x] Item A2: Portable links check (`scripts/check-portable-links.js`) active in CI, zero file-scheme links in docs.
- [x] Item A3: Studio shell consistency (lint script, private README).
- [x] Item A4: `docs/od-verification/1.1/REPORT.md` complete, merged to `main`.

---

## Phase 2 — DOM Canvas Core (Completed)
Target Branch: `build/phase-2` $\longrightarrow$ merged to `main` upon exit (`3c504af`).
- [x] **Step B1 — Schema Geometry Core**: Pure functions, boundary semantics (inclusive top-left, exclusive bottom-right), 28 unit tests.
- [x] **Step B2 — Canvas Store**: Immutable shapes, transactions with rollback, undo/redo, snapshot validation, 9 unit tests.
- [x] **Step B3 — The Camera**: Coordinate transforms, cursor-anchored zoom, isolated zoom math guardrail with red/green proof (`camera-red.png`, `camera-green.png`).
- [x] **Step B4 — Overlay-Invariant E2E (Soul Test)**: Failing spec committed first (`2cc8a1c`), `SVGRenderer` implemented, passes in Chromium at 0.2×, 1×, 5× with identity transform and pointer-events none asserted (`overlay-0.2x.png`, `overlay-1x.png`, `overlay-5x.png`).
- [x] **Step B5 — Registry Contract & Rect Plugin**: ADR-005, pluggable `rect` plugin, shape-type branching guardrail with red/green proof (`shapes-red.png`, `shapes-green.png`), rect E2E passing.
- [x] **Step B6 — Benchmark Spike**: Measured TTFF, drag block, and pan across 100/500/1000 shapes in `docs/od-verification/2/benchmarks.md`; zero perf budgets claimed; culling question `Q-001` scheduled.
- [x] **Step B7 — Phase 2 Exit Gate**: `docs/od-verification/2/REPORT.md` complete, instructions renamed to `opendraw-phase1-1 phase2-done.md`, merged to `main`.

---

---

## Phase 2.x — Shape Expansion & Privileged Capabilities (Completed)
Target Branch: `build/phase-2x` $\longrightarrow$ merged to `main` upon exit (`10ad480`).
- [x] **§0 File & Module Discipline**: Source files $\le 300$ lines, CI check with red/green proofs (`filesize-red.png`, `filesize-green.png`).
- [x] **§1 Q-001 Culling Stress Spike**: Measured 2k/5k/10k shapes in `docs/od-spike-notes.md` (`SPK-002`); Q-001 resolved with zero culling code.
- [x] **§2 Simple Shapes**: Ellipse, note, image plugins with full E2E gates, overlay invariant extended.
- [x] **§3 Privileged Capability #1 (Text Editing)**: Native textarea overlay in foreignObject, blur/escape commit semantics.
- [x] **§4 Privileged Capability #2 (Frame & Clipping)**: Container clipping via SVG clipPath, geometric parenting, smallest-area tie-break.
- [x] **§5 Privileged Capability #3 (Arrow Reconciliation)**: Relational connectors with zero absolute bound coordinates, anti-stale dynamic recomputation.
- [x] **§6 Ink & Highlighter**: Freehand drawing with RDP simplification ($\epsilon=1.5$), highlighter variant, constant width per stroke.
- [x] **§7 Exit Gate**: `docs/od-verification/2x/REPORT.md` complete, instructions renamed to `opendraw-phase2-x-done.md`, merged to `main`.

---

## Phase 2.y — Selection & Handles (Completed)
Master Context: [`project-context/OPENDRAW-CONTEXT.md`](../project-context/OPENDRAW-CONTEXT.md).
Target Branch: `build/phase-2y` $\longrightarrow$ merged to `main` upon exit.
- [x] **§0 Housekeeping & Directory Cleanup**: Delete duplicate shape stubs, unify `store/` directory, update memory files.
- [x] **§1 Selection Model**: Multi-selection, click, Shift-toggle, marquee intersection, group descent, z-order cycling.
- [x] **§2 Keyboard Module**: Keymap table, dispatcher, nudge undo-merge, duplicate, zoom shortcuts, keyboard-only golden-path E2E.
- [x] **§3 8-Handle Resize & Rotate**: Pure math, unit fixtures, 8 handles + rotate, constant screen-size counter-scaling at 0.5×/2×.
- [x] **§4 Z-Order Operations**: `bringForward/sendBackward/bringToFront/sendToBack` store operations and keyboard shortcuts.
- [x] **§5 Gesture Re-Parenting**: Drag out of frame past threshold detaches (closes Q-002); drop in frame reparents; inter-frame drag.
- [x] **§6 Stroke Eraser**: `E` tool drag path intersection, live highlight, single transaction deletion (resolves Q-004).
- [x] **§7 Exit Gate**: `docs/od-verification/2y/REPORT.md` complete, all guardrails green, merged to `main`.

---

## Phase 2.z & Releases (Completed)
- [x] `@open-draw/canvas@0.1.0` SDK Freeze (`docs/od-verification/0.1.0/REPORT.md`).
- [x] `@open-draw/canvas@0.2.0` Hardening & a11y (`docs/od-verification/0.2.0/REPORT.md`).
- [x] `@open-draw/canvas@0.3.0` Drag-to-Draw, Floating Dock, Marquee multi-selection, Clean Hero Welcome (`docs/od-verification/0.3.0/REPORT.md`).
- [x] `@open-draw/schema@0.2.0` & `@open-draw/canvas@0.4.0` Identity, Parenting & Group Semantics (`docs/od-verification/0.4.0/REPORT.md`).

---

## Phase 3 — Semantics: The Meaning Layer (Completed)
Master Context: [`project-context/OPENDRAW-CONTEXT.md`](../project-context/OPENDRAW-CONTEXT.md).
Target Branch: `build/phase-3` $\longrightarrow$ merged to `main` upon exit (`bd1c407`).
- [x] **§6 Housekeeping**: Split `interaction.ts` (293 $\to$ 209 lines) into `interaction/creation.ts` and `interaction/ink.ts`.
- [x] **§0 ADRs**: Author `ADR-006-identity-naming.md`; amend `ADR-002` (parenting cycle check) and `ADR-003` (group semantics).
- [x] **§0 Schema ID & Validators**: Implement 29-char alphabet ID generator and validators in `@open-draw/schema`.
- [x] **§0b Store Cycle Prevention**: Mandatory `CycleDetectedError` on `setParent()` and group deletion/ungroup semantics.
- [x] **Boundary Fence**: Extend boundary rules to verify `@open-draw/semantics` isolation and ban `breakpoint` in canvas.
- [x] **§1 Type Vocabulary**: Semantic type definitions data table and pure `validateSemantics()`.
- [x] **§2 Smart Defaults**: Pure `inferType()` rule table and trust-gate E2E Soul Test (`retag-then-resize never re-types`).
- [x] **§3 Responsive Derivation**: Pure `derive(scene, breakpoint)` for content width reflow.
- [x] **§4 Platform & Style Profiles**: `web`, `android`, `flutter` profiles and `styles/neubrutalism.ts` design tokens.
- [x] **§7 Exit Gate**: `docs/od-verification/3/REPORT.md`, instructions renamed to `opendraw-phase3-done.md`, merged to `main`, published `@open-draw/schema@0.2.0` and `@open-draw/canvas@0.4.0`.

---

## Phase 4 — Input Repair & The Markdown Compiler (Completed)
Target Branch: `build/phase-4` $\longrightarrow$ merged to `main` upon exit.
- [x] **§0.1 Engine Fix**: Wheel zoom & pan input repair (`{ passive: false }`, zoom at cursor, pan on wheel, Shift+wheel horizontal pan, middle-click drag-pan, `e2e/wheel.spec.ts`).
- [x] **§0.2 Tag Affordance**: Minimal human tagging popover in playground (`PlaygroundTagPanel`, read-only `#x7q` ID, name input, type dropdown, provenance hint).
- [x] **§1 The Compiler**: `@open-draw/markdown` pure deterministic compiler (`compile()`, byte-pinned golden fixtures, legend, design direction).
- [x] **§2 Integration**: Playground compile action with copyable spec modal (`PlaygroundCompileModal`).
- [x] **§3 Housekeeping & Fences**: Q-008 documented, boundary fence bans `compile` in canvas, all 10 guardrails green, `docs/od-verification/4/REPORT.md`.

---

## Phase 5 — Input/A11y Patch Batch (§0) + Studio The App (§1) (Completed)
Target Branch: `build/phase-5` $\longrightarrow$ merged to `main` upon exit.
- [x] **§0 Patch Batch**: Tag panel & compile modal focus/bubbling repair, a11y `label-content-name-mismatch` / `select-name` resolution across 8 states, `OPENDRAW.md` rules §0.1 (Real-Input Rule) and §0.2 (CI-Green-Before-Push Rule), Q-009 logged.
- [x] **§1 Studio Application**:
  - [x] Full Inspector panel (`#studio-inspector`) supporting single shape and multi-select batch typing.
  - [x] Cycle-safe Parent dropdown with anti-suggestion ruling (no default to geometric overlap).
  - [x] Container member list with direct selection jump.
  - [x] Document settings (Web / Android / Flutter, Neubrutalism design style with swatches) persisted into `Snapshot.meta` and integrated into compiler.
  - [x] View-state Chips (`always | hover | off`), label truncation to ~12 chars (`#id ${truncatedLabel}`), full tooltip title.
  - [x] Schema `version: 1` pure `MIGRATION_TABLE` and `AutosaveManager` debounced at 300ms.
  - [x] Accessible `ClearCanvasModal` and `ToastManager` with inline Undo action.
- [x] **§4 Exit Gate**: Full verification suite green (230 unit tests, 92 Chromium E2E, 91 Firefox E2E, all 9 architectural fences), `docs/od-verification/5/REPORT.md`.

---

## Phase 5 §7 Amendment — Content Depth + Repair Batch (Completed)
Target Branch: `build/phase-5.7` $\longrightarrow$ merged to `main` upon exit.
- [x] **§7.1 Semantic Vocabulary Research Pass**:
  - [x] Cross-framework survey (Tailwind, MUI, Chakra, Ant Design, HTML5) documented in `docs/od-spike-notes.md` (`SPK-005`).
  - [x] Added 14 convergent semantic types (`footer`, `input`, `select`, `checkbox`, `toggle`, `badge`, `avatar`, `list`, `table`, `tabs`, `divider`, `modal`, `tooltip`, `alert`) to `SEMANTIC_TYPES`.
  - [x] Added $3\times$ platform mappings (Web semantic HTML, Android Compose, Flutter Material 3).
  - [x] Smart default rules (`thin-rect-divider`, `bottom-rect-footer`).
  - [x] Kitchen-sink fixture (`kitchen-sink-v1.1.md`) verified across all 3 platforms.
- [x] **§7.2 Selection-Scoped Compile**:
  - [x] `CompileOptions.shapeIds` compiling named sub-scene only.
  - [x] Unselected children omitted without warning (`Q-012`).
  - [x] Sub-tree shapes with unselected parents root cleanly in structure.
  - [x] Scope auto-deduction: `page` if contains `page`-typed shape, else `component` (`Q-013`).
  - [x] Studio modal "Selection only" toggle with selection sensitivity.
  - [x] Byte-stable golden fixture (`selection-compile-v1.1.md`).
- [x] **§7.3 Structure Tree Tab**:
  - [x] Stored `meta.parent` hierarchy rendered in Inspector "Structure" tab with `#id`, names, and untagged badges.
  - [x] Bidirectional sync: tree click $\to$ canvas select + camera smooth pan; canvas select $\to$ tree node highlight.
  - [x] Context menu: "Reveal on canvas" and "Copy ID".
- [x] **§7.4 Responsive Readout in Inspector**:
  - [x] Live `derive()` projection for container shapes only (`Q-015`).
  - [x] Empty container notice: "no children — nothing to reflow".
  - [x] Hidden for leaf shapes.
- [x] **§7.5 Grow-On-Assign Repair**:
  - [x] Auto-grow parent frame bounds to union bounds on explicit assign with ancestor frame cascade in single atomic store transaction (`Q-014`).
  - [x] Reversible: single undo reverts both growth and parent assignment.
  - [x] Moving child within existing parent does not grow frame.
  - [x] Inspector parent select hover-confirm highlight (`.od-parent-hover-highlight`).
- [x] **§7.6 Scope Pass-Through Verification**:
  - [x] Studio compile modal preview confirms Scope block in auto mode and manual selection.
- [x] **§7.7 Housekeeping & Gates**:
  - [x] All 8 architectural fences pass (`npm run verify`).
  - [x] 47 test files / 258 unit tests passing (100%).
  - [x] 26 Playwright E2E spec files / 106 tests passing in Chromium, 34/34 passing in Firefox.
  - [x] All source files strictly $\le 300$ lines. Zero runtime dependencies.
  - [x] `docs/od-questions.md` (`Q-012`, `Q-013`, `Q-014`, `Q-015`), `docs/od-spike-notes.md` (`SPK-005`), `docs/od-verification/5/REPORT.md` Section 7 updated.

---

## Active / Upcoming Phase
- **Phase 6**: Suite Publication & Integration.


