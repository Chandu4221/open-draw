# OpenDraw Phase 5 — Patch Batch (§0) + Studio: The Real App
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/phase-5` → merge to `main` on exit
**Prerequisites:** Phase 4 passed (canvas@0.5.0; compiler live with golden fixtures; playground has tag panel + Compile). ADRs 001–006 in `docs/adr/`. `project-context/OPENDRAW-CONTEXT.md` is master context.
**Goal:** First §0 — fix the confirmed user-facing defects (tag panel unusable via mouse/keyboard, CI red on push, a11y violation) and install the two new process rules permanently. Then build Studio: the actual application — inspector, chips UI, persistence — the thing a real user does real work in.

**Rules in force:** small commits (`type(scope): what (phase.5.N)`) · TS strict, no `any` · **no file > 300 lines** · unspecified → `docs/od-questions.md`, never invention · every new check gets a red/green proof · public APIs frozen (golden snapshot; changes only via questions-doc + maintainer sign-off).

---

## §0. PROCESS RULES — EFFECTIVE IMMEDIATELY, PERMANENT

**§0.1 REAL-INPUT RULE (the "third-strike" rule).** The live-preview bug (2.z), the wheel-wiring gap (0.4.0), and the tag-panel focus bug (0.5.0) were all the same class: synthetic/programmatic tests passed while the real mouse/keyboard path was broken. Therefore:
- Every user-facing interaction's happy path gets at least ONE E2E test using real Playwright input (`page.click`, `page.fill`, `page.selectOption`, `page.press`, `keyboard.*`) — **never** `page.evaluate`-dispatched synthetic events.
- Synthetic dispatch remains legitimate ONLY for engine-level unit checks (store ops, camera math) where no user path exists.
- Existing E2E suites that use synthetic events on user-facing paths get migrated to real input as they are touched. Audit `tagging.spec.ts` and `compile`-related specs FIRST (this phase, §0.4).

**§0.2 CI-GREEN-BEFORE-PUSH RULE.** The maintainer reports running CI twice per push — agent pushes red, maintainer ferries errors back. Effective now:
- Before ANY push to any branch, the agent runs locally the FULL verification stack: `npm run verify` (all fences) + the complete Playwright matrix `--project=chromium --project=firefox --project=webkit` + typecheck + unit tests.
- A push that fails CI is a PROCESS FAILURE even if the fix is quick — the agent must report it as such in the questions log.
- Commit to this rule text in `OPENDRAW.md` (Working Rules section) and add a REPORT line certifying "full matrix passed locally before merge" for every phase from now on.
- If local matrix ≠ CI matrix results (env drift), record the divergence in spike notes and fix the drift, not the rule.

**§0.3 STRICT EDGE-CASE ENUMERATION.** For every feature built in this phase, the instructions below enumerate edge cases explicitly; each edge case gets its own assertion or test. No "it should handle edge cases" — NAME them, TEST them.

## §0.4 CONFIRMED DEFECT FIXES (user-reported; blocking)

1. **Tag panel unfocusable (critical, user-confirmed):** panel is mounted inside the canvas container in `playground.ts`; every pointerdown on the panel bubbles to the engine → selection clears → panel hides. FIX:
   - Mount panel to `document.body`, not the canvas container.
   - Defense-in-depth on panel root: `stopPropagation()` for `pointerdown`, `mousedown`, `wheel`, `keydown` — no container/document-level handler may ever eat panel interactions.
   - **Real-input E2E (replacing the synthetic-event tagging spec):** `page.click('#tag-panel-name')` → assert panel STILL visible, selection unchanged, focus in input → `page.fill` a name → blur → chip updates, one undo entry → `page.selectOption` type → chip updates. Keyboard path: Tab reaches panel inputs while a shape is selected, typing in name field does NOT trigger canvas shortcuts.
   - **Edge cases to assert:** click panel mid-gesture (panel must not break/desync the gesture) · panel open while shape deleted (panel closes cleanly, no stale shape ref) · select two shapes (panel hides — multi-select has no single semantics) · undo/redo with panel open (chip + panel agree) · panel open + Escape (cancels gesture, NOT the panel's focused input — assert Escape in input does not close panel or clear selection) · zoom while panel open (position stable, fixed).
2. **Compile modal same audit:** check mount target; if inside the container, same fix + same real-input spec (open modal → click inside → type → copy button works, canvas selection unaffected). Edge cases: modal open + Escape closes MODAL not canvas · compile twice → identical output (determinism visible) · scene with zero shapes → empty-state message, no crash.
3. **A11y select violation (CI-red, confirmed):** the tag panel's `<select id="tag-panel-type">` triggers axe `select-name` critical in CI. FIX: every form control in panel AND modal has an accessible name (aria-label or explicit label). **Find and fix every copy of the tag panel code** (the studio playground copy has aria-label; the a11y spec's target did not — deduplicate: one implementation, imported everywhere; copies of UI code are forbidden by this rule and recorded in questions doc). Add the tag-panel + modal states to the a11y spec's audited states (a11y gate now covers: panel open with selected shape, modal open). **Edge cases:** axe on panel open mid-gesture · axe with focus in name input · axe on modal with legend/design options.
4. **§0 exit checklist:** matrix green locally (per §0.2) BEFORE any push; all four defect fixes verified by real-input E2E; a11y spec green on 3 engines including new states; playground hand-verifiable (maintainer confirms focus works — REQUIRED maintainer gate, in checklist this time).

---

## §1. STUDIO — THE REAL APP

The playground proved the engine; Studio is where a person does a session of work. `apps/studio` becomes the application (React, per ADR: thin shell, zero business logic — all logic in the packages).

### §1.1 Inspector (the full panel — replaces minimal tag popover for real use)

1. **Fields per shape:** ID (read-only, copy button), name (validated, per ADR-006), type (dropdown from `SEMANTIC_TYPES` with inference provenance hint), **parent field** (dropdown: `none` + valid parents; excludes self + descendants — cycle-safe by construction, per ADR-002 amendment; hover on parent option highlights that frame on canvas, hover on canvas shape highlights parent field — hover-confirm both ways), **member list** when shape is frame/group (children with chips, click to select child), platform + style pickers (document-level, per Phase 3 data modules: web/android/flutter + neubrutalism; selecting style shows token preview swatches — read-only data display, no rendering logic in Studio).
2. **Multi-select state:** inspector shows count + shared actions (type applied to all via one transaction; parent field disabled with tooltip — batch re-parent is a questions-doc candidate, do NOT invent).
3. **Warning discipline implemented per ruling:** toast + inline Undo on delete group/frame (toast states cascade semantics: "Group deleted (3 shapes) — Undo"); NO modal for anything undo covers; modal reserved for clear-all.
4. **Real-input E2E + edge cases (full enumeration):** re-parent via inspector → canvas reflects (clip, descent) in one transaction, undo restores · cycle attempt (parent a frame into its own child) → typed error, dropdown disabled option, NO store mutation · rename mid-gesture → gesture unaffected · member list click mid-gesture → deferred or ignored safely (pick + record) · inspector reflects undo/redo exactly (no stale fields) · platform/style change → compile output Design Direction section changes accordingly · parent dropdown does NOT re-suggest geometric containment (explicit stored parents only — the anti-suggestion ruling; assert an overlapping-but-unparented shape never appears as parent default).

### §1.2 Chips UI (ADR-006 modes)

1. Mode toggle `always | hover (default) | off` in the toolbar; view state only (never persisted in scene — assert it does NOT appear in snapshot/compile output).
2. Selection always reveals chips of selected + its parent (per ruling). Chip truncation ~12 chars, full name on hover tooltip.
3. **Edge cases:** chip labels agree with inspector in every state (rename, undo, retag) · chips during zoom extremes (0.2×/5×) — readable, not clipped by the invariant rules · chips hidden per mode never leak into exportPNG unless `chips: true` explicitly (decoupling ruling asserted by byte-difference) · chip mode toggle mid-selection harmless.

### §1.3 Persistence + migrations

1. Document save/load: scene → JSON (schema types, versioned field), via the file system access API or download/upload in playground-parity manner — pick the simpler, record choice. Autosave to localStorage (debounced, non-blocking), load on open, "New" clears with clear-all modal (the ONE justified modal).
2. **Migrations:** snapshot carries `version`; a migration table (pure functions: old version → current) runs on load. Since format is young, ship v1 + the mechanism + a migration test that round-trips a v1 doc. Future format changes land as migrations, never breaking old docs — record as the persistence promise.
3. **Edge cases:** corrupt JSON → typed error + clean empty state, never white-screen · autosave mid-gesture (transaction never half-written — load after crash-test is consistent) · save with 200 shapes (perf observation, not budget) · version field unknown (future doc in old app) → explicit warning + best-effort load or refuse with message (pick + record).

### §1.4 Pipeline surfaced (production polish of Phase 4's wire)

Compile panel upgrades: legend + design direction toggles visible (ADR-006/Phase 4 options), output preview, copy, download `.md`. Edge cases: empty scene → friendly empty spec (not an error) · toggles change output deterministically (fixture asserts each toggle) · compile while gesture in-flight → compiles committed state only (never preview state — assert mid-gesture compile equals post-commit compile).

---

## §2. MECHANICS & GUARDRAILS

1. React in `apps/studio` only; packages stay framework-free (boundary fence extended: studio → all four packages, nothing imports studio).
2. Studio components thin: logic calls packages; a component file > 300 lines = split (fence extends to studio src).
3. Playground (gh-pages) continues to work and gains the inspector link ("Open Studio" or Studio replaces playground as the deployed page — maintainer decision, default: Studio becomes the deployed app, playground link kept for engine-focused demo; record decision).
4. Fences: all existing 10 + any new (studio boundary, persistence migration check if added — red/green proofs).
5. Public API: canvas@0.5.0 frozen; this phase adds NO public engine API (everything is app-layer). If a store gap blocks a feature → questions doc + snapshot process, never silent additions.

## §3. HOUSEKEEPING

1. `memory/progress.md` current after each milestone (not just at exit).
2. Questions doc: every edge-case ruling picked during §1 logged with date + reasoning (they are decisions).
3. Phase 4 REPORT prose fixes if any remain; verify none outstanding.

## §4. EXIT GATE

- [x] §0: all four defect fixes verified by REAL-INPUT E2E; a11y green on 3 engines incl. new states; §0.1/§0.2 rules committed to OPENDRAW.md; local matrix green before first push of this phase
- [x] §1.1 Inspector: full fields incl. parent + member list; cycle-safe dropdown; hover-confirm; provenance visible; edge-case suite green (esp. the anti-suggestion assertion + cycle rejection)
- [x] §1.2 Chips modes live, view-state-only proven by test
- [x] §1.3 Persistence: save/load/autosave + migration mechanism with test; corrupt-file and crash-mid-gesture edge cases green
- [x] §1.4 Compile panel with toggles + fixtures
- [x] All fences green with red/green proofs for any new; full matrix run locally and green BEFORE merge (certified line in REPORT)
- [x] REPORT.md in `docs/od-verification/5/`: every claim cited; edge-case table (enumerated case → test name → result); defect-fix table for §0
- [x] **Maintainer hand-test (REQUIRED, in checklist):** in Studio — click into inspector fields (focus works — the §0 bug class is dead) · re-parent via inspector · attempt cycle (blocked) · rename + retag + undo · toggle chip modes · save + reload (doc survives) · compile with legend + design direction · copy spec · ctrl+wheel zoom at cursor
- [x] Release: `@open-draw/canvas` unchanged (0.5.0) unless a defect fix required it — then through the audited process; studio is an app (not published); CI green end-to-end; merged to `main`

## §5. EXPLICITLY NOT IN PHASE 5

AI integration of the Export-for-AI flow (post-Studio, momentum-gated), crayon render style (pro candidate), culling, collab/CRDT, spec re-import (spike only per Phase 4), rich text, asset management, user-rebindable keymap UI (data-driven exists; UI later), multi-level group UI (v0.x = one level, frozen).

**After exit:** dogfood website (built via OpenDraw's own Export-for-AI flow + compiled spec → the self-referential launch asset) → demo GIF (draw→tag→compile in 20 seconds) → Reddit launch (all-MIT, momentum decides commercial question).