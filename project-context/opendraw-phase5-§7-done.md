# OpenDraw Phase 5 §7 Amendment — Content Depth + Repair Batch
# — Agent Instructions —

**Repo:** `github.com/Chandu4221/open-draw` · **Branch:** the active phase branch (or `build/phase-5.7` if Phase 5 is merged — maintainer decides) → merge to `main` on exit
**Prerequisites:** Phase 5 + §6 amendment landed (format v1.1 live, 5 styles, `row` type, Studio inspector/persistence complete). All standing rules IN FORCE: **§0.1 real-input E2E, §0.2 CI-green-before-push (full local matrix, certification line in REPORT), edge-case enumeration, TS strict, no `any`, ≤300 lines, questions-doc for anything unspecified, no invention.**
**Timing:** format is still private — any compiler change here is cheap; fixtures updated in the same commit as every change.

---

## §7.1 — SEMANTIC VOCABULARY RESEARCH PASS (the framework-alignment gap)

**Goal:** the current 11-type vocabulary covers layout primitives only. Finalize the semantic type list against industry-standard component inventories so names align with what real design systems call things.

1. **Research (record in `docs/od-spike-notes.md`):** survey the component inventories of 4–5 major CSS/UI frameworks — recommended set: **Tailwind (headless patterns), Bootstrap, Material UI (MUI), Chakra UI, Ant Design** — plus the HTML5 semantic element list as ground truth. Produce a convergent-name analysis: which component concepts appear in ≥3 of them (input, select, checkbox, toggle, badge, avatar, list, table, tabs, footer, divider, modal/drawer, tooltip, alert…).
2. **Finalize the vocabulary as pure data:** add the convergent types to `SEMANTIC_TYPES` with: id (standard-aligned name, camelCase, HTML5-first where applicable — e.g. `footer`, `nav` exist), label, description, `isContainer`, `allowedParents`/`allowedChildren`, `defaultRole`. Record the chosen final list + each addition's justification (which frameworks use the name) in the spike notes; **maintainer reviews the final list before merge** (flag in REPORT as a maintainer-review gate).
3. **Platform mappings ×3 for every new type:** web (semantic HTML), android (Material 3 Compose), flutter (Material widgets) — same verification discipline as §6.3: each row checked against the platform's current canonical component.
4. **Smart defaults:** extend `INFERENCE_RULES` where obvious and strong (e.g. text directly in `nav` ⇒ link? — only if confidence-justified; log rule decisions). Do NOT force rules for every new type — infer only where geometry/context genuinely implies type.
5. **Edge cases/tests:** every new type validates (`validateSemantics` sensible containment warnings — e.g. `input` inside `footer`? warning), compiles through all 3 platform mappings, appears in the inspector dropdown and the compile mappings table. Vocabulary is data — assert registry iteration drives inspector + compile with zero code change.
6. **Validation + compile output:** full-scene compile fixture including at least: form control, badge, table or list, footer, divider (a "kitchen-sink" fixture).

## §7.2 — SELECTION-SCOPED COMPILE (infinite canvas, many designs)

1. `CompileOptions` gains `shapeIds?: readonly string[]`. When present, compile ONLY the sub-scene: the named shapes + nothing else; a shape whose parent is not in the set compiles as a tree ROOT in the structure (hierarchy among the selected shapes preserved). Untagged warning, directives, scope, responsive section all computed against the sub-scene only.
2. **Scope interaction:** if the selection contains a page-typed shape → scope `page`; else `component`. Assert.
3. **Studio:** compile modal gains a "Selection only" toggle (real-input E2E): active selection exists + toggle on → spec describes exactly those shapes (legend IDs match selection); no selection → toggle disabled with tooltip; whole-canvas default unchanged.
4. **Edge cases (all asserted):** selection of 1 shape · selection of siblings from different frames (each becomes a root) · selection mid-gesture compiles committed state only · selected parent + all descendants vs selected parent alone (children excluded compile as... document the ruling: children NOT selected are NOT emitted; note in spec? decide + record — default: only selected shapes emit, unselected children omitted entirely, no warning) · undo/redo doesn't change selection semantics · compile-selection output byte-stable (fixture).

## §7.3 — TREE VIEW (Structure tab — the stored-truth view)

1. Inspector gains a "Structure" tab (alongside the fields view): the full shape tree from stored `meta.parent` (frames, groups, children), NOT geometry. Nodes show chip-style label (`#id name|type`), untagged badge (Q-008 hook: subtle marker on untyped shapes).
2. **Bidirectional sync (both directions, real-input E2E):** click tree node → canvas selects the shape (+ camera pans to it if off-viewport, smooth scroll; assert selection change event); click shape on canvas → tree highlights the node (expand ancestors to reveal it). Multi-select highlights multiple nodes.
3. **Read-only in v1:** no drag-reparent in the tree (recorded as deferred with trigger: Phase 5+ full feature); context menu on node offers "Reveal on canvas" and "Copy ID".
4. **Edge cases:** deep nesting (5+ levels) renders with indentation, scrollable panel · deleted shape mid-hover-sync (tree updates from store events, no stale node) · reparent via inspector updates tree instantly (store-driven — assert) · 200-shape tree renders under 16ms per store event (observation, not budget) · untagged badge visible for geometry-only shapes · frame/group icons distinguishable.

## §7.4 — RESPONSIVE READOUT IN INSPECTOR (the compile-only gap closed)

1. For container shapes (card, section, column, page, group, frame) the inspector shows a **Responsive readout**: a live `derive()` projection of this container's behavior at the document platform's breakpoints — e.g. "At Mobile (<768px): children stack vertically." Pure projection of the same data the compiler emits — one source (derive), two consumers (inspector readout, compile section). Consistency test: inspector readout text and compile Responsive Behavior section derive from the same call — assert they agree for the same scene.
2. For non-container shapes: no readout (state why in questions doc: leaf shapes don't own layout reflow decisions).
3. **Deferred (record trigger, do NOT build):** live canvas responsive PREVIEW mode (rendering the derived layout on-canvas) — post-Studio capability, engine implications.
4. **Edge cases:** readout updates on child move/resize (store-driven, debounced) · readout for container with 1 child vs many · breakpoint list comes from platform profile data (web/android/flutter differ — assert per-platform readout) · empty container readout ("no children — nothing to reflow").

## §7.5 — GROW-ON-ASSIGN REPAIR (confirmed bug: assigned child clipped invisible)

1. **Ruling:** on explicit parent assignment (inspector `setParent` OR drop-to-reparent), if the child's bounds are NOT fully contained by the parent frame's bounds, the parent frame auto-grows to the union of frame+child bounds (+ the frame's existing padding conventions, if any — record choice) — **inside the SAME transaction** (resize + reparent = ONE undo entry; undo reverts both atomically).
2. Moving a child WITHIN an existing parent does NOT grow the frame (normal clipping stands — assignment-time is the only growth moment; a child dragged out stays clipped — deliberate, record ruling + rationale: continuous auto-grow = continuous recompute, banned).
3. **E2E (real-input where gesture applies):** assign out-of-bounds child via inspector → frame bounds now contain child, child fully visible, canvas reflects immediately (two-way binding proof) · undo → frame original size AND parent cleared, ONE undo step · assign via drag-drop to out-of-bounds frame edge → same growth · child partially outside → union growth correct to the pixel (fixture with exact numbers) · nested: assign child to an inner frame where the OUTER ancestor must also grow (grow cascades up the chain? — decide + record: default YES, ancestors grow to keep descendant visible) · group target: groups never clip (ADR-003) — assert no bounds change for group assignment (groups don't own geometry bounds for clipping).
4. **Inspector parent-field hover-confirm** (per ADR-002 amendment): hovering parent option highlights the frame on canvas — assert with the real-input hover.

## §7.6 — SCOPE PASS-THROUGH VERIFICATION (the modal question)

1. Verify the Studio compile modal output CONTAINS the Scope block in auto mode (no page root → `Scope: component` present in modal output string). Fix the pass-through if missing; add a real-input E2E asserting the block text in the modal preview. (Compiler already correct on main — this is the wiring check.)
2. While in the modal: assert directive toggle, legend, design-direction, responsive toggles all reflect in output (existing — re-verify, don't rebuild).

---

## §7.7 — HOUSEKEEPING & GATES

1. `memory/progress.md` current; questions doc entries for every ruling this amendment makes (unselected-children compile ruling, growth-cascade ruling, readout non-container rationale, vocabulary final list).
2. Golden fixtures: EVERY compiler/output change updates fixtures in the same commit; spec version stays v1.1 (additive-only changes: new types are data; if any EXISTING output byte changes, bump to v1.2 and log why).
3. Full local matrix green before every push (certification line in REPORT); webkit-in-CI caveat applies (watch CI webkit).
4. **Exit checklist:** vocabulary final list maintainer-approved before merge · kitchen-sink fixture compiles across 3 platforms · selection-compile + tree tab + responsive readout + grow-on-assign all real-input E2E green with enumerated edge cases · scope pass-through verified · REPORT.md section citing this doc and the five originating maintainer findings · maintainer hand-test (REQUIRED): assign out-of-bounds parent from inspector → frame grows → undo reverts both; compile selection-only; tree click sync both ways; inspector responsive readout matches compile section; kitchen-sink scene compiles with new types visible in mappings.

**Explicitly NOT here:** live canvas responsive preview (trigger recorded), drag-reparent in tree, AI/LLM integration, spec re-import, publishing `@open-draw/markdown`/`@open-draw/semantics` (maintainer publish decision AFTER this amendment + hand-test), more style profiles (content, forever cheap), culling, collab, crayon.