# OpenDraw — Phase 1.1 Patch + Phase 2 Instructions
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/phase-1.1` then `build/phase-2` → merge each to `main` on exit
**Prerequisite reading:** `OPENDRAW.md`, `docs/adr/ADR-001..004`, Phase 1 REPORT (context: the DOM Canvas thesis, guardrails, terminology)

**Terminology (binding):** "DOM Canvas" = our engine — every shape a real SVG/DOM element in one root `<svg>`; HTML `<canvas>` bitmap is the rejected alternative. Zero `getContext` in render paths.

**Rules in force:** small commits (`type(scope): what (phase.N.M)`) · TS strict, no `any`/`@ts-ignore` · no file > 500 lines · unspecified → `docs/od-questions.md`, never invention · API facts via 10-line spike → `docs/od-spike-notes.md` · every phase exits via checklist + REPORT.md citing evidence · CI green before every merge.

---

# PART A — PHASE 1.1 PATCH (small, do first, merge first)

**Goal:** close the three audit findings from Phase 1. ~Half a day.

### A1. Bitmap check gets its own red/green proof
The `check-no-bitmap.js` script has never been seen failing — same fence problem the boundary check had. Fix identically:
1. On the branch, plant `getContext('2d')` in `packages/canvas/src/` (any file).
2. Push → CI must go RED on "DOM Canvas Bitmap Check" → screenshot → `docs/od-verification/1.1/bitmap-red.png`.
3. Revert → green → screenshot → `docs/od-verification/1.1/bitmap-green.png`.
4. Also add a **Vitest unit test** that invokes the script against a fixture tree with a planted `getContext` and asserts exit code 1 (so the fence is regression-tested in CI even without a screenshot ritual).

### A2. REPORT.md links must be portable
Phase 1's REPORT.md uses `file:///home/chandra/...` links — dead on GitHub. Replace all file links with repo-relative paths (`docs/od-verification/1/ci-red.png`, `scripts/check-boundaries.js`, …). Sweep **all** docs for `file://` links; add a CI check: grep for `file://` in `docs/**` and `*.md` → fail if found (the evidence-must-be-portable rule, mechanized).

### A3. Studio shell consistency
`apps/studio`: add `lint` script (consistent with other packages), README stub stating it is private/non-published and inherits the repo MIT license.

### A4. Exit
- [ ] Bitmap red/green screenshots + unit test committed, test green
- [ ] Zero `file://` links repo-wide (CI check green)
- [ ] Studio consistency done
- [ ] `docs/od-verification/1.1/REPORT.md` — every item cited
- [ ] CI green, merged to `main`

---

# PART B — PHASE 2 — DOM CANVAS CORE (the engine's foundation)

**Goal:** store, camera, schema geometry, the registry contract, and the overlay-invariant E2E — the soul test green in a real browser. **Order is strict; each step's tests gate the next.**

## B1. Schema geometry core (`@open-draw/schema`)
- Pure functions (Node-testable, zero DOM): `boundsOf`, `boundsContain`, `boundsIntersect`, `boundsUnion`, `pointInBounds`, `boundsCenter`, `inflate`, `translateBounds`, and `Frame.contains(shape)` helpers needed later.
- Fixtures: axis-aligned cases, touching edges (boundary semantics: **containment is inclusive of top-left, exclusive of bottom-right** — pin this, it decides overlapping-frame tie-breaks), zero-area, negative input rejection (typed errors).
- Plus the structural types: `ShapeId`, `Bounds`, `Camera`, `Snapshot`, `ShapeRecord` (with opaque `meta`, `hidden`).
- **Exit:** unit tests green incl. boundary-semantics fixtures; REPORT cites them.

## B2. The store (`packages/canvas/src/store.ts`)
- Immutable shape records `{ id, type, x, y, rotation, hidden, meta, props }`; `createShape`, `updateShape`, `deleteShape`, `getShape`, `listShapes`.
- Transactions: `transact(fn)` — one undo entry per gesture; throw inside = nothing applied (atomicity test).
- Undo/redo stack with `canUndo/canRedo`; **one gesture = one transaction** (E2E will assert this).
- `getSnapshot()/loadSnapshot()` — validate against schema types, **typed errors on corrupt input**, and run registered meta-namespace validators (the `registerMetaNamespace` hook from ADR/spec v3 — store never *reads* meta, it validates at load).
- `listen(cb)` → `{ created, updated, deleted }` id sets.
- **Exit:** full unit suite green (round-trips, atomicity, undo/redo exactness, listener diffs, corrupt-snapshot typed errors); REPORT cites test names.

## B3. The camera (`camera.ts`)
- `{ x, y, zoom }`; `pageToScreen`, `screenToPage`, `zoomAroundPoint(screenPoint, factor)` (cursor-anchored zoom).
- Camera is state in the editor; root `<g transform="translate(x,y) scale(zoom)">` is its only consumer.
- **CI rule from day one:** grep for `* zoom` / zoom math outside `camera.ts` → fail (same enforcement style as the boundary check; add to `check-boundaries.js` or a new script).
- **Exit:** exact-number unit fixtures (zoom-around-point keeps the pointed page coordinate under the cursor, ±ε); CI rule live and proven by its own red/green (plant a `* zoom` in store.ts → red screenshot → revert).

## B4. THE OVERLAY-INVARIANT E2E — commit BEFORE the code that satisfies it
This is the suite's soul test. **Write and commit the failing spec first, then build until green.**

1. Playwright project (`packages/canvas/e2e/`, dev playground page mounting the editor — a plain page with a toolbar; `window.__od_debug__ = { editor }` in dev only).
2. Spec `e2e/overlay-invariant.spec.ts`:
   - create a rect via API; get its overlay slot via `editor.getOverlaySlot(id)`; append a `<text>OPENDRAW</text>` child at the shape's local top-left;
   - hard pan (±2000px), zoom 0.2×, zoom 5×, pan again, back to 1×;
   - after EVERY camera change: overlay `getBoundingClientRect()` top-left ≈ shape wrapper's top-left (±1px);
   - **structural assertion too:** the overlay slot is still the wrapper's last child and carries identity transform relative to the wrapper (assert via DOM inspection — no JS repositioning ever happened);
   - run the same assertions on a **nested-grouped** shape (hand-built group snapshot) and a **rotated** shape (once rotation lands; placeholder skip-until then).
3. Then: minimal renderer — canvas-owned wrapper `<g class="od-shape" data-id>` with overlay slot as **last child**, `render(shape)` inner-content contract (a stub rect first), keyed node reuse on diffs, camera transform on root group.
4. **Exit:** invariant spec green in Chromium at all zoom levels; the slot contract (identity transform, last child, `pointer-events: none`) asserted in the same spec; screenshots at 0.2×/1×/5× in `docs/od-verification/2/`.

## B5. Registry contract (paper first, then the API)
Before more shapes exist, write `docs/adr/ADR-005-registry.md` defining the **interaction & lifecycle contract** (the audit's finding — four functions are not enough):
- `ShapeDefinition<P>`: `type`, `defaultProps()`, `geometry { bounds, resize, hit }`, `render(shape, ctx) → inner content`, `doubleClick?`, `lockAspect?`
- Lifecycle: when is `render` called (mount + prop-diff), when re-created vs patched (keyed by id; `render` returns nodes; engine patches children — define whether definitions get `update(prevEl, shape)` or engine diffing; **decide and record**)
- Interaction surface: how a definition opts into pointer capture, keyboard, editor mode hooks; how the three **privileged capabilities** (text editing, connector reconciliation, clipping) attach WITHOUT shape-type checks anywhere (capability interfaces, not type strings).
- `editor.registerShape(def)` + `editor.setTool(toolId)` wiring a shape definition to a tool (one seam).
Then implement the registry API + register `rect` as the first plugin through it. **CI:** grep for shape-type branching (`shape.type === 'rect'` style) outside a shape's own module → fail (add to boundary script; red/green proof like the others).
- **Exit:** ADR-005 committed; rect registered via public API only; type-branch grep live + proven; rect E2E (create via tool, select, drag, undo one transaction) green.

## B6. Benchmark spike — BEFORE any perf budget enters docs
- Playwright-based harness measuring, on defined hardware (CI runner + one local machine, recorded): time-to-first-frame for 100/500/1000 simple shapes; per-frame main-thread block during drag of one shape among N; camera pan at 0.2×–5× with N on-screen.
- Results table → `docs/od-spike-notes.md` + `docs/od-verification/2/benchmarks.md`. **Numbers are observations, not budgets.** No budget is written anywhere until these exist. Note DOM node counts.
- **Exit:** benchmark doc committed with methodology (what clock: main-thread blocking + time-to-first-frame), numbers recorded, culling threshold decision recorded as a follow-up question in `od-questions.md` with the measured basis.

## B7. Phase 2 exit gate
- [ ] B1–B6 all green, in order, each with cited evidence in `docs/od-verification/2/REPORT.md`
- [ ] Overlay-invariant E2E green (pixel + structural, flat + grouped shapes, 0.2×–5×)
- [ ] All three CI fences (boundaries, camera-math, type-branching) live with red/green proofs
- [ ] Registry ADR-005 committed; rect is a plugin; zero special cases
- [ ] Benchmark observations recorded; **no perf budgets claimed anywhere**
- [ ] `build/phase-2` merged to `main`; REPORT cites every claim; questions doc reviewed (answer or schedule every entry — no silent drops)

**Explicitly NOT in Phase 2:** more shapes beyond rect (ellipse/text/frame/note/image/arrow/ink come in 2.x phases), handles/resize, culling implementation (design only, from B6 data), z-order, `applyLayout`, any Studio work, any perf-budget claim.