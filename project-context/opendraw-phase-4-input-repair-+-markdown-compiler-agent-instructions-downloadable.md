# OpenDraw Phase 4 — Input Repair (§0) + The Markdown Compiler
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/phase-4` → merge to `main` on exit
**Prerequisites:** Phase 3 passed and released (schema@0.2.0, canvas@0.4.0); 10 fences green; `project-context/OPENDRAW-CONTEXT.md` is master context; ADRs 001–006 in `docs/adr/`.
**Goal:** First: repair two confirmed user-facing gaps (wheel zoom never wired; no human tagging UI). Then: build the meaning→spec leg — `@open-draw/markdown`, the byte-stable compiler that produces the document an AI (or human) can build from.

**Rules in force:** small commits (`type(scope): what (phase.4.N)`) · TS strict, no `any` · **no file > 300 lines** · unspecified → `docs/od-questions.md`, never invention · every new check gets a red/green proof · canvas public API frozen (golden snapshot; additions via §0 wheel events ONLY with snapshot update + questions-log entry) · phase discipline per §9 of Phase 3 instructions (patch-flow exception for single-commit fixes, same-day logged).

---

## §0. INPUT REPAIR (blocking gate — before any compiler work)

**§0.1 Wheel zoom — the engine fix (user-confirmed bug: Ctrl+scroll currently zooms the BROWSER; no wheel handler exists anywhere).**

1. `PointerInteractionController.attach()` adds a `wheel` listener on the container with **`{ passive: false }`** — MANDATORY; Chrome defaults wheel listeners to passive and silently drops `preventDefault()`, reproducing this exact bug one level down. A CI-searchable note or check for this is encouraged (e.g. grep for `addEventListener('wheel'` verifying the third-arg presence — optional fence, red/green if added).
2. Behavior (standard Figma/tldraw conventions):
   - `Ctrl/Cmd + wheel` → `preventDefault()` + `camera.zoomAroundPoint(cursorScreenPos, factor)` — **zoom at the cursor position**, NOT screen center (±deltaY direction → zoom in/out; factor ~1.0015^deltaY or equivalent smooth curve — pick and record one)
   - plain `wheel` → pan by `deltaX/deltaY` (scroll = move around canvas)
   - `Shift + wheel` → horizontal pan (deltaX = deltaY) — standard nicety, record if skipped and why
   - middle-mouse drag (button 1) → grab-pan with `cursor: grab/grabbing` — same gesture pipeline as §Phase-2.z (preview state, one transaction per drag)
3. **Detach cleanup in `detach()`** — the leak fence must stay green (listener-removal symmetry).
4. **E2E (`e2e/wheel.spec.ts`) — permanent gate, this is the fix for the coverage blind spot:**
   - dispatch `ctrlKey + wheel` on container → assert camera zoom CHANGED and `event.defaultPrevented === true` (both assertions — math AND wiring, the class of bug we just shipped)
   - plain wheel → camera pan changed, no zoom
   - zoom-at-cursor precision: zoom with cursor over a known shape → shape's screen position stays pinned ±1px
   - listener removed on destroy → wheel after destroy changes nothing, no errors
   - run on all three engines (the passive-listener default differs by engine — this matrix matters more than usual)
5. Golden snapshot: any new public event/callback surface → snapshot update + questions-log entry. Internal-only changes → no snapshot change.
6. **E2E input audit (new permanent practice):** for every user-facing interaction in this fix, assert the *input event → observable effect* chain, not just the effect. Record in the REPORT which prior camera tests were math-only vs input-wired.

**§0.2 Tag popover — minimal human tagging UI in the playground (user-confirmed gap: no way to tag or name a shape by hand).**

1. In `apps/studio/src/playground.ts` (playground only — Studio app remains Phase 5): on selection, show a small floating popover near the shape (or docked panel — pick the simpler one, ≤300-line file limit respected by splitting into `playground-tag-panel.ts`):
   - shape ID **read-only** (copyable), per ADR-006: `#x7q`
   - name input (validates via `isValidShapeName` from schema; empty = unnamed)
   - type dropdown from `SEMANTIC_TYPES` (shows the inferred default preselected — smart defaults made visible and overridable)
   - retag writes `meta.semantic.type` via one store transaction (one undo entry)
   - hint line when a smart default was applied at creation ("Inferred: section — retagged by you") — inference provenance visible, per the trust ruling
2. Chip rendering: selection reveals the chip (`#x7q <name|type>`) per ADR-006 hover mode — the popover and chip must agree on label.
3. E2E (`e2e/tagging.spec.ts`): select → popover shows ID/name/type · retag via popover → chip updates, one undo entry, undo restores previous type · rename → chip updates, ID unchanged.
4. Scope honesty: this is the MINIMAL tagging affordance so Phase 4's compiler is human-testable. The full inspector (parent field, member lists, platform/style pickers, hover-confirm) remains Phase 5 — record that boundary in the REPORT.

**§0 exit:** wheel zoom + pan works in playground on all 3 engines (defaultPrevented asserted), tagging popover works, chips agree with popover, all fences + new gates green. Then §1.

---

## §1. THE COMPILER — `@open-draw/markdown`

**Principle: ported, not reinvented.** The MarkDraw predecessor contains the proven compiler with fixtures. Port code + tests; hold output **byte-identical** on predecessor fixtures; divergences only where our ADRs demand (ADR-006 `f(<id>)` refs, legend, Design Direction) and every divergence is fixture-documented.

1. **Pure function:** `compile(annotatedScene, options?) → string`. No I/O, no DOM, no globals — same purity bar as `derive()`. Deterministic: same scene, same string, byte-for-byte.
2. **Options (frozen from ADR-006 + Phase 4 planning):**
   - `legend: boolean` — the ID→type→name→parent table section (auto-generated, read-only projection; never hand-authored)
   - `designDirection: boolean` — emits the Design Direction section from platform + style profile meta (token table from the neubrutalism-class data modules)
   - platform profile selection follows scene meta (per Phase 3 data modules)
   - anything else the predecessor supported → port and document in the REPORT
3. **Format requirements:** `f(<id>)` references (ADR-006), stable section ordering, deterministic whitespace. The output format is FROZEN from first publication — golden fixtures pin it from day one (predecessor fixtures + new fixtures for legend/design-direction sections).
4. **Golden fixture discipline:** `fixtures/*.md` files committed alongside the tests that assert byte-equality. ANY intentional format change after this phase = deprecation-cycle decision per the 0.1.0 semver promise — record in REPORT that markdown format is now versioned.
5. **Package mechanics:** `@open-draw/markdown` private this phase; boundary fence day one with red/green: markdown → semantics + schema only; canvas never imports markdown; nothing else imports it yet (studio comes Phase 5). The word "compile" in canvas source = boundary violation candidate (consistent with the "breakpoint" precedent).
6. **Round-trip consideration (spike, not build):** predecessor may have had an importer. If spec-reimport exists, record its status in spike notes; do NOT build re-import this phase unless the predecessor already had it working — then port with fixtures. Honest scope line in REPORT either way.

---

## §2. INTEGRATION — the pipeline exists end to end (quietly)

1. Playground gains a "Compile" action (toolbar, Material Symbol icon): current scene → `compile()` → markdown shown in a modal/panel with **copy button**. This is the first time a human can go draw → tag → spec. No AI integration (that's the future Export-for-AI flow) — just the document, visible.
2. This wire-up lives in the playground app layer; markdown stays pure and canvas stays oblivious (fences enforce).

## §3. HOUSEKEEPING

1. Phase 3 REPORT §1 prose fix: correct "Crockford base32 minus I, L, O, U, fixed length 12" → actual: lowercase alphabet `a–z` + `2–9` excluding vowels (29 chars), 4-char default growing to 5 at density (ADR-006 text and code are correct; fix the report prose).
2. `memory/progress.md` updated: 0.4.0/0.2.0 shipped, playground deployed, Phase 4 status.
3. Questions doc reviewed at exit; new questions logged with dates, none silently dropped.

## §4. RELEASE (if Phase 3 fixes touched canvas/schema public surface — likely §0.1 does via new events)

1. canvas bumps to `0.5.0` (new interaction surface = minor), schema only if changed. Markdown/semantics stay private.
2. Golden snapshot updated through the audited process (questions-log entry listing exactly what changed and why).
3. Dry-run tarball inspection; maintainer workflow_dispatch publish; fresh-install clean-room check updated to 0.5.0.
4. Changelog entries tied to real changes; no invented history.

---

## §5. EXIT GATE

- [ ] §0.1: wheel zoom + pan live in playground on all 3 engines; `defaultPrevented` asserted in E2E; zoom-at-cursor pinned ±1px; destroy-cleanup proven; leak fence green
- [ ] §0.2: tag popover works; retag = one undo entry; chip↔popover agree; inference provenance visible
- [ ] §1: `compile()` pure + deterministic; predecessor fixtures byte-identical; divergences fixture-documented; legend + designDirection options live; golden fixtures committed day one
- [ ] §2: playground "Compile" action produces copyable spec from a real scene
- [ ] Fences: all 10 existing + any new (wheel-listener check, boundaries for markdown) green with red/green proofs
- [ ] Housekeeping: 3.x report prose fixed, progress.md current, questions reviewed
- [ ] REPORT.md in `docs/od-verification/4/` citing every claim; input-audit section (what was math-only before §0 and is now input-wired)
- [ ] **Maintainer hand-test (REQUIRED, in checklist):** playground session — ctrl+scroll zooms at cursor (browser does NOT zoom), plain scroll pans, tag a shape via popover, retag, undo, click Compile, copy the spec, confirm chips/legend IDs match the document
- [ ] CI green; merged to `main`; release through maintainer gates

## §6. EXPLICITLY NOT IN PHASE 4

AI/LLM integration of the Export-for-AI flow (post-Studio), Studio app + full inspector (Phase 5), persistence/migrations (Phase 5), spec re-import (spike only), crayon style, culling, collab, demo GIF, website.

**After exit:** Phase 5 — Studio (full inspector: parent field w/ cycle-safe dropdown, member lists, platform + style pickers with hover-confirm; chips `always|hover|off` UI; persistence + migrations; the full app) → dogfood website via Export-for-AI → demo GIF → Reddit launch (all-MIT).