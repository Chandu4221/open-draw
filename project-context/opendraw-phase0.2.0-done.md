# OpenDraw — 0.2.0 Hardening
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/0.2.0` → merge to `main` on exit
**Prerequisites:** `@open-draw/canvas@0.1.0` + `@open-draw/schema@0.1.0` published and clean-room verified; all 9 fences green; `project-context/OPENDRAW-CONTEXT.md` is master context.
**Goal:** the public SDK becomes *trustworthy*, not merely available: proven on the three browser engines, accessible to real keyboard/screen-reader users, and free of leaks. Then publish `0.2.0`.

**Rules in force:** small commits (`type(scope): what (harden.N)`) · TS strict · no file > 300 lines · unspecified → `docs/od-questions.md`, never invention · every new check gets a red/green proof · **API frozen: no public export added/removed/changed without a questions-doc entry + golden snapshot update — this phase fixes behavior, not surface.**

**Phase principle: this is hardening. Every fix must be tied to a discovered defect or audit finding — no speculative rewrites. If nothing is broken in an area, that area ships as-is with its test coverage noted.**

---

## §1. CROSS-BROWSER E2E (firefox + webkit)

1. **Playwright project matrix:** extend the E2E config from chromium-only to `chromium | firefox | webkit` (Playwright's bundled engines; no real-Safari hardware required — note this limitation in the REPORT).
2. **Engine-difference triage, not blind fixing:** each engine will produce some failures. For EVERY failing test: root-cause it (SVG serialization differences, event ordering, focus behavior, CSS feature support), fix in engine-neutral code where possible, and record the engine-specific behavior in `docs/od-spike-notes.md` (append `SPK-004` — cross-browser observations). **A fix that branches on `navigator.userAgent` or engine detection is BANNED — capability-test or standard-compliant fixes only.** If an engine-detection branch is ever truly unavoidable, it goes to the questions doc first, not the commit.
3. **Full matrix runs:** all existing E2E specs (selection, keyboard golden path, live-preview, handles, reparent, eraser, export, invariant) run on all three engines. Any test that cannot pass on an engine due to a genuine Playwright/engine limitation (not our bug) gets documented with evidence and conditionally skipped per-engine with a visible `test.skip(condition, reason)` — never silently.
4. **exportPNG on each engine:** SVG→PNG serialization is the most engine-divergent path (foreignObject, fonts, data-URL handling). Verify the PNG E2E on all three; record byte-size differences as observations.
5. **Exit:** 3×3 matrix green (or documented per-engine skips with evidence); one defect found per engine at minimum is expected — record defects found vs fixed.

## §2. ACCESSIBILITY AUDIT

The architecture claims "a11y is real because elements are real." Now prove it:

1. **Automated audit:** run axe-core (devDependency ONLY — the SDK itself stays zero-dep; the scanner lives in e2e tooling) against the playground across key states: empty canvas, 20 shapes, selection active, mid-gesture (paused), text editing mode, frame with children. Every violation: fix or document-with-reason in the REPORT (some axe rules are advisory for canvas-like apps — a ruling each, no blanket ignores).
2. **Semantic structure:** every shape wrapper has a sensible role/name (type + optional name per the naming scheme when it lands; type-based label for now: e.g. `role="img"` / `aria-label="rectangle"` or per-shape roles where better), focusability verified, focus order = z-order via Tab (already E2E'd in 2.y — verify it still holds), visible focus indicator on the canvas root and shapes.
3. **Keyboard coverage re-verified on all engines** (§1 matrix): the golden-path spec IS the a11y regression suite; it must be green on firefox + webkit, not just chromium.
4. **Screen-reader smoke notes (honest scope):** programmatic SR verification (NVDA/JAWS/VoiceOver) is OUT OF SCOPE for this phase — record as a 0.3.x candidate with what axe+keyboard coverage does and does not prove. No overclaiming in the REPORT.
5. **a11y fence?** Only if a concrete regression risk was found (e.g. axe violations reappearing): if added, red/green proof required. Otherwise the E2E matrix itself is the guard.

## §3. MEMORY-LEAK TESTS

1. **Editor lifecycle leak test:** create editor → draw 50 shapes → destroy → repeat 50 cycles → assert (via `performance.memory` where available, else WeakRef/detached-node heuristics — record method + engine support honestly) that detached nodes and listeners don't accumulate: node count plateaus (bounded growth, documented threshold), no listener growth on the container.
2. **Listener audit:** every `addEventListener` in the canvas source has a matching removal on `destroy()` — add a runtime assertion mode (dev-only): destroyed editor fires zero callbacks when events are dispatched on the orphaned container.
3. **Gesture-path leak test:** rapid create-destroy during in-flight gestures (pointerdown → destroy → pointerup on orphaned DOM) — no throws, no leaks, no store transactions after destroy.
4. **exportPNG leak:** 100 exports on one editor → DOM node count stable (the chips hide/restore path restores exactly — overlay count before/after identical).
5. **Fence:** leak test joins CI with a threshold (documented; generous to avoid flake, tight enough to catch real accumulation). Red/green proof: deliberately remove one `removeEventListener` → red → restore → green.

## §4. RELEASE 0.2.0

1. **Patch-level fixes only surfacing:** any public-API-adjacent fixes go through the golden snapshot process (§ phase rules). If a fix requires an API change: STOP — questions doc + maintainer decision; do not un-freeze the surface alone.
2. Changelog per package: `0.2.0` — cross-browser support, a11y improvements, leak fixes (each entry tied to a real finding, no invented heroics).
3. Version bump both packages (schema only if it changed; if unchanged it re-publishes at same version — npm forbids republishing; so: **schema bumps only if its code changed**, canvas always).
4. Dry-run tarball inspection as in 2.s; maintainer gate: workflow_dispatch publish; fresh-install clean-room check (same as 0.1.0 — maintainer runs the script from the 2.s REPORT, updated for 0.2.0).
5. GitHub Release notes from changelog; tag `v0.2.0`.

---

## §5. EXIT GATE

- [x] 3-engine E2E matrix green (or evidenced per-engine skips); no user-agent branching anywhere (CI-searchable assertion added? if yes → red/green proof)
- [x] axe-core audit: zero critical violations on audited states; every advisory/rule skip has a logged ruling
- [x] Keyboard golden path green on all three engines
- [x] Leak tests live in CI with red/green proof; 50-cycle lifecycle test passes
- [x] Any API-adjacent change went through questions doc + golden snapshot update (none needed — API surface 100% frozen)
- [x] 0.2.0 packaged and verified; maintainer gate ready for publish & fresh-install check
- [x] All 9 existing fences green
- [x] REPORT.md in `docs/od-verification/0.2.0/` citing every claim; defects-found vs defects-fixed table; engine observations in SPK-004; questions doc reviewed, none silently dropped
- [x] CI green end-to-end; ready for merge to `main`

**Explicitly NOT in this phase:** any new feature, styles/style-profiles (Phase 3 discussion), crayon render style (post-Studio candidate), culling, semantics/markdown/Studio work, real screen-reader verification (0.3.x candidate — recorded, not forgotten), demo GIF.

**After exit:** **Phase 3 — semantics** (the thesis phase): ADR-006 (identity & naming: short type-agnostic IDs, chip labels, legend option) committed FIRST, then semantic types, parenting meanings, responsive `derive`, platform profiles (web/android/flutter as data modules) — and in the same planning conversation: **style profiles as data modules (neubrutalism-class design directions, document-level, one proof style)** — then Phase 4 markdown → Phase 5 Studio → dogfood website → Reddit launch.