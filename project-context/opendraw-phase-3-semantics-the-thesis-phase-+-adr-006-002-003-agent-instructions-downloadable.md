# OpenDraw Phase 3 — Semantics: The Meaning Layer
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** `build/phase-3` → merge to `main` on exit (phase discipline RESTORED — see §9)
**Prerequisites:** `@open-draw/canvas@0.3.0` published; all 9 fences green; `project-context/OPENDRAW-CONTEXT.md` is master context; ADRs 001–005 in `docs/adr/`.
**Goal:** OpenDraw stops being "a well-engineered canvas" and becomes "the tool that turns drawings into AI-buildable specs." Semantics = the meaning layer: types, identity, parenting meanings, responsive derivation, platform & style profiles, smart defaults. Everything is **pure data + pure functions** — zero rendering, zero DOM.

**Rules in force:** small commits (`type(scope): what (phase.3.N)`) · TS strict, no `any`/`@ts-ignore` · **no file > 300 lines** · unspecified → `docs/od-questions.md`, never invention · every new check gets a red/green proof · canvas API surface FROZEN (golden snapshot; changes only via questions-doc + maintainer sign-off) · **semantics never imports canvas; canvas never imports semantics** (CI boundary fence extended to the new package on day one — red/green proof before any feature work).

**Phase principle: semantics is PORTED, not reinvented.** The MarkDraw predecessor repo contains proven semantics logic with passing tests. Port code + tests; where our frozen rulings differ from predecessor habits, OUR ruling wins. Record every divergence in the questions doc. Never rewrite working logic "for style."

---

## §0. ADR-006 — Identity & Naming (FIRST COMMIT; maintainer reviews before merge)

Write `docs/adr/ADR-006-identity-naming.md` encoding these CLOSED rulings verbatim (they are decisions, not options — do not re-litigate):

1. **IDs:** alphabet `a–z` + digits `2–9` (excludes 0, 1, and vowels — no lookalike pairs, no accidental words); 4 chars default (~500k space); generate randomly at creation (seeded in tests); regenerate on collision (doc-unique); grow to 5 chars at density threshold; NEVER sequential, never type-prefixed, never user-editable. REJECTED (record with reasons): type-prefixes (`btn-3`), user-editable IDs, UUIDs, sequential integers.
2. **Names:** optional, NON-unique labels; trimmed, 64-char cap, no control chars, empty = unnamed; display falls back to type; rename never touches the ID. Copy/paste/duplicate → new ID, name preserved.
3. **Chips:** display modes `always | hover (DEFAULT) | off`; view state only (never persisted in scene, never in snapshot); selection always reveals chips of selected shape + its parent; chip label `#x7q <name|type>`, truncate ~12 chars visually, full on hover. Export chips = independent `exportPNG` option, decoupled from editor mode.
4. **Legend:** markdown-compile option ONLY; auto-generated read-only projection of scene state at compile time (never hand-authored, never editable); NO canvas legend panel — chips serve in place. Legend + chips-annotated screenshot together form the Export-for-AI story.
5. **ID lifecycle:** IDs surface read-only everywhere user-facing (inspector, chips) — copyable, never editable input.

Implementation in this phase: ID generator module (schema or semantics — decide by dependency direction; the generator must be usable by canvas at creation time, so if it lives in semantics, canvas must NOT import it → therefore the generator lives in `@open-draw/schema` as a pure utility with the validator), name validation wired into the meta-namespace validator (already shipped in store).

## §0b. ADR-002 & ADR-003 AMENDMENTS (same opening commit set)

**ADR-002 (parenting) amendment — inspector path + cycle validation:**
- Inspector-set parent = same store transaction as gesture (one truth, two entry points); enables parenting-without-geometry (a shape logically belonging to a frame without containment).
- **Cycle prevention is MANDATORY store validation:** `setParent(id, parentId)` rejects (typed error) any parent that is the shape itself or any descendant of the shape. The gesture path can't create cycles; a dropdown can — so this validation is load-bearing, not defensive.
- NO containment auto-re-suggestion in inspector dropdowns — explicit stored parents only (containment suggests at drop time, never re-suggests later).

**ADR-003 (grouping) amendment — group semantics:**
- A group IS a real shape whose members' `meta.parent` points at it — same machinery as frames; all parenting rules apply unchanged.
- Frame = spatial container (clips children, children orphan on frame delete). Group = logical unit (NEVER clips, moves as one, resize SCALES members proportionally from union anchor, rotate transforms members around group center, delete takes members with it).
- **Ungroup ≠ delete** (`Ctrl/Cmd+Shift+G`): members reparent to the group's parent, shell deleted, one transaction. Delete group = members + shell, one transaction.
- Nesting: schema supports N levels; v0.x UI exposes one.
- Arrows bound to group members during group transform → open as **Q-007**, resolve with an E2E fixture (endpoint follows member; connector reconciliation decides routing).
- No frame-group hybrid construct, ever.

**Warning discipline (record in ADR-003/Studio notes, UI lands in Studio):** no modal confirms for anything the undo stack covers; toast + inline Undo for destructive-but-undoable (delete group/frame); modals only for actions undo can't repair (clear-all, external file ops). Feedback ≠ warning.

---

## §1. SEMANTIC TYPES (the vocabulary)

1. Port the type vocabulary from the MarkDraw predecessor (`semantic.type` values) — page, section, column, card, text/heading, button, image, nav, etc. — as **data**, not classes: a table of type definitions (id, label, description, allowed-children, props schema per type).
2. `meta.semantic.type` + `meta.semantic.name` live in the opaque meta namespace (store never reads them; semantics reads via the meta-namespace registration from Phase 2).
3. Type validation: `@open-draw/semantics` exports `validateSemantics(scene) → issues[]` — pure, returns warnings (e.g. "card contains a page" — nonsensical containment), never mutates.
4. Unit tests ported from predecessor + new fixtures per frozen ruling. A type table is data → adding types later = adding rows, never code changes.

## §2. SMART DEFAULTS — creation-time type inference (the flagship UX feature)

Rules (closed in discussion; iterate rule CONTENT, not the mechanism):

1. **Mechanism is frozen:** pure function `inferType(shape, scene) → { type, confidence } | null`, fired **ONCE at the creation gesture's commit** (never on resize, never continuous, never on re-parent). Suggestion applied as the default `meta.semantic.type` — visible (chip appears immediately), one-click retag to override, undoable, and **NEVER re-fires or overrides an explicit user choice**.
2. **Confidence tiers:** strong (≥ threshold) → applied as default; weak → ghost hint only (dashed chip: `section?` — tap/Enter accepts; never auto-applied). Threshold and tier assignment per rule, recorded as data.
3. **Initial rule table (port + extend from predecessor where it had heuristics; otherwise author, marked as v0.3 rules subject to iteration):**
   - full-width rect directly inside a `page` ⇒ `section` (strong)
   - rect inside a `column` or `section` ⇒ `card` (strong)
   - first text shape inside a `card`, at top ⇒ `title` (strong)
   - full-width rect inside `section` ⇒ `section` (strong)
   - small rect with centered text at page bottom / inside nav ⇒ `button` (weak → ghost)
   - ink over a shape ⇒ annotation, no type applied (weak, informational)
   - EXPLICIT RULE: inference NEVER sets a parent (that's ADR-002's drop suggestion), NEVER overrides an existing type, NEVER fires on shapes the user retagged this session (explicit choice wins).
4. **Platform-aware:** rule tables may be scoped per platform profile (web "section" ≠ android "screen section"); v0.3 ships web-profile rules only, structure ready for more.
5. **Trust gate E2E (`e2e/smart-defaults.spec.ts`):** draw full-width rect in page → chip shows `section` · retag it to `card` → resize wildly, move it → type STAYS `card` (no re-inference) · ghost hint appears but does not apply for weak rules · undo removes shape + suggestion cleanly. **The "never re-types" assertion is the phase's soul test.**
6. **Determinism:** `inferType` is pure — same scene, same suggestion. Seeded tests. Golden fixtures for the rule table.

## §3. RESPONSIVE — `derive(scene, breakpoint)`

1. Port `derive(scene, { width, containers? })` from predecessor **with its tests intact** — the pure function that computes effective layout at a content width: which sections stack, which columns reflow.
2. Discrete swap only (<50ms target, measured as observation); drag-reflow remains out of v0.x (frozen).
3. Canvas never knows breakpoints exist (fence extends: the word "breakpoint" appears in canvas source = boundary violation).
4. Unit fixtures from predecessor ported byte-behavior-identical; any divergence due to our rulings → questions doc entry.

## §4. PLATFORM & STYLE PROFILES (data modules, sibling pattern)

1. **Platform profiles** (ADR-004): `web`, `android`, `flutter` — each a data module (component mapping table: semantic type → platform-native equivalent; token conventions; nesting rules). Scene-level `platform` field lives in meta.
2. **Style profiles (NEW — from the Oct 22 ruling):** document-level design-direction modules — `styles/neubrutalism.ts` as the ONE proof style: a pure token set (palette, radii, border widths, shadow recipes, type scale, spacing density — ~30 lines of data). Mechanism: `styles/` registry, same pattern as platforms. **Styles are DATA ONLY — zero rendering, zero canvas knowledge; a style module containing rendering logic is a boundary violation.** Long tail (glassmorphism, soft-UI…) = content added later; mechanism ships once.
3. `derive` may consume platform + style to produce platform-flavored derived output; the markdown compiler (Phase 4) will emit them as a Design Direction section — for THIS phase, semantics just guarantees the data is queryable and validated.
4. E2E/unit: profile validation, unknown-profile errors are typed, style tokens structurally valid.

## §5. SEMANTICS PACKAGE MECHANICS

1. `@open-draw/semantics` stays `"private": true` this phase (public when the spec pipeline completes — Phase 4 exit decides).
2. Boundary fence extension (day one, red/green): semantics → schema only; canvas → schema only; nothing → semantics except future markdown/studio (their phases).
3. All public functions pure, typed, documented; the package's future API gets the same golden-snapshot treatment when it goes public (prepare the script, don't run the fence until publish).
4. Meta-namespace: semantics registers its namespace + validators via the existing store API (load-time validation from Phase 2).

## §6. HOUSEKEEPING (opening commits)

1. `memory/progress.md`: update — current status (0.3.0 + playground shipped), next = Phase 3, reference `project-context/OPENDRAW-CONTEXT.md` as master context.
2. `interaction.ts` at 292/300 lines — split per existing structure (gesture vs tool logic) BEFORE any new work threatens the fence. No behavior change; full test suite green after.
3. Playground: keep gh-pages deployment working; after Phase 3, playground gains chips display (hover default) as a visible proof — optional this phase, required before Phase 5.
4. Verify Q-007 (arrow vs group transform) gets its fixture resolved or explicitly deferred with reason in questions doc.

---

## §7. PHASE 3 EXIT GATE

- [ ] ADR-006 committed verbatim from §0; ADR-002/003 amendments committed; maintainer reviewed before merge
- [ ] ID generator live (alphabet/collision/growth rules proven by unit tests); name validation in meta validator
- [ ] Type vocabulary ported with predecessor tests green; validateSemantics pure + tested
- [ ] Smart defaults: inferType pure + rule table data + confidence tiers + **trust-gate E2E green (retag-then-resize never re-types — soul test)**
- [ ] derive() ported, tests byte-behavior-identical, canvas-clean (no breakpoint knowledge)
- [ ] Platform profiles (web/android/flutter data) + style profiles (neubrutalism proof style) validated, data-only proven
- [ ] Cycle validation live in store with typed error + test; group semantics per ADR-003 amendment (interaction math — proportional resize, group rotate — may be Phase 3.5 if it needs canvas gesture work: then it's scheduled explicitly, not silently dropped)
- [ ] Boundary fence extended (semantics↔canvas) with red/green proof; all 10 fences green
- [ ] Housekeeping: progress.md current, interaction.ts split, playground intact
- [ ] REPORT.md in `docs/od-verification/3/` citing every claim; port-divergence table (every place our ruling overrode predecessor behavior); questions doc reviewed, none silently dropped
- [ ] Maintainer hand-test: playground session — draw, see chips on hover, see smart-default chip appear at creation, retag, resize (no re-type), undo
- [ ] CI green end-to-end; merged to `main`

## §8. EXPLICITLY NOT IN PHASE 3

Markdown compiler (Phase 4, byte-stable + legend option), Studio app (Phase 5), inspector UI (Phase 5; store APIs ready now), group gesture math if it needs canvas work (→ Phase 3.5, scheduled not dropped), crayon render style (post-Studio pro candidate), culling, collab, demo GIF.

## §9. PROCESS DISCIPLINE (restored, effective this phase)

- Work on `build/phase-3`; merge to `main` only at exit gate with maintainer sign-off.
- Phase-tagged commits: `type(scope): what (phase.3.N)`.
- REPORT.md with cited claims before merge; no direct-to-main feature commits.
- **Patch-flow exception (formalized):** small canvas/UX fixes (`fix()` class) MAY go direct to main IF: single commit, all fences green in CI, and logged in the questions doc same day. Features and phases never use patch-flow.

**After exit:** Phase 4 — markdown compiler (compile(annotatedScene) → byte-stable string; golden fixtures day one; legend compile option; Design Direction emission from platform+style; ported from predecessor with fixtures held byte-identical) → Phase 5 Studio (inspector, chips UI, pipeline, persistence + migrations) → dogfood website via Export-for-AI → demo GIF → Reddit launch (all-MIT).