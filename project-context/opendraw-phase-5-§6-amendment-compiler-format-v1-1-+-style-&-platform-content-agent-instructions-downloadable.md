# OpenDraw Phase 5 §6 Amendment — Format v1.1 + Design-Style Content
# — Agent Instructions (mid-phase amendment) —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** the active Phase 5 branch (`build/phase-5`) — this amendment lands INSIDE Phase 5, not a new phase
**Context:** Maintainer ran four real codegen tests against compiled specs (web-faithful, web-imaginative, android+neubrutalism, android+hand-edited "material 3"). This amendment encodes every finding. All §0 process rules of Phase 5 remain in force: REAL-INPUT E2E, CI-green-before-push (full local matrix), strict edge-case enumeration, TS strict, ≤300 lines, questions-doc for anything unspecified.

**⚠️ Timing rule:** the markdown format is PRIVATE (not yet published) — v1.1 changes are cheap NOW and become deprecation-cycle decisions the moment `@open-draw/markdown` publishes. Do this amendment before any publish.

---

## §6.1 — FORMAT v1.1 (compiler changes; every change = fixtures updated in the same commit)

**6.1.1 Mappings filtered to scene content.** The Platform Component Mappings table emits ONLY semantic types actually present in the scene. Test: scene with card+text emits 2 rows; scene with 0 semantic types emits no table (with a note if §6.1.5 flags apply).

**6.1.2 One canonical home per attribute.** Bounds and Name live ONLY in the Element Legend. Screen Structure carries: type, `f(id)`, text content (for text-like shapes) — pure tree + content, zero attribute duplication. Fixture asserts no bounds/name tokens in Structure section.

**6.1.3 Bounds semantics declaration.** Add one line under the version marker (fixed wording, fixture-pinned): bounds are content-size in scene coordinate space; absolute position is a spatial suggestion, not a layout mandate; consuming agents adapt to platform layout systems (this matches observed AI behavior in test 1). Exact wording goes in `docs/od-questions.md` with maintainer confirmation before fixture freeze.

**6.1.4 Responsive Behavior section (new, on by default, toggleable).** Emit computed responsive derivations from `derive()`: for each breakpoint the platform profile defines (e.g. web: 580px class), state what changes ("card f(xjy4) stacks vertically; column f(...) reflows"). Pure projection of derive() output — deterministic, fixture-pinned. Rationale: test 1 showed consuming AIs improvise responsive behavior; we already compute it — ship the data, stop relying on the AI's general knowledge.

**6.1.5 Untagged shapes never leak unmarked (Q-008).** Shapes without a semantic type (e.g. raw `rect`) compile as `[untagged:rect]` in Structure and legend Type column `rect *untagged*`, PLUS a "⚠ Untagged Elements" note under the version marker listing their `f(id)`s with the tag suggestion to fix in Studio. Untagged mid-workflow is normal; SILENT untagged in a spec is the bug (test 1: AI had to guess `rect` was a button from its name alone). E2E: compile a scene with one untagged shape → note present, marked in both sections.

**6.1.6 Consumption Directives (the test-2 lesson).** New header block emitted under the version marker:
- `strict-fidelity` (DEFAULT): "Build EXACTLY the elements specified. Do not add, remove, or restyle beyond the Design Direction. Do not invent unspecified content."
- `creative-allowed`: "Preserve every f(id) identity, semantic type, role, and structure exactly. Styling and additive content extension are permitted within the Design Direction."
- Compile option `directive: 'strict-fidelity' | 'creative-allowed'` (default strict). Studio compile panel exposes the choice. Fixtures for both modes.

**6.1.7 Spec integrity rule (the test-3 lesson — documentation + guardrail).** The compiled spec is a GENERATED ARTIFACT: regenerate, never hand-edit. (Observed: hand-editing style to "material 3" while tokens stayed neubrutalism produced a self-contradicting spec; the consuming AI resolved it by trusting the name over the data.) Document in the format docs AND the compiler README. Additionally: `compile()` input is the scene — the compiler is the only writer of specs by construction; record in questions doc that any future import/lint path MUST validate name↔data consistency (style name vs token table, platform name vs mappings) as a spike note for Phase 5+ re-import work.

**6.1.8 Version bump:** `<!-- open-draw-spec:v1.1 -->` · regenerate ALL golden fixtures (v1 fixtures updated, not kept) · changelog entry lists each format change with its originating test as justification.

---

## §6.2 — STYLE PROFILE CONTENT (data-only; mechanism exists, this is content — "mechanism once, content forever")

Ship these style modules in `@open-draw/semantics/src/styles/`, each a pure token data module (palette, borders, shadows, typography, spacing/radii), same shape as `neubrutalism.ts`:

1. `material3.ts` — Material 3 baseline: dynamic-color-inspired tonal palette, radii 12–28px, tonal elevation (soft layered shadows), Roboto/Google Sans scale. Notes field: "M3 themes map via Material Theme Builder; Compose `MaterialTheme`, Flutter `ThemeData`, Web `material-web`."
2. `flat-minimal.ts` — flat/minimal: neutral grayscale palette + single accent, 0–4px radii, NO shadows (borderless/border-thin), system font stack.
3. `glassmorphism.ts` — translucent surfaces (rgba whites), backdrop blur tokens, 12–20px radii, soft ambient shadows, thin light borders.
4. `neumorphism.ts` — soft-UI: dual shadow recipe (light/dark offsets), low-contrast monochrome palette, large radii 16–24px, extruded-look tokens.
5. (existing) `neubrutalism.ts` — unchanged.

**Rules:** each module ≤ ~40 lines of pure data · NO rendering logic anywhere (fence-check extends: style modules importing or touching DOM/canvas = boundary violation) · every style validates structurally (same validation as Phase 3) · one unit fixture per style asserting its token table compiles correctly with the Design Direction section.

**Platform-aware notes:** styles are platform-agnostic by design; per-style Notes mention platform nuances ONLY as data (e.g. glassmorphism on Android: blur tokens map to RenderEffect; M3 on web: material-web tokens). The platform profiles (web/android/flutter — already shipped) remain the mapping layer; styles remain the token layer. No cross-coupling.

**Studio UI:** style picker in the Design Direction inspector section lists registry styles from data (registry iteration — adding style content requires ZERO UI change; assert picker shows 5 styles with one line edited).

---

## §6.3 — PLATFORM MAPPINGS VERIFICATION SPIKE (research, data-only changes)

For every semantic type × platform, verify the mapping against the platform's CURRENT canonical practice; fix rows that are wrong; enrich Notes where idiom guidance helps (test evidence: AIs consumed Notes column — "Image with mandatory alt" was honored verbatim). Specifically:
- **web:** HTML5 semantic elements + ARIA landmark practices (`page→<main>`, `nav→<nav>`, `card→<article>` confirmed good by tests; verify `heading→<h2>` level logic — record rule).
- **android:** Material 3 Compose widgets (verified in test outputs: Scaffold, TopAppBar, Card, ElevatedButton — confirm `section→SingleChildScrollView vs LazyColumn` guidance is stated as data in Notes).
- **flutter:** Material widgets (Scaffold, AppBar, Card, ElevatedButton — verify image mapping guidance).
- **Add semantic type `row`** (vocabulary gap proven by the horizontal profile-card test): web `<div>` flex-row / container `row`, android `Row`, flutter `Row`. Add to `SEMANTIC_TYPES` with allowed-children, plus each platform's mapping row. Fixture + validation tests updated. (Optionally evaluate `divider`/`spacer` in the questions doc — decide by "needed to build real screens" test; default: defer.)

---

## §6.4 — E2E & GATES (real-input, edge cases enumerated)

1. Compile panel: style picker shows all 5 styles (real click, not evaluate) → select material3 → compile → Design Direction shows material3 name AND its tokens (name↔data consistent BY CONSTRUCTION — assert both match the module).
2. Directive toggle: strict vs creative → fixtures assert header text; panel interaction is real-input.
3. Untagged scene → compile → warning present (assert in output string) + Studio legend/tree badge visible when implemented.
4. Responsive section: scene with stacked candidates → compile at web profile → section present and matches derive() output exactly (pure projection test).
5. Edge cases: empty scene compile (friendly empty spec) · scene with ONLY untagged shapes (mappings table absent + untagged note lists all) · style switch mid-session (compile reflects current pick, no caching) · compile mid-gesture (committed state only, per Phase 5 §1.4) · all 5 styles × 1 platform smoke fixture (token table compiles) · 1 style × all 3 platforms fixture (mappings correct per platform).
6. All existing fences + new runs; FULL local matrix green before push (§0.2 certification line in REPORT).

## §6.5 — EXIT CHECKLIST (amendment, not phase exit)

- [ ] v1.1 format live with all 7 changes; ALL fixtures regenerated; version marker v1.1; changelog ties each change to its test
- [ ] 5 style modules validated, data-only, picker shows all 5 (registry-driven, no UI code change needed)
- [ ] `row` semantic type + 3 platform rows + fixtures; mappings verified ×3 platforms, fixes logged
- [ ] Bounds-semantics + regenerate-don't-edit documentation committed; spec-integrity spike note recorded
- [ ] Real-input E2E for picker + directive toggle; untagged + responsive + empty-state edge cases green
- [ ] Questions doc: every wording decision (directives text, bounds line) confirmed or logged; nothing silently invented
- [ ] Local full matrix certified green before push; REPORT §6 amendment section citing this doc and the four originating tests

**Explicitly NOT here:** AI/LLM integration in-app (post-Studio), spec re-import (spike note only), drag-reparent in tree, more styles beyond the 5 (content later, forever cheap), publishing `@open-draw/markdown` (publish decision is Phase 5 exit, AFTER v1.1 fixtures are frozen).