# OpenDraw Phase 2.z — Live-Preview Repair & Interaction Performance
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/phase-2z` → merge to `main` on exit
**Prerequisites:** `OPENDRAW.md`, `project-context/OPENDRAW-CONTEXT.md`, ADR-001…005, Phase 2.y REPORT (selection/handles/keyboard all green)
**Trigger (user-reported, reproduced in playground):** resize and rotate gestures do not track the pointer — the shape updates only on mouse release. Drag-move, buttery-smoothness, and all gesture live-previews must be repaired before SDK freeze.

**Terminology (binding):** DOM Canvas — shapes are real SVG/DOM elements; zero `getContext` in render paths.

**Rules in force:** small commits (`type(scope): what (phase.2z.N)`) · TS strict, no `any`/`@ts-ignore` · **no file > 300 lines**, class ≤200, fn ≤50 · editor = composition point · unspecified → `docs/od-questions.md`, never invention · every new guardrail gets a red/green proof · **perf numbers are observations until measured, budgets only after declared.**

**Phase discipline — HARD ORDER: §0 correctness is a blocking gate. No §2 performance work begins until mid-gesture tracking is green in the browser. A fast gesture that doesn't track the pointer is still a broken gesture.**

---

## §0. LIVE-PREVIEW REPAIR (correctness — blocking gate)

The 2.y E2E asserted final bounds only; nothing asserted intermediate frames. Result: gestures that are mathematically correct but visually frozen until commit. This section makes the shape follow the pointer continuously and makes that a permanent tested guarantee.

1. **Gesture state machine (editor-owned, one module ≤300 lines):**
   - pointerdown on shape (move) / handle (resize) / rotate handle (rotate) → editor enters gesture mode
   - pointermove updates an **in-flight preview state** (target bounds/rotation for the gesture)
   - the renderer paints the preview **live on every pointermove** (subject to §2.1 rAF batching once §2 begins — but the paint must happen per frame, not per gesture)
   - pointerup converts the final preview state into the ONE store transaction (undo discipline from 2.y unchanged: one undo entry per gesture)
   - Escape during gesture = cancel: preview discarded, shape unchanged, no transaction
2. **Mid-gesture tracking for all three gestures:** move, resize, rotate — the shape (and its selection frame + handles) must visually track the pointer continuously through the gesture.
3. **Live rotation preview:** the snap rule applies visually *during* the drag (shape visually snaps while rotating), not only at commit.
4. **All gestures consistent:** marquee (rectangle live), eraser (live `.od-erase-target` highlight already exists — verify it tracks every frame), re-parent drag (shape + frame highlight live), zoom (already live — verify). One gesture-state module governs all; no per-gesture special casing outside their own modules (type-branching fence applies).
5. **NEW ASSERTION CLASS — mid-gesture sampling E2E (`e2e/live-preview.spec.ts`), permanent regression fence:**
   - start a resize, `page.mouse.move` to the geometric midpoint of the gesture → **assert the shape's rendered bounds ≈ the intermediate value (±1px)** → continue to end → release → assert final bounds
   - same midpoint assertion for move (shape center ≈ pointer midpoint ±1px) and rotate (intermediate angle ±1°)
   - assert the selection frame + handles track the shape at the midpoint too (overlay invariant extended to in-flight gestures)
   - assert Escape mid-gesture cancels cleanly: bounds unchanged, zero new undo entries
   - assert pointerup commits exactly ONE undo entry
6. **Playground stays the reproduction tool:** the user's repro command (`npx vite --config packages/canvas/e2e/playground/vite.config.ts packages/canvas/e2e/playground`) must show all gestures tracking live before §0 is declared done. Record a verification note (screenshots at gesture midpoints optional but encouraged in the phase REPORT).

**§0 exit:** all three gestures track live in the playground + `live-preview.spec.ts` green + invariant suite green. Then and only then, §1.

---

## §1. INSTRUMENT BEFORE FIXING (no fixes until the profile exists)

Our previous clocks measured store operations (<0.01ms updateShape) — not the input→paint pipeline. That blind spot is why "measured great" shipped with "feels laggy." This phase defines the missing clock.

1. **Frame-telemetry harness** (`packages/canvas/src/perf/`, ≤300 lines, dev-only, tree-shaken from dist or behind a flag — no runtime cost in the public SDK):
   - `PerformanceObserver` longtask entries during gestures
   - input→paint latency: mark on pointermove event, measure to next paint (via `requestAnimationFrame` timestamp delta)
   - event-handler duration: time around the editor's own pointermove processing
   - FPS counter during a sustained gesture
2. **Production baseline first:** `vite build && vite preview` of the playground (dev-mode numbers are invalid; record both if useful, but the baseline is production). Baseline sessions: 10s drag-move with 100 shapes, resize, rotate, pan at 1×, all recorded to `docs/od-spike-notes.md` (append; never edit past entries).
3. **Profile the chain:** for the slowest gesture, break latency into: event dispatch → editor processing → DOM write → style/layout → paint. Identify the dominant cost BEFORE choosing fixes. Record which §2 hypothesis the data supports.
4. **Hardware honesty:** record the testing machine specs (CPU/RAM/browser) as in prior benchmark reports — observations, not budgets.

**§1 exit:** baseline tables committed; the dominant cost identified with data; fix order chosen by evidence.

---

## §2. PERFORMANCE FIXES (hypotheses — apply only the ones the §1 profile supports; measure before/after each)

Each fix = one commit + before/after numbers in the commit body or spike notes. If the profile shows a hypothesis is NOT the problem, record that finding and skip it — no speculative complexity.

1. **rAF input batching:** pointermove events fire faster than frames; coalesce to ONE preview update per animation frame (latest event wins). Keep total input→paint latency ≤ one frame. (This must not reintroduce §0's bug — batching the *update* is fine; the paint still happens every frame.)
2. **Transform-only preview writes:** during gestures, preview position/rotation via a single `transform` on the shape's wrapper (compositor path, no layout-triggering attributes). Commit still writes real bounds to the store as today.
3. **Read/write phase separation:** all geometry reads (getBoundingClientRect etc.) happen first, then all DOM writes — no interleaved synchronous layout thrash. Audit the handles/selection overlay tracking as the prime suspect.
4. **Overlay sync:** selection frame, handles, and chips update on the SAME rAF tick as the shape — never a frame behind (one-tick lag reads as "detached", our soul bug's cousin).
5. **`will-change: transform`** applied to the gesture target on gesture start, removed on gesture end (hint only during active gestures; never persistent).
6. **Renderer gesture-path audit:** confirm per-gesture DOM work is O(1) relative to scene size (one wrapper patched, not a scene-wide diff per frame). If the diff is scene-wide per pointermove, scope it down — this is the one fix most likely to matter at high shape counts.

---

## §3. CLOCKS, BUDGETS, AND THE FENCE

1. **New defined clock (permanent):** *input→paint latency per frame during an active gesture* — distinct from store-op duration, which remains the old clock. Both documented in the perf notes with exact definitions.
2. **Observation → budget process:** after §2 fixes, measure: 60fps-sustained drag with 100 and 500 shapes at 1× (reference hardware, production build). If numbers justify it, DECLARE a budget in the REPORT (e.g. "drag ≤ 16ms input→paint at 500 shapes on reference i5") — explicitly marked as the suite's first declared perf budget. If numbers don't justify a budget, record observations and defer.
3. **Perf regression fence:** the telemetry harness runs in CI: a gesture-latency test fails if input→paint exceeds threshold (threshold = declared budget, or a conservative multiple of the measured baseline if no budget). **Red/green proof required:** deliberately introduce a per-pointermove full-scene re-render (or sleep) → CI red screenshot → revert → green screenshot.
4. **All existing fences stay green:** boundaries, deps, no-bitmap, portable links, zoom-math, type-branching, file-size.

---

## §4. HOUSEKEEPING (from the 2.y audit)

1. **2y REPORT prose fix:** §4's import-boundary description garbles the arrows (says "schema → canvas → semantics → markdown → studio"). Correct prose: studio → canvas, semantics, markdown, schema; markdown → semantics, schema (types only); semantics → schema; canvas → schema; schema → nothing. The script was always correct; fix the text. Same correction anywhere else the prose arrows are wrong.
2. **Rotate-snap deviation:** 2.y implemented 15° snap while Shift is held; the 2.z spec source said 0/45/90° snap within 5°, Shift = free rotation. Either (a) accept the 15°-on-Shift behavior and record the ruling in `docs/od-questions.md` as accepted-with-reason, or (b) revert to spec. Maintainer preference may decide; log it either way.
3. Questions doc reviewed at exit: every entry answered or scheduled with a date, none silently dropped.

---

## §5. PHASE 2.z EXIT GATE

- [x] **§0: all gestures (move, resize, rotate, marquee, re-parent) track the pointer live — verified in the playground by a human** + `live-preview.spec.ts` green with midpoint assertions + Escape-cancel clean
- [x] §1: production-build baseline recorded in spike notes; dominant cost identified with data
- [x] §2: applied fixes have before/after measurements; skipped hypotheses have recorded reasons
- [x] §3: input→paint clock defined; budget declared only if measured to justify; regression fence live in CI with red/green proof
- [x] §4: 2y report prose corrected; rotate-snap ruling logged; questions doc clean
- [x] All 7 existing guardrails green + new perf fence green (with its red/green proof)
- [x] REPORT.md in `docs/od-verification/2z/` citing every claim (one uncited claim = redo); hardware specs recorded; walkthrough verification note from the maintainer's own playground session
- [x] CI green end-to-end; merged to `main`

**Explicitly NOT in Phase 2.z:** exportPNG, culling (still deferred, measured trigger), styles/crayon (post-SDK extension candidate), any semantics/markdown/Studio work, camera rotation, firefox/webkit E2E (that's 0.2.0 hardening), any new shapes.

**After exit:** SDK freeze → `@open-draw/canvas@0.1.0` (first public artifact, all-MIT) → 0.2.0 hardening (firefox/webkit, a11y audit, leak tests) → Phase 3 semantics (ADR-006 first) → Phase 4 markdown → Phase 5 Studio → dogfood website → launch.