# Milestone 06 — Export & Visual Extensions

> Target: `docs/plans/milestone-06-export-visual-extensions.md` · Branch:
> `feat/export-visual-extensions` · Rides in the same PR as the code it
> describes (R-043 pattern). Rulings recorded in ADR-0005.

## Goal

Deliver the two remaining blueprint promises that 06 owns: **registry-driven pure-derive
exporters** (JSON + Markdown semantic projection for AI/dev handoff) and **visual render
extensions** (crayon/hand-drawn style with deterministic seeded variation + overlay system).
Export is DERIVED, human-readable, deterministic — and never the source of truth (ADR-0001 D2,
ADR-0005).

## Exit criteria

- `@open-draw/export-markdown` (new package): `Document → string` pure derive; walks the SAME
  semantic tree the canvas Inspector outline uses via `@open-draw/semantics` (`walkSemanticTree`) —
  the two presentations can never disagree (ADR-0004, ADR-0005).
- Markdown is semantic-only: hierarchy + display names (label → semantic → kind label chain)
  - semantic ids/properties; **deliberately NO geometry** — no fake visual fidelity.
- Byte-stable: same document → byte-identical output (no timestamps, no environment, no
  insertion-order surprises); fixture tests pin exact bytes (R-041).
- Export format registry: `EXPORT_FORMATS` (`json`, `markdown`) — pure derive, zero interpretation.
- Crayon render style: deterministic SEEDED variation (seed = pure function of shape id —
  same doc → same render, forever), fallback to standard renderer for unsupported kinds (R-021).
- Style selection is root-resolved (R-026): `meta.style` (landed in 05) drives it; `minimal` and
  `crayon` coexist — style is orthogonal to platform and shape kind.
- Overlays: presentation-only, rendered in world space at the shape corner and counter-scale
  under zoom (`1 / zoom`); document stores nothing about them (R-031).
- CI green; Codex adversarial review null-finding pass (R-043); maintainer hand-test gate.

## Scope (in)

- New package `@open-draw/export-markdown`.
- `@open-draw/renderer-svg`: style-profile render extension seam + crayon renderer extension;
  chip overlay rendering helpers.
- `@open-draw/contracts`: export format registry types; style-render contract types; `crayon` added
  to `STYLE_PROFILES`.
- `@open-draw/profiles`: `CRAYON_STYLE_PROFILE` data module.
- Playground: export buttons (download .md/.json), style switcher (`minimal`/`crayon`), overlay
  chips toggle.
- Byte-stability fixtures for Markdown and JSON formats.

## Scope (out)

- SDK publish/docs/versioning (milestone 07).
- More adapters (react adapter etc. — milestone 07 ecosystem).
- Custom illustrations beyond crayon.
- PNG/SVG bundle export (not in blueprint launch set).
- Responsive `derive()` reflow solver (isolated to dedicated follow-up PR per ADR-0005).

## Decision inventory (ADR-0005)

1. **Export package shape**: New package `@open-draw/export-markdown` (matching the target packages
   table in `packages/readme.md`). Format registry `EXPORT_FORMATS = { json: "json", markdown: "markdown" }`
   in `@open-draw/contracts`. JSON export is fulfilled by `serializeDocument` in `@open-draw/document`.
2. **Markdown projection spec**: Root shape = `##` heading (display name + platform/style annotation);
   sections = `###` (depth maps to heading level, capped at `######`); leaf shapes = bullet lines
   `- **DisplayName** — \`semantic-id\` (property: value...)`; hiddenOn rendered as `_(hidden on ...)_`annotation; conflict rendered as`⚠️ _[CONFLICT: ...]_`. Strictly NO geometry, coordinates, or
   dimensions.
3. **Crayon seed source + determinism**: Seed = stable pure 32-bit FNV-1a hash of the shape's
   `ShapeId` string; wobble perturbation is a pure trigonometric function of `(seed, geometry)`.
   Zero `Math.random()`. Byte-stable across machines and reloads.
4. **Crayon scope in 06**: Crayon only (`minimal` shipped in 05). Proves the style extension seam
   without bloat.
5. **Overlays in 06**: Presentation-only Semantic Tag Chip overlay. Rides shape coordinates,
   counter-scales under zoom by `1 / zoom`, never stored in document.
6. **Responsive derive() scope**: Isolated to dedicated PR `feat/responsive-derive` within Milestone 06.
7. **Export dependency rule**: `export-markdown → contracts + document + semantics + profiles`.
   Export is a terminal leaf — nothing imports export. ADR-0001 D2 table amended in ADR-0005.
8. **Export invocation surface**: Playground buttons call pure exporters directly on demand; snapshot
   at call time, non-reactive.

## Work breakdown

- `packages/contracts/src/export-contract.ts` — `EXPORT_FORMATS` registry + `Exporter` type
  (`(document, options?) → string`), `ExportOptions`.
- `packages/contracts/src/style-render-contract.ts` — style render contract types.
- `packages/contracts/src/profile-contract.ts` — add `crayon: "crayon"` to `STYLE_PROFILES`.
- `packages/profiles/src/styles/crayon/` — `CRAYON_STYLE_PROFILE` data module.
- `packages/export-markdown/` — new package, `export-markdown.ts` (walk + emit), byte-stability tests,
  fixtures.
- `packages/renderer-svg/src/styles/crayon/` — deterministic seeded wobble geometry (pure),
  per-kind renderers, fallback to standard for unsupported kinds.
- `packages/renderer-svg/src/overlays/` — chip overlay helper (counter-scales by `1 / zoom`).
- `apps/playground/` — export buttons (download .md/.json), style switcher (`minimal`/`crayon`),
  chip overlay toggle.
- Tests: byte-stability fixtures, markdown projection (hierarchy, names, properties, hiddenOn,
  conflicts), crayon determinism (same seed → same output), crayon fallback, overlay counter-scale.
- Docs: `docs/decisions/0005-export-visual-extensions.md`, this plan file.

## Transaction notes (R-018)

None — export is read-only derive; style switching uses `set-root-style` (shipped in 05); chips are
presentation-only (document untouched). Zero new document commands.

## Quoted rules (must appear in PR description)

R-002 zero deps / R-005 registries / R-006 parse-don't-validate / R-007 no enum / R-008 pure core /
R-012 uniform layout / R-014 naming / R-016 document = truth, export = derived projection /
R-020 package boundaries / R-021 styles never alter geometry / R-024 NONE baseline /
R-026 style root-resolved / R-028/R-029 hiddenOn + ghost / R-031 overlays cannot detach /
R-039 explicit names / R-041 no timestamps / R-042 labels vs ids / R-043 adversarial review.

## Verification

```bash
pnpm install
pnpm check
pnpm dev
```
