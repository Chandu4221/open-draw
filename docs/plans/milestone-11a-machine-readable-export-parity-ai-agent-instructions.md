# Milestone 11A — Machine-Readable Export Parity

**AI Agent Instructions** · baseline `cf183faa` (main, Nov 6, 2026) · branch `feat/export-shape-parity` · target doc: `docs/plans/milestone-11a-export-shape-parity-agent-instructions.md`

## 1. Context & Scope

**Problem.** Exported documents lose shape identity and semantics in two of three formats, and SVG carries no machine-readable data at all. Evidence (the "Profie Card" reference document, Nov 7):

- **Markdown**: flat bullet list. No shape IDs, no parent-child hierarchy, no spatial layout, no per-shape legend entries.
- **SVG**: zero semantic data. The root card's label ("Profie Card") appears ONLY inside a generic always-on legend ("heading / button / card" glossary) that duplicates info and attaches it to nothing. No data attributes, no aria, no shape refs.
- **JSON**: healthiest format, but missing style (fill/stroke/strokeWidth), z-order is implicit (map insertion order only), carries `meta.order: {}` noise on every shape, untagged shapes are indistinguishable from "forgot to tag", and has no semantic-registry fingerprint.

**Goal.** Make shape identity + semantics first-class in ALL export formats via ONE shared identifier system (chip IDs) plus computed export-time derivations. Nothing is stored on the document.

**Scope:**

- Work package A: JSON export parity
- Work package B: Markdown export enhancements (tree, boxes, ASCII sketch, on-demand legend)
- Work package C: SVG annotations layer (chip IDs, data attributes, a11y, on-demand legend)
- Work package D: tests, byte-stability, round-trip, fixture

**Non-goals (do not touch):**

- No document-model changes. No new semantics, no registry additions beyond chip-id derivation.
- No UI work in studio/playground beyond wiring export toggles that already have a home (export modal, PR #14/#16).
- No WCAG contrast report / theming / heading variants — those are separate milestone-11 items.
- No changes to render Style (crayon/minimal) or DesignStyle registries.

## 2. Binding Rules (quote these in every PR description)

- **R-025 (computed never stored):** chip IDs, explicit `shapeOrder`, untagged markers, legends, ASCII sketches are all export-time derivations. The document map is never mutated for export.
- **ADR-0002 D1 (single source of truth):** tree, order, and identity derive from the flat `shapes` map. Export walks the derived tree; it must not re-derive z-order in a way that can disagree with `shapeListInOrder`.
- **R-008 / R-018 (functional core, commit boundaries):** export functions stay pure, synchronous, deterministic.
- **No string literals:** any new serialized keys/values (chip prefix, legend headings, sketch markers) come from closed `as const` registries. Kebab-case serialized values, camelCase members.
- **Byte-stable doctrine:** same document → byte-identical export, forever. No timestamps, no locale-dependent formatting, no floating-point drift (round via a fixed helper with pinned precision).
- **R-044 discipline:** no pluginData interpretation in export; pluginData passes through untouched in JSON.

## 3. Chip ID System (shared across all formats) — ruling locked Nov 7

Every exported shape gets a **chip ID**: a short, stable, human-readable reference.

```
chipId = "#" + shapeId            // e.g. #s-7a01, #s-7a06
```

- Derived from the existing shape ID at export time. NEVER stored, NEVER regenerated (stability follows from shape-id stability).
- Format: `#s-7a01`. Prefix `#` from an `EXPORT_CHIP_PREFIX` const.
- Chip IDs are the join key between all three formats: SVG chip on shape ↔ markdown tree ref ↔ JSON shape entry.
- **Legend is on-demand and chip-keyed everywhere.** The generic glossary legend (heading/button/card cards with no shape attachment) is REMOVED from SVG and markdown exports. Legend generation, when enabled, maps:

```
#s-7a01 — Profie Card (Card)      // chipId — label (semantic displayName)
#s-7a03 — Alex Muller (Heading)
#s-7a05 — Software developer (Heading, level 5)
#s-7a06 — Hire Me (Button)
```

- Untagged shapes render as `#s-7a02 — (untagged ellipse)` style entries (kind label in parentheses).
- Export API gains a legend toggle (default: OFF). Chips themselves are always present in all formats (see per-format rules).

## 4. Work Package A — JSON Export Parity

Target package: `export-markdown` (JSON serializer) — same package, no new package.

**RULING (owner, Nov 7 — RATIFIED): Export-time projection.** The enriched JSON is a pure projection derived from the document at export time. `@open-draw/document` (`serialize-document.ts`, `meta-validation.ts`, the persisted `.opendraw` format) is **untouched**. chipId / shapeOrder / semantics fingerprint are never persisted (R-025 holds); `shapeOrder` does not create a second stored z-order (ADR-0002 D1 holds); export JSON is not required to be re-loadable as a document. Round-trip verification (D3) asserts _recoverability of doc-model truth from the export projection_, not `parseDocument(exportJson)`.

**Constants placement:**

- `EXPORT_CHIP_PREFIX = "#"` → `@open-draw/contracts` (neutral shared home; both export-markdown and renderer-svg need it, neither depends on the other).
- `SEMANTICS_REGISTRY_VERSION` → `@open-draw/semantics` (NOT contracts — contracts must not track semantics registry churn; only the JSON export consumes it).

**A1 — style block.** Every shape entry gains computed style fields where the shape model carries them (PR #10 fields): `fill`, `stroke`, `strokeWidth` (omit when unset; no null-padding).

**A2 — explicit shapeOrder.** Top-level computed `"shapeOrder": ShapeId[]` — a single flat array in canonical z-order, derived from map insertion order (equivalent to `shapeListInOrder`). Consumers must not need to know insertion-order semantics.

**A3 — meta noise.** Empty `meta.order: {}` objects are omitted from export (serialization-time skip; document untouched).

**A4 — untagged explicit.** Shapes without `meta.semantic` serialize `"semantic": null` (explicit key) so consumers distinguish untagged from absent. Document stays unchanged.

**A5 — registry fingerprint.** Top-level `"semantics": { "version": <SEMANTICS_REGISTRY_VERSION> }` — one const per registry build. Bump policy: any change to semantics registry content. Purpose: AI consumers validate tag vocabulary.

**A6 — chip IDs.** Each shape entry gains `"chipId": "#s-7a01"` so JSON aligns with SVG/markdown without consumers re-deriving it.

### Reference output (verbatim target for the fixture document)

```json
{
  "schema": { "version": 1 },
  "semantics": { "version": "<SEMANTICS_REGISTRY_VERSION>" },
  "shapeOrder": ["s-7a02", "s-7a03", "s-7a05", "s-7a06", "s-7a01"],
  "aiGuidance": { "...": "unchanged" },
  "shapes": {
    "s-7a01": {
      "id": "s-7a01",
      "chipId": "#s-7a01",
      "kind": "rect",
      "parentId": "canvas:root",
      "boundingBox": { "x": 386.03, "y": 125.25, "width": 605.62, "height": 319.96 },
      "label": "Profie Card",
      "meta": {
        "semantic": { "id": "card", "platform": "web", "properties": { "elevation": "low" } },
        "platform": "web",
        "role": "component"
      }
    },
    "s-7a02": {
      "id": "s-7a02",
      "chipId": "#s-7a02",
      "kind": "ellipse",
      "parentId": "s-7a01",
      "boundingBox": { "x": 44.21, "y": 53.36, "width": 198.15, "height": 193.05 },
      "meta": { "semantic": null }
    },
    "s-7a03": { "id": "s-7a03", "chipId": "#s-7a03", "kind": "text", "parentId": "s-7a01", "content": "Alex Muller", "meta": { "semantic": { "id": "heading", "platform": "web" } }, "boundingBox": { "x": 275.09, "y": 79.93, "width": 100. "height": 32 } },
    "s-7a05": { "id": "s-7a05", "chipId": "#s-7a05", "kind": "text", "parentId": "s-7a01", "content": "Software developer", "meta": { "semantic": { "id": "heading", "platform": "web", "properties": { "level": "5" } } }, "boundingBox": { "x": 271.81, "y": 114.59, "width": 162.54, "height": 32.39 } },
    "s-7a06": { "id": "s-7a06", "chipId": "#s-7a06", "kind": "rect", "parentId": "s-7a01", "content": "Hire Me", "label": "Hire Me", "meta": { "semantic": { "id": "button", "platform": "web" } }, "boundingBox": { "x": 268.45, "y": 161.66, "width": 222.14, "height": 60.30 } }
  }
}
```

(Exact key order and number formatting are pinned by the byte-stability tests; the snippet above is structural, not literal.)

## 5. Work Package B — Markdown Export Enhancements

### B1+B2+B3 — Shape-ref tree with hierarchy and boxes

Replace the flat bullet list with an indented tree. Every row:

```
- #s-7a01 — Profie Card (Card) — rect [x:386.03 y:125.25 w:605.62 h:319.96]
  - #s-7a02 — (untagged ellipse) [x:44.21 y:53.36 w:198.15 h:193.05]
  - #s-7a03 — Alex Muller (Heading) [x:275.09 y:79.93 w:100.00 h:32.00]
  - #s-7a05 — Software developer (Heading, level 5) [x:271.81 y:114.59 w:162.54 h:32.39]
  - #s-7a06 — Hire Me (Button) [x:268.45 y:161.66 w:222.14 h:60.30]
```

Rules:

- Chip ID first, then label or content, then semantic displayName + properties, then kind, then parent-relative box in fixed format (2-decimal, zero-padded via a shared formatter).
- Indentation = derived tree depth (walk `subtreeOf` in canonical order).
- Row format constants live in one registry module; the format string is assembled once.

### B4 — ASCII layout sketch (ruling: threshold-based)

**Auto-include when the document contains more than 5 shapes (excluding canvas root? No — counting all shapes); omit when ≤5.** The threshold is a const `ASCII_SKETCH_SHAPE_THRESHOLD = 5`.

Renderer spec (deterministic, byte-stable):

- Character grid, width fixed at 80 columns (const). Height derived from world bounding box aspect, capped at 40 rows; scale = min(80/w, 40/h) with fixed rounding.
- Containers (rects with children / root role containers): `┌ ─ ┐ │ └ ┘` box borders; label/chip rendered top-left inside if it fits, else chip only, else nothing.
- Ellipse: `◯` outline approximated on the grid (fixed template scaled to box).
- Text: content string placed at box center, clipped to box width + `…` ellipsis char.
- Buttons/semantic rects: content in `[ Hire Me ]` bracket style.
- Lines/pen-paths: skipped in sketch (noted in a caption line under the sketch: `sketch omits: lines, pen-paths` — only when such shapes exist).
- Overlap resolution: shapes render in z-order; later shapes overwrite earlier grid cells. Caption line: `ascii sketch — approximate spatial layout; boxes in tree above are exact`.
- No colors, no Unicode beyond the box-drawing/geometry set in the registry.

### B5 — On-demand legend (markdown)

- Default OFF. When enabled via export toggle, appends a `## Legend` section with the chip-keyed entries defined in section 3.
- The current generic glossary section is REMOVED entirely.

## 6. Work Package C — SVG Annotations Layer

Target package: `renderer-svg` (export path only — on-screen render unaffected) — confirmed separate export function; annotations behind export options, live render loop untouched.

**BOUNDARY RULING (Nov 7 — RATIFIED): Dependency inversion, per Codex proposal.**

- `renderer-svg` never imports `@open-draw/semantics` or `@open-draw/profiles` (AGENTS.md Section 5, ADR-0005).
- `ExportSvgOptions` gains: `includeAnnotations?: boolean` (default **true** in export), `includeLegend?: boolean` (default **false**), and `resolveDisplayName?: (shape: Shape) => string`.
- `data-semantic` reads `shape.meta.semantic?.id` directly (already on Shape); `data-chip-id` = `${EXPORT_CHIP_PREFIX}${shape.id}`.
- `<title>` / `aria-label`: `resolveDisplayName` if provided, else fallback `shape.label ?? SHAPE_KIND_LABELS[shape.kind] ?? shape.kind` (contracts-only).
- `apps/studio/src/document-io.ts` injects the resolver: `resolveShapeDisplayName(shape, profile)` resolved from root platform. Studio owns the semantics/profiles wiring; renderer stays profile-free and unit-testable in isolation.

**C1 — data attributes (always on in export SVG):**

```xml
<g data-shape-id="s-7a01" data-chip-id="#s-7a01" data-semantic="card"
   data-parent-id="canvas:root" ... >
```

- `data-semantic` omitted when untagged; `data-parent-id` omitted for root.
- One wrapper `<g>` per shape, wrapping all its rendered elements (shape + label text + clipPath refs). Keep existing clipPath structure.

**C2 — a11y (always on):**

- Each shape group gains `<title>#s-7a01 — Profie Card (Card)</title>` and `role="img"` + `aria-label` with the same resolved string (resolveShapeDisplayName chain: label → semantic → kind).

**C3 — chip ID chips on shapes (ruling: always render chips; legend on demand):**

- Every shape renders a small chip with its chip ID (`#s-7a03`), positioned top-left outside/at the shape's top-left corner, in the existing legend gray styling (small monospace, `#475569` on `#e2e8f0`, rx 3).
- Chips render in a separate `<g class="annotation-chips">` layer ON TOP, so consumers can strip the layer with one selector. Chips must not be clipped by shape clipPaths.
- Chip collision rule: if two chips would overlap (same top-left within grid cell), offset the later one down by chip height + 2px. Deterministic by z-order.

**C4 — legend generation on demand:**

- The current always-on `<g class="diagram-legend">` generic glossary is REMOVED from the default export.
- Export toggle (shared with markdown legend option, default OFF) generates a chip-keyed legend group at the bottom, same visual slot as today, but entries are `#s-7a01 — Profie Card (Card)` per section 3.

## 7. Work Package D — Tests & CI

**D1 — fixture.** Add the "Profie Card" document (the Nov 7 upload) as a committed test fixture: `fixtures/profie-card.document.json` (document JSON only). All three formats are tested against it.

**D2 — byte-stability tests:**

- Export each format twice from the same doc → byte-identical (snapshot tests with committed expected outputs for all 3 formats, regenerated deliberately only).
- Floating-point: assert pinned 2-decimal formatting; assert no `NaN`/`Infinity` can reach serialization (throw typed error at boundary instead).

**D3 — round-trip test:**

- From export JSON: rebuild shape count, parentId graph, z-order (via shapeOrder), semantic ids, styles. Assert full recoverability of the doc-model truth (excluding view state).
- From export SVG (parse with a fixed string-parse helper, no DOM): assert every shape id in the JSON has a matching `data-shape-id` group, chip layer entries match, and no chip references a missing shape.

**D4 — regression guards:**

- Live canvas render (non-export) byte-identical before/after C-package changes (guards the flag).
- Legend OFF default: assert no `diagram-legend` / `## Legend` in default outputs.
- ASCII threshold: fixture with ≤5 shapes omits sketch; >5 includes it.
- Extend existing export-markdown tests (role-aware tests, custom naming tests from PR #8) — all must pass unchanged in behavior not covered by this spec (root roles, guidance sections, creativity meter).

**D5 — CI:** no workflow changes expected; runs under the existing PR fast tier. Note in PR if any suite exceeds budget.

## 8. File Map (expected touch points — verify against repo before coding)

| Package / App              | Files (approx)                                                                                     | Work   |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------ |
| `export-markdown/src`      | json serializer, markdown serializer, new `chip-id.ts`, `ascii-sketch.ts`, `legend.ts`, formatters | A, B   |
| `renderer-svg/src`         | export svg builder (annotations layer, chips, flag)                                                | C      |
| `semantics/src`            | registry version const                                                                             | A5     |
| `document/src` (READ ONLY) | no changes; export uses existing subtreeOf/shapeListInOrder                                        | —      |
| `ui` + studio/playground   | wire legend toggle + (if applicable) sketch toggle in export modal                                 | B5, C4 |
| tests                      | fixtures + new suites in export-markdown, renderer-svg                                             | D      |

Respect ~300-line file cap: `ascii-sketch.ts` and markdown serializer additions may need splitting (sketch grid vs renderer vs markers).

## 9. Execution Order & PR Slicing

1. **PR 1 — chip-id registry + JSON parity (A1–A6):** chip consts, formatters, JSON serializer changes + fixture + byte-stability tests for JSON.
2. **PR 2 — markdown tree + legend (B1–B3, B5):** tree rows, on-demand legend, remove glossary + tests.
3. **PR 3 — ASCII sketch (B4):** renderer behind threshold + snapshot tests for fixture (fixture has 5 shapes → add second fixture with 7+ shapes to prove inclusion).
4. **PR 4 — SVG annotations (C1–C4):** data attrs, title/aria, chip layer, on-demand legend + guard test on live render.
5. **PR 5 — wiring + docs:** export modal toggles, **ADR-0010 (Export Parity, amending ADR-0005 D2)** recording the chip-ID ruling, on-demand legend ruling, export-projection ruling, and renderer-svg dependency inversion, roadmap checkmarks.

Each PR: conventional-commit title, quote binding rules in description, Codex review round per R-043 before next PR.

## 10. Acceptance Checklist (hand-test gate — green CI is not sufficient)

- [ ] Export the Profie Card doc in all 3 formats; every shape appears with the same chip ID in all three.
- [ ] SVG: open in browser — chips visible, not clipped, no overlap on fixture; "Profie Card" identity recoverable from `<title>` and data attributes alone.
- [ ] SVG: strip `annotation-chips` group in DevTools — visual export unchanged from pre-change default (minus removed legend).
- [ ] Markdown: paste into an AI chat and ask it to describe the layout — it must correctly state hierarchy (ellipse inside card, not sibling of it) and rough positions.
- [ ] JSON: `shapeOrder` matches visible z-order in canvas; style fields match inspector values.
- [ ] Default exports contain NO legend in any format; toggled exports show chip-keyed legend only.
- [ ] ≤5-shape doc omits sketch; >5-shape doc includes it; sketch caption present when shapes omitted.
- [ ] Studio + playground parity: same toggles, same outputs.
- [ ] Live canvas render unchanged (no annotation layer on screen, no perf regression in render loop).
- [ ] Byte-stability suite green, twice-run identical.

## 11. Open Decisions (flag in PR, do not decide unilaterally)

1. **Chip placement collision policy** for dense docs (current spec: deterministic top-left + down-offset) — confirm visually acceptable on a large real doc.
2. **ASCII sketch for nested containers**: current spec renders only top-level boxes + first-level children; deeper nesting flattens into the grid. Confirm acceptable vs. recursive mini-boxes.
3. **`semantics.version` value scheme** — recommend integer (SEMANTICS_REGISTRY_VERSION = 1), decide in PR 1.
4. **Whether JSON export should also include an `annotations` copy of chip → resolved displayName map** (helps AI consumers that read only JSON) — recommend yes, cheap and derived.

**RESOLVED (Nov 7 owner rulings):**

- ~~JSON export location~~ → **export-time projection in export-markdown; document package and persisted format untouched.** No `meta-validation.ts` null change; no stored derivations (R-025, D1 preserved). Codex single-canonical-format option rejected for 11A (would be a schema decision; can be raised separately if ever wanted).
- ~~renderer-svg semantics access~~ → **dependency inversion via ExportSvgOptions resolver injection** (Codex proposal adopted as-is).
- ~~constants home~~ → `EXPORT_CHIP_PREFIX` in contracts, `SEMANTICS_REGISTRY_VERSION` in semantics (not contracts).

## 12. Reference Fixture

Commit as `fixtures/profie-card.document.json` (exact upload from Nov 7): the document JSON with shapes s-7a01 (rect, card, root role component), s-7a02 (ellipse, untagged), s-7a03 (text "Alex Muller", heading), s-7a05 (text "Software developer", heading level 5), s-7a06 (rect "Hire Me", button). Use the uploaded `opendraw-document.json` verbatim as the fixture source of truth.

---

_Generated for owner review + Codex adversarial round. Agent does not write the repo; Chandra pastes after ratification._
