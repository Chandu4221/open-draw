# OpenDraw Phase 2.x — Shape Expansion
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/phase-2x` → merge to `main` on exit
**Prerequisites:** `OPENDRAW.md`, ADR-001…005, Phase 2 REPORT (store/camera/registry/overlay-invariant all green)
**Terminology (binding):** DOM Canvas — shapes are real SVG/DOM elements; zero `getContext` in render paths.

## §0. FILE & MODULE DISCIPLINE (binding for the whole phase — "avoid god files")

- **No file > 300 lines** (tighter than the old 500 rule — this phase is where files balloon). No class > 200, no function > 50.
- **One shape = one directory**, mirroring the registry contract:
  ```
  packages/canvas/src/shapes/
    rect/          (index.ts, geometry.ts, render.ts, defs.ts, tests)
    ellipse/  note/  image/  text/  frame/  arrow/  ink/   (same layout each)
  capabilities/    (privileged capabilities — one directory each, none > 300 lines)
    text-editing/  connector/  clipping/
  ```
- The editor stays a **composition point**, never an accumulator: if a change adds a third `if` for a specific shape to `editor.ts`/`renderer.ts`, it belongs in the shape's definition or a capability module instead. The CI shape-branching fence is live — treat any urge to special-case as a design smell to re-route.
- If a file approaches 300 lines, split by responsibility (geometry vs render vs interaction) — do not "just add one more function."
- Add `scripts/check-file-sizes.js` (threshold 300 lines, exclude `*.spec.ts`/fixtures) to CI **at phase start**, with its own red/green proof (plant a 350-line file → CI red screenshot → revert → green screenshot).

## §1. STEP ONE — Q-001 culling stress spike (close it with data, don't guess)

Extend the existing benchmark harness (do not rewrite it):
1. Benchmarks at **2,000 / 5,000 / 10,000 simple shapes**: TTFF, drag blocking, pan fps at 1× — same clocks, same hardware notes.
2. Record the table in `docs/od-spike-notes.md` (append; never edit past entries).
3. Close Q-001 in `docs/od-questions.md` with the ruling: **culling threshold is measured from this data; the real trigger is complex shapes' node-per-shape ratio (frames/connectors/ink paths), revisit at first perf regression — not now.** Implement nothing.
- **Exit:** table committed, Q-001 marked resolved with evidence link, no culling code written.

## §2. THE SIMPLE SHAPES — ellipse, note, image (each: one commit, full gate each)

Per shape: geometry (pure fns + unit fixtures) → render → register via public API → tool wiring → E2E create/drag/undo → commit.

- **B2x.2 Ellipse:** ellipse inscribed in bounds; identical resize semantics to rect; geometry unit tests (rotation 0 only — rotation is a later phase).
- **B2x.3 Note:** fixed default size (e.g., 200×160 page units), a theme-token background, optional text props (text *rendering* only here; editing comes in §3), min-size clamp on resize.
- **B2x.4 Image:** `props.src` (dataURL only in v0.x) + `natural {w,h}`; drop-file handler (dragover/drop on the canvas host, create at drop point, dataURL read); paste-image from OS clipboard; unit-test the size-fitting logic (contain-fit inside drawn bounds).
- **E2E each** (`e2e/shapes.spec.ts`, one describe-block per shape): create via tool pointer events → select → drag (store coords delta exact) → undo (ONE transaction) → snapshot round-trip preserves shape. **Overlay-invariant extended:** every new shape type gets the slot-glued assertion (append overlay child, pan+zoom, ±1px) — the soul test covers all shape types forever.

## §3. PRIVILEGED CAPABILITY #1 — TEXT (editing mode) — B2x.5

1. `capabilities/text-editing/`: double-click on text/note → editor enters editing mode: positioned `<textarea>` overlay (HTML overlay *inside* the shape wrapper's overlay slot — glued by architecture, invariant applies), value seeded from props, caret/IME native — **the browser is the text engine; we own commit semantics only.**
2. Commit: blur or Escape → single transaction updating `props.text`; auto-grow bounds from textarea measurement; Enter = newline (commit stays on blur/Escape).
3. Empty text on commit → shape deleted (one transaction). If contentious → `od-questions.md`, don't invent.
4. **E2E gate (`e2e/text-editing.spec.ts`):** dblclick → type "Hello" → blur → props.text === "Hello", bounds grew; Escape mid-edit → unchanged, one undo entry for the whole gesture; invariant: label glued during edit AND after commit.
5. Editing-mode state is editor-owned, capability-scoped (`editor.mode === 'editing' | 'none'`) — never a shape-type check; fence stays green.

## §4. PRIVILEGED CAPABILITY #2 — FRAME (clipping) — B2x.6

1. `capabilities/clipping/` + `shapes/frame/`: frame = labeled resizable container; children = shapes whose stored parent equals frame id (ADR-002: explicit stored parent). Frame render = label (always-visible, in frame's overlay slot — invariant) + background + **SVG clipPath on the children layer** scoped to frame bounds.
2. Drop-time parenting (ADR-002): shape fully inside frame bounds (containment semantics: inclusive top-left, exclusive bottom-right) → suggest → auto-accept → store parent in child's `meta.parent` — written by the editor's suggestion mechanism; semantics layer reads it, canvas treats it as opaque.
3. Frame drag moves children in the same transaction; child dragged out of bounds does NOT auto-detach (no continuous recompute — ADR-002); explicit detach = user action (exact affordance TBD → record choice in questions doc).
4. Overlap tie-break: innermost (smallest area) frame wins — fixture: two overlapping frames, drop in intersection → parent = smaller frame.
5. **E2E gate (`e2e/frame.spec.ts`):** create frame → drop rect inside → `meta.parent` set → drag frame → child moved, ONE undo entry → child visually clipped at frame edge (screenshot) → parent delete → children orphan with event, no silent reparent → overlap fixture passes.

## §5. PRIVILEGED CAPABILITY #3 — ARROW (connector reconciliation) — B2x.7

The audit's sharpest point: **arrows are relations, never leaf shapes with denormalized endpoints.**
1. `capabilities/connector/` + `shapes/arrow/`: arrow props = `{ startBinding, endBinding }`, binding = `{ shapeId, anchor: 'top'|'right'|'bottom'|'left'|'center' }`. **No absolute endpoint coords in props, ever.** An unbound end may store a page point until bound.
2. Editor reconciliation: on any store diff touching a bound target → recompute rendered endpoints from the target's CURRENT bounds (schema geometry + anchor). **No stale detach is possible — there is nothing to go stale.**
3. Binding UX: drag endpoint within 12px (screen) of a shape → bind (snap indicator); drag away → unbind. Target deleted → unbind event + endpoint falls back to last-known page point; **never auto-delete the arrow.**
4. **E2E gate (`e2e/arrow.spec.ts` — the anti-stale-detach proof):** bind to rect → move rect 200px → endpoints follow (assert rendered path derives from target bounds, not stored coords) → delete rect → unbind event fires, arrow persists → undo → binding restored. Also: both ends bound to two shapes, move both, live reconciliation; arrow + invariant (label glued at path midpoint).

## §6. INK — B2x.8

1. `shapes/ink/`: draw tool → `props.pts` (flat float array, page space) — pointerdown starts, move appends, up commits; RDP simplification (epsilon 1.5 page units, pure function, reduction fixtures); render = single `<path>` from simplified points.
2. Pressure: store nothing in v0.x (constant-width per shape) — logged in questions doc as deferred (earlier ruling: defer variable width).
3. Highlighter variant = same geometry, theme alpha token, wide stroke.
4. **E2E gate (`e2e/ink.spec.ts`):** synthetic 20-move sine squiggle → shape exists, simplified count < raw; eraser deferred (next phase); invariant on ink (label glued); perf spot-check: 100 strokes initial render < 100ms (observation recorded, not a budget).

## §7. PHASE 2.x EXIT GATE

- [ ] Q-001 resolved with measured data; no culling code
- [ ] Ellipse, note, image, text, frame, arrow, ink — all registered via public API, zero type-branching (fence green)
- [ ] Three capabilities live: text editing (commit semantics proven), clipping (overlap fixture + orphan events), connector reconciliation (anti-stale E2E)
- [ ] Overlay-invariant extended to ALL shape types — one growing spec, green
- [ ] Per-shape E2E green in Chromium; screenshots per shape in `docs/od-verification/2x/`
- [ ] **No file > 300 lines** — `check-file-sizes.js` live in CI with red/green proof
- [ ] REPORT.md citing every claim; questions doc reviewed — every entry answered or scheduled, none silently dropped
- [ ] CI green end-to-end; merged to `main`

**Explicitly NOT in Phase 2.x:** eraser, selection handles/resize (Phase 2.y — from-scratch 8-handle system), rotation, z-order ops, themes beyond tokens needed by note/frame, `applyLayout`, any Studio/semantics/markdown work, any perf-budget claim.