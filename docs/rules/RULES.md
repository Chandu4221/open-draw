# OpenDraw Project Rules

Binding, append-only. Every contributor — human developer or AI agent — reads this file **before** touching the repository, and must **quote the rule** they are implementing. If you cannot quote a rule for what you are doing, you are inventing — stop and discuss instead.

- Rules are **numbered** (`R-###`) and **append-only**: a rule is never silently edited. To change or supersede a rule, add a new numbered entry that references the old one.
- Every rule with design rationale gets an ADR in `docs/decisions/`. This file is the **what**; ADRs are the **why**.
- **Drift protocol:** any noticed drift from these rules is (1) flagged immediately, (2) reproduced by a RED failing test committed **first**, (3) fixed second. Never "fix quietly."
- **Decision pipeline (CI/CD for ideas):** idea → discussion → decision (entry here + ADR) → validation (RED test / spike) → implementation → review gate. Nothing is built on executor initiative alone.
- **Review gate:** every PR description must name the rule(s) or decision entry it implements (e.g. "implements R-008"). A PR that cannot name its rule is presumption — reject.

---

## Licensing & Product

- **R-001 — Licensing purity.** The core is MIT. No dependency, asset, or font may require attribution or carry viral licensing. This is a founding product constraint, not a legal formality.
- **R-002 — Zero runtime dependencies by default.** `dependencies: {}` in packages unless a micro-dependency (<2KB, clean license, explicit sign-off) is justified in an ADR.
- **R-003 — Bundled assets only.** No runtime fetches to third-party CDNs (fonts, icons, maps). Material Symbols (Apache-2.0) is bundled/self-hosted. Passes R-001; still never from Google's CDN.
- **R-004 — Two products, one rule:** `@open-draw/canvas` is useful without Studio; Studio consumes the SDK and duplicates no core behavior.

## Code Doctrine

- **R-005 — No string literals in internals.** Every stringly concept (semantic types, platform ids, device classes, actions, commands, states, event names) has ONE canonical `as const` registry from which a TS type is derived (`keyof typeof`). Internals carry zero string literals — typed ids (including branded ids like `ShapeId`), no `===` against quoted strings. A typo is a compile error, never a runtime bug.
- **R-006 — Boundaries validate loudly.** At serialization boundaries (document load, plugin data, profile input), validate and convert to typed values immediately. Unknown data = typed error thrown, never silent fallback, coercion, or guessing.
- **R-007 — No `enum`.** Use `as const` objects — one artifact that is both runtime registry and type source.
- **R-008 — Functional core, imperative shell.** Behavior = small, independent, pure functions over plain typed data. Side effects (DOM, events, timers) live only in thin imperative shells. Shared context is passed explicitly as a parameter — no globals or singleton reach-ins.
- **R-009 — State machines are pure tables.** `(state, event) → state` transition tables + adapters. No scattered booleans, no implicit mode flags.
- **R-010 — Anti-god-object.** Cohesion by module: all functions for a concept live in one home; module internals are not exported. No source file over ~300 lines. Guard against the opposite failure — over-fragmentation ("functional soup") — the same way.
- **R-011 — Named actions only.** Input bindings map events to named actions from a registry; they never implement behavior. Actions live in the interaction system.

## Naming & Structure

- **R-012 — Uniform registry layout.** For closed registries (actions, commands, shape types, states): one item = one folder = one `index.ts`, always — no file/folder mixing by weight. Registry index exports `export const X = { ... } as const`. Structure is uniform; contents carry the weight.
- **R-013 — Registry shorthand keys.** `{ move, resize }`, never `{ move: move }` — a mismatch must be unwritable.
- **R-014 — Naming conventions** (lint-enforced): packages `@open-draw/<kebab-case>`; files/dirs `kebab-case`; types `PascalCase` nouns; commands `PascalCase` verb-object (`CreateShape`); functions/variables `camelCase`; const registries `SCREAMING_SNAKE`; enum-like const-object members `camelCase`; serialized keys `kebab-case`, frozen once. Every exported name's kind must be guessable from casing alone; every string findable by Ctrl+click, never by grep.
- **R-015 — Tests named by behavior.** `describe` = subject, `it` = behavior in plain language.
- **R-039 — Explicit over short.** A name states exactly what it is — no abbreviation a future developer or AI agent must decode. The geometry frame is `BoundingBox` as both type and field (`shape.boundingBox`); the device form-factor registry is `DeviceType`. "Read it and get it." Renaming toward explicitness is doctrine, not churn.

## Architecture

- **R-016 — Document is the single source of truth.** The document model is canonical; SVG is a rendering result. Canvas never caches its own copy of truth; mutations go through typed commands only. Test for placement: "does this survive save + reload?" — yes → document; no → transient canvas state.
- **R-017 — Camera is a transform, never geometry.** Pan/zoom never rewrites shape coordinates.
- **R-018 — Commit-boundary events only.** One gesture = one committed transaction = one change event with the batch. Subscribers observe and react; they are never commanded to update. Transient interaction state (drag previews, hover) is NOT reactive — imperative shell, directly.
- **R-019 — Named events from the registry.** A small typed event set (`documentChanged`, `selectionChanged`, `historyChanged`). No signal graphs, no auto-tracking reactivity engines. Fine-grained reactivity lives only inside Studio's React UI, via a thin event→state adapter.
- **R-020 — Package boundaries are enforced mechanically.** Dependency-cruiser + ESLint `no-restricted-imports` validate the blueprint dependency table in CI (contracts/document: no React, no SVG-DOM; renderer: never canonical state; export adapters: never source of truth; React adapter: no reimplemented engine logic). A boundary that is not lint-enforced is not a boundary.
- **R-021 — Render styles never alter geometry or semantics.** Regular / crayon / hand-drawn are rendering extensions of the same shape identity. Deterministic, seeded variation. Defined fallback to the standard renderer.
- **R-022 — Clean-room references.** Pattern-level study of tldraw/excalidraw/Figma is allowed and encouraged. Copying code from them is forbidden — incompatible licensing poisons the founding differentiator.
- **R-041 — Version-only schema; no timestamps, ever.** Serialized documents carry `schema: { version }` and nothing time-related — no `createdAt`, no `updatedAt`, anywhere in drawing data. Recency is a save/file-layer concern, never document data. Rationale: timestamps serve sync-conflict/recency/audit roles this engine does not need, and cost undo churn, injected clocks, fixture stability, and diff noise.
- **R-042 — Labels describe for humans; ids identify for machines.** Neither does the other's job. `label` is the only human-authored stored field; display names are DERIVED (label → semantic display name → `SHAPE_KIND_LABELS` fallback) and never stored.
- **R-044 — Opaque plugin data forward compatibility namespace.** `meta.pluginData` is an opaque forward-compatibility namespace; R-006 applies to the envelope (`PluginId` format and JSON-serializability check at serialize time — a non-serializable value is a typed throw), never to contents. Document serialization and parsing preserve unknown `PluginId` entries byte-stably without interpreting or dropping them.

## Semantics & Platforms

- **R-023 — Platform-coupled semantics.** Each platform profile (WEB, ANDROID_NATIVE/Material3, FLUTTER, IOS, future) is a data module carrying its own semantic vocabulary, root semantic (PAGE / SCREEN), and device classes (web only). The canvas core ships no universal tag list. Adding a platform = data, not code.
- **R-024 — NONE is the untagged default.** A shape with no semantic tag is complete and valid (intrinsic geometry tag only, rectangle→rectangle). NONE is not a fallback; it is the baseline.
- **R-025 — Foreign tags are flagged, never deleted.** When a root's platform changes, tags from another platform remain stored, marked CONFLICTED, and surfaced as warnings (inspector + export). Only a deliberate user action retags or clears to NONE. Silent conversion = silent data loss = forbidden.
- **R-026 — Root resolution.** Platform and design style are properties of ROOT shapes (immediate children of the canvas) only. Nested children and grandchildren inherit both by tree position and never store either. Validation rejects platform/style meta on non-roots. The canvas is a neutral, unlimited free plane — multiple roots with different platforms may coexist in one document.
- **R-027 — Child responsive vocabulary is exactly two controls:** ORDER (flex order) and VISIBILITY (per device class). Nothing else. No per-child widths, no per-class geometry, no media queries, no free-text breakpoints.
- **R-028 — Five device classes:** mobile, tablet, laptop, desktop, large-screen — const registry, Material Symbols icon presentation, all-visible by default, click to toggle. Language-agnostic; the registry keys never surface to users.
- **R-029 — Shapes hidden at the active device class render as ghosts** (dashed/dimmed, click-to-reenable). Presentation only; the document stores only the visibility boolean.
- **R-030 — Pure solver is spec truth.** Responsive reflow is a pure `derive(scene, deviceClass)` function. The browser is a visualizer; browser measurements never feed the export. The same derive() output drives canvas render AND compile — byte-stable by construction. Active device class is transient view state, not persisted.
- **R-031 — Overlays cannot detach.** Chips, handles, and any overlay ride the shape's group (transform-invariant by construction), counter-scale under zoom, and are presentation state only — never stored in the document.
- **R-040 — Device form-factors are DeviceTypes** (supersedes the vocabulary of R-028; the five-entry registry itself is unchanged). The registry is `DEVICE_TYPES` / `DeviceType` / `DEVICE_TYPE_BY_VALUE` in `device-types.ts` — "device class" implied a device taxonomy, but these are form-factor width buckets a shape's responsive data targets. Wherever R-023, R-026, R-027, R-029, and R-030 say "device class(es)", read "device type(s)". The keys (mobile, tablet, laptop, desktop, largeScreen) and serialized values (kebab-case) are the truth in code.

## Workflow & CI/CD

- **R-032 — Branch naming:** `<type>/<kebab-case-summary>` with conventional-commit types: `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `chore` (`perf` reserved; `ci` folds into `build`). One branch = one concern. Short-lived; deleted after merge. Regex-enforced in CI.
- **R-033 — Commit/PR titles use the same type vocabulary.** When in doubt, the smaller-scope type wins — the changelog must not over-promise.
- **R-034 — main is always green.** No merge without green CI. No direct pushes to main. No releases from non-main commits; the release workflow verifies the tag commit is on main.
- **R-035 — Tiered pipeline.** Tier 1 (PR): format/lint/typecheck/unit, fast. Tier 2 (main): full gate incl. build + E2E, once per merge. Tier 3 (tag): cached build + deploy only — tests are skipped because the tagged commit already passed Tier 2. No workflows on raw branch pushes. E2E on PRs is opt-in (`workflow_dispatch`).
- **R-036 — Releases are cut by tags only** (`v0.x.y`, semver; `1.0.0` only when the SDK contract is stood behind). GitHub Pages serves ONLY the latest production tagged release — Studio + playground from that exact tag. Never dev state. Local development uses the playground via `pnpm dev`.
- **R-037 — Squash-merge PRs** so conventional-commit titles feed the tag changelog automatically.
- **R-038 — No invention.** Unresolved questions go to a question log (`docs/od-questions.md`), not into code. Spike, don't assume. If an implementation detail isn't covered by a rule or decision, it's a discussion, not a judgment call.
- **R-043 — Agent delegation protocol.** Work may be offloaded to an AI agent only when the ruling it implements already exists (rule or ADR); decisions are never delegated. Every agent deliverable must ship with: (1) a **decision inventory** — every judgment made while transcribing, listed explicitly; (2) **quoted rules per file**; (3) **exact verification commands**; (4) an **independent adversarial review** before paste — a second reviewer (fresh agent session or equivalent) attacks the deliverable for defects and rule violations. A deliverable without an inventory or review is presumption — reject (extends R-038 and the review gate to delegated work).

---

## Changelog

- **2026-10-29** — Initial ruleset seeded (R-001…R-038) from the founding design sessions (licensing, code doctrine, naming, architecture, semantics/platforms, responsive system, workflow/CI-CD). Supersedes nothing; this is the baseline.
- **2026-10-31** — Appended R-039…R-043 from the Oct 30–31 design sessions: naming explicitness (R-039), DeviceType vocabulary supersession over R-028's wording (R-040), version-only schema / no timestamps (R-041), derived display names / labels-vs-ids (R-042), agent delegation protocol (R-043). Appended R-044 (opaque plugin data forward-compatibility namespace exemption from R-006 content validation) for milestone 04. No baseline rule text was edited (append-only).
