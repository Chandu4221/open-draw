# Milestone 05 — Semantic Wireframing

> Target: `docs/plans/milestone-05-semantic-wireframing.md` · Branch: `feat/semantic-wireframing` ·
> Rides in the same PR as the code it describes (R-043 pattern).
> Status: Ratified · Rulings 1–9 codified in ADR-0004.

## Goal

Stand up the **optional semantics layer** from the blueprint (§ Semantics, § Platform profiles, §
Responsive design system): semantic types per platform, the label/name chain, per-type property
schemas that an inspector derives its controls from, semantic hierarchy (page → section →
contents), and **platform/style profiles as data modules** with root-resolution inheritance.
Core ships NO universal tag list — vocabulary arrives from profile data (adding a platform =
data module, zero core code).

## Exit criteria

- A platform profile (web first; android-native + flutter as data stubs or full, per ruling 5)
  declares its semantic vocabulary as pure data; the core (`semantics`, `canvas`, `renderer`,
  `document`) contains zero platform-specific branches or strings.
- Tagging a shape with a semantic stores `meta.semantic = { id, platform }` (contract from 02);
  untagged = NONE = valid baseline, never a "fallback".
- Display name derivation uses the ruling-02 chain: label → semantic display name →
  `SHAPE_KIND_LABELS[kind]` — display name is NEVER stored.
- Platform switch with foreign tags NEVER converts or deletes: tags stay stored, conflict is
  **computed** (one check, R-025) and surfaced; free switch-back, data preserved.
- Platform AND style are settable ONLY on root shapes (pages); children inherit both by tree
  position; validation rejects platform/style on non-roots.
- Inspector: given a selected shape + active profile, derives its controls from the semantic's
  **property schema** (data-driven, no per-semantic hardcoded UI).
- Responsive controls (order/visibility per device type) already stored since 02 — this
  milestone renders hiddenOn ghosts as **presentation-only** (dashed/dimmed via
  `renderer-svg` + `RenderOptions.activeDeviceType`), document stores only the stored data.
- CI green; Codex adversarial review null-finding pass (R-043); maintainer hand-test gate.

## Scope (in)

- New package `@open-draw/semantics`: pure semantic layer — tagging checks, conflict
  computation, display-name resolution, semantic tree walk (page → section → contents order).
- New package `@open-draw/profiles`: platform profile data modules (web vocabulary first),
  root semantic per platform (PAGE/SCREEN), device types (web only), style profile skeleton
  (minimal).
- `@open-draw/contracts`: semantic/profile contract types (typed, registries-as-data).
- `@open-draw/document`: validation additions (platform/style only on roots, semantic id
  format), semantic-aware hierarchy checks; NO vocabulary in document.
- `@open-draw/renderer-svg`: presentation-only ghost rendering for hiddenOn (via
  `RenderOptions.activeDeviceType`); `@open-draw/canvas` carries active device-type view state
  only (transient, shell-owned) and no semantic logic.
- Inspector: minimal data-driven inspector surface (ruling 6 decides where it lives).
- Export dependency note: markdown export (semantic projection) is milestone 06 — only the
  semantic walk seam it will consume is designed here.

## Scope (out)

- Markdown export implementation (milestone 06).
- Crayon/hand-drawn render styles (milestone 06; style profile data shape only here).
- Full responsive reflow engine `derive()` (ruling 4 decides: in or deferred).
- Studio full UI (only what ruling 6 rules).

## Decision inventory (BLOCKING — rule before code)

1. **[RULING] Semantic id format + typing.** Proposal: `SemanticId` = branded
   `"<platform>:<semantic>"`-resolved value? OR semantic ids are per-profile local keys
   (`NAVBAR`) and the STORED form (per 02 contract) stays `{ id: string; platform: Platform }`,
   with a typed resolver in semantics that turns (profile, id) into a validated
   `ResolvedSemantic` or typed throw for foreign ids. Recommendation: keep the 02 stored
   contract untouched; resolution is a pure function in `@open-draw/semantics`. Confirm?
2. **[RULING] Label chain (already agreed in 02, restate for codification).** `getDisplayName`:
   label → semantic display name (from profile data) → `SHAPE_KIND_LABELS[kind]`. Confirmed in
   `display-name.ts`. Nothing new to store. Confirm as final?
3. **[RULING] Conflict state: computed, never stored.** Foreign-tag conflict (semantic from
   platform A while page root is platform B) = pure function returns
   `SEMANTIC_CONFLICTS.conflicted` + reason; inspector/export render it; NOTHING is written
   back to the document. Confirm? (Silent NONE = silent data loss — forbidden; computed conflict
   matches R-025.)
4. **[RULING] Responsive derive() in 05 or deferred?** Section `direction` + child
   `order`/`hiddenOn` are stored since 02. Options: (a) ship `derive(document, deviceClass)`
   pure reflow in 05 — the biggest engine piece, byte-stable, browser never measures; (b)
   defer to 06, 05 ships only ghost rendering + stored-data editing UI. Recommendation:
   (b) defer — 05 is already large (two new packages + inspector), and derive() was explicitly
   deferred with "design flex props TOGETHER WITH derive()". Rule?
5. **[RULING] Profile coverage in 05.** Web full vocabulary (NAVBAR, BUTTON, FOOTER, CARD...),
   others? Options: (a) web full + android-native/flutter minimal-but-real vocabularies; (b)
   web only, stubs for others. Recommendation: (a) minimal-but-real — proves the
   "profile = data module" claim with ≥2 real vocabularies. Rule?
6. **[RULING] Inspector surface: playground or Studio?** Options: (a) minimal data-driven
   inspector in the playground (dogfood surface, consistent with all milestones so far);
   (b) boot up Studio now with the inspector as its first real feature. Recommendation: (a)
   playground — Studio starts at integration milestone with real surface area to integrate.
   Rule?
7. **[RULING] Style profile data shape.** Root-resolution says style resolves from root like
   platform. Proposal: `STYLE_PROFILES` data registry with `minimal` only in 05 (id + display
   name + reserved render hooks field, unused); crayon etc. land in 06. Confirm?
8. **[RULING] Property schema format + value storage (review-1 findings 2 + 5).** Per-semantic
   property schemas drive inspector controls. Proposal: pure data
   `PropertySchema = { id: PropertyId; control: ControlId (from CONTROL registry:
text/select/toggle/number); label: string; options?/range? }` — hand-rolled validation at
   boundaries (Zod-free precedent). VALUE STORAGE: `SemanticTag` in document gains
   `properties?: Readonly<Record<string, string | number | boolean>>` (validated, JSON-only
   primitives). Validation = envelope only (R-044 pattern): type-shape check at parse,
   malformed = typed throw; keys validated against the active profile's schema at
   inspector-time when the profile is loaded; unknown keys preserved OPAQUELY (a document
   from profile A must round-trip on a machine without profile A). Rule?
9. **[RULING — NEW, review-1 finding 1] Display-name split.** `getDisplayName(shape)` stays in
   `@open-draw/document` as base resolver (`shape.label ?? SHAPE_KIND_LABELS[shape.kind]` —
   never imports profiles). New `resolveShapeDisplayName(shape, profile?)` in
   `@open-draw/semantics` implements the full chain: label → semantic display name (profile
   data) → SHAPE_KIND_LABELS. Confirm?

## Work breakdown (sketch — final file list after rulings)

- `packages/contracts/src/semantic-contract.ts` — stored `meta.semantic` contract types,
  `SEMANTIC_CONFLICTS` registry, `PropertySchema`/`ControlId` types.
- `packages/contracts/src/profile-contract.ts` — `PlatformProfile` / `StyleProfile` data
  contracts, `PLATFORMS` already exists (web/androidNative/flutter/ios — confirm ios stub stays).
- `packages/profiles/src/platforms/web/index.ts` — WEB vocabulary data, root semantic PAGE,
  device types (mobile…large-screen, reuse `DEVICE_TYPES`), per-semantic property schemas.
- `packages/profiles/src/platforms/android-native/…`, `…/flutter/…` — per ruling 5.
- `packages/profiles/src/styles/minimal/…` — per ruling 7.
- `packages/semantics/src/` — resolve-semantic, compute-conflicts, semantic-tree-walk,
  display-name chain wiring (one module per function family; NOT a closed registry — plain
  module files).
- `packages/document/src/validation.ts` — platform/style-on-root-only rules, semantic id
  format checks; `@open-draw/document` must NOT depend on `profiles` or `semantics`
  (kinds of rules stay contract-typed).
- `packages/renderer-svg/` — ghost presentation: `RenderOptions` gains
  `activeDeviceType?: DeviceType`; shapes whose `meta.hiddenOn` includes it render
  ghosted (opacity 0.35, stroke-dasharray 4 4) — presentation only, document untouched.
  Ghost rendering lives HERE, not in canvas (review-1 finding 3: canvas never renders SVG).
- New document commands (review-1 finding 5 — full inventory, one folder each in
  `packages/document/src/commands/`, all reversible with stored inverse):
  1. `set-shape-semantic` — sets `meta.semantic` (incl. `properties`) or clears to
     undefined (R-024, NONE baseline).
  2. `set-root-platform` — sets `meta.platform` on root pages ONLY (rejects non-roots,
     typed error).
  3. `set-root-style` — sets `meta.style` on root pages ONLY; implies NEW stored field
     `meta.style?: StyleId` + `STYLE_PROFILES` registry (was deferred since 02 — now
     consciously in scope via ruling 7).
  4. `set-shape-hidden-on` — updates `meta.hiddenOn` (R-028/R-029).
  5. `set-shape-order` — updates `meta.order[deviceType]` (R-027).
- `packages/document/src/shape.ts` — `SemanticTag.properties?` field (review-1 finding 2),
  `meta.style?: StyleId` + `meta.platform?: PlatformId` (both NEW root-only meta fields,
  both rejected on non-roots by validation); serialize/parse round-trip both with insertion-order
  keys and present-only emission.
- Playground inspector panel: schema-driven controls, conflict warnings ("not an Android
  semantic"), retag/clear-to-NONE actions.
- Tests: resolution (valid/foreign/malformed), conflict computation, root-only validation
  rejections, display-name chain (base in document, full chain in semantics), schema→control
  derivation, semantic properties envelope round-trip (incl. foreign-profile opaque keys),
  ghost rendering presentation-only, semantic tree walk order, all 5 commands incl. non-root
  rejection for set-root-platform/style.
- Docs: `docs/decisions/0004-semantic-wireframing.md` (records rulings 1–9), this plan file.

## Dependency placement (extends ADR-0001 D2 — amend table in this PR)

- `profiles → contracts` ONLY (pure data).
- `semantics → contracts + document + profiles` (review-1 findings 1 + 4: needs Document/Shape
  types for walks/conflicts and profile data for display resolution; graph stays acyclic).
- `document → contracts` ONLY (unchanged; never profiles/semantics).
- `canvas → contracts` (+ semantics ONLY for read-only display resolution? default: NO —
  canvas stays semantic-free, playground resolves display names).
- `playground → everything` (wires).
- No package may import another package's `/src/` internals (02b ruling: public roots only).

## Transaction notes (R-018)

- Tagging/retagging/clearing a semantic = one `SetShapeSemantic` command (new, named
  command from registry, inverse = previous value — reversible).
- Setting platform/style on a root = one command each; switching platform does NOT touch any
  child's stored semantic (children inherit by position; foreign tags become computed
  conflicts).
- All inspector edits batch per gesture as usual.

## Quoted rules (must appear in PR description)

R-005 registries / R-006 parse-don't-validate / R-008 pure core no classes / R-009 pure
machines / R-011+R-012 named commands one-folder / R-016 document truth / R-017 camera
shell-owned / R-018 one gesture one transaction / R-024 semantic absent = NONE /
R-025 platform conflict = computed check / R-026 root-inherited style / R-028 hiddenOn
visibility / R-036 forever-contract gate / R-043 adversarial review / R-044 opaque envelope
pattern (reused for profile data where relevant).

## Verification (Chandra runs locally)

```bash
git checkout main && git pull
git checkout -b feat/semantic-wireframing
# paste files, then:
pnpm install
pnpm check
pnpm dev   # playground: tag shapes, switch platform, inspect conflicts, toggle visibility
```

## Hand-test gate (green tests ≠ working product)

1. Tag a rect as WEB BUTTON → inspector derives BUTTON's property schema controls.
2. Switch page platform to android → BUTTON tag stays stored, inspector shows conflict
   warning; switch back → warning clears, tag intact (no data loss).
3. Set platform on a non-root shape → typed validation error.
4. Clear semantic → NONE baseline, exportable.
5. Hide a shape on "mobile" device type → ghost renders dashed/dimmed at mobile; document
   diff shows only the hiddenOn entry.

## Review gate

Codex adversarial review BEFORE paste (R-043); repeat until null-finding pass. Red-first tests
for every confirmed finding.

## Pending follow-ups (separate branches, do NOT ride in this PR)

- `build/ci-runner-pin` — ubuntu-24.04 pin (STILL open since 02).
- Tag decision: v0.2.0 (02b+03) / whether 04 and 05 batch into v0.3.0.
- R-043 amendment ("repeat until null-finding pass") — now effectively proven by 03/04 practice.
