# ADR-0005 — Export Exporters & Visual Extensions

- **Status:** Accepted
- **Date:** 2026-11-01
- **Supersedes:** amends ADR-0001 D2 (dependency table)
- **Rules implemented:** R-002, R-005, R-006, R-007, R-008, R-012, R-014, R-016, R-020, R-021, R-026, R-031, R-039, R-041, R-042

## Context

OpenDraw's founding architecture emphasizes that visual geometry, stored truth, semantic projections, and rendering styles are strictly orthogonal:

1. **Document is the single source of truth (R-016)**: The canonical `Document` holds shapes, roots, and properties. It never stores rendered SVG, layout measurements, or export files.
2. **Export is derived, never a source of truth (ADR-0001 D2, R-016)**: Export is a pure snapshot projection `Document → string` at call time. It is not reactive, stores nothing, and can never corrupt or modify the document.
3. **Render styles never alter geometry or semantics (R-021)**: Styles like `crayon` / hand-drawn are pure rendering extensions. They do not rewrite shape bounding boxes or properties.
4. **Style selection is root-resolved (R-026)**: Style is stored on root shapes (`meta.style`) and inherited by children according to tree position.
5. **Overlays cannot detach (R-031)**: Overlays (such as semantic tag chips) ride the shape in world coordinates, counter-scale under camera zoom (`1 / zoom`), and are transient presentation-only SVG elements.

## Decision

### D1 — Export format contracts and package boundary

- In `@open-draw/contracts`, export formats are defined as a closed `as const` registry (R-005, R-007):
  ```ts
  export const EXPORT_FORMATS = {
    json: "json",
    markdown: "markdown",
  } as const;
  export type ExportFormat = keyof typeof EXPORT_FORMATS;
  ```
- `@open-draw/contracts` has zero dependencies and defines only types and registries (R-002, ADR-0001 D2). It **never** imports exporter implementations.
- New standalone package `@open-draw/export-markdown`:
  - Responsibility: pure Markdown semantic projection `(doc: Document, options?: MarkdownExportOptions) => string`.
  - Terminal leaf: `@open-draw/export-markdown` may depend on `contracts`, `document`, `semantics`, `profiles`. Nothing in the core engine ever imports `export-markdown`.
- JSON export is fulfilled by `serializeDocument(doc)` from `@open-draw/document`.

### D2 — Markdown projection specification (semantic-only)

- Consumes `walkSemanticTree(doc, ROOT_ID)` from `@open-draw/semantics` to ensure strict 100% hierarchy parity with canvas semantic inspection.
- Formatting rules:
  - Root shapes: `## [DisplayName] (Platform: [platform], Style: [style])` or `## [DisplayName]`
  - Nested container sections: `### [DisplayName]` (heading depth corresponds to tree depth, capped at `######`)
  - Leaf shapes: bullet lines `- **[DisplayName]** — \`[semantic.id]\` (prop1: val1, ...)`
  - Untagged shapes: `- **[DisplayName]**`
  - Responsive visibility: annotated as `_(hidden on mobile, tablet)_` when `hiddenOn` is specified
  - Computed conflicts: annotated with `⚠️ _[CONFLICT: reason]_` when computed by `computeSemanticConflict`
- **Strict Zero Geometry Invariant**: Markdown projection contains **no coordinates** `(x, y)` and **no bounding box sizes** `(w, h)`. Geometry belongs to visual canvas rendering, not semantic developer handoff.

### D3 — Deterministic seeded crayon render style (R-021)

- Crayon / hand-drawn rendering is implemented in `@open-draw/renderer-svg` with **zero runtime dependencies** (R-002).
- Seed generation is a pure 32-bit FNV-1a hash of the shape's stable `ShapeId`:
  $$\text{seed} = \text{hashShapeId}(\text{shape.id})$$
- Jitter/wobble perturbation is a pure mathematical/trigonometric function of `(seed, geometry)`.
- **Zero `Math.random()`**: Renders are 100% byte-identical and shimmer-free across sessions, reloads, and machines.
- Unhandled/custom shape kinds fall back safely to standard SVG rendering (R-021).

### D4 — Style profile registry extension

- `STYLE_PROFILES` in `@open-draw/contracts` is extended:
  ```ts
  export const STYLE_PROFILES = {
    minimal: "minimal",
    crayon: "crayon",
  } as const;
  ```
- Baseline remains `minimal`. Crayon is registered in `@open-draw/profiles` as `CRAYON_STYLE_PROFILE`.

### D5 — Presentation-only semantic tag chip overlay (R-031)

- Renders an SVG tag pill displaying the semantic tag label / platform at the shape's top-left corner.
- Dimensions and typography are counter-scaled by `1 / zoom` so the chip maintains a legible, constant visual size regardless of canvas zoom level.
- Transient presentation state only; the document model stores nothing about overlays.

### D6 — Dependency table amendment (ADR-0001 D2)

Amended table:

| Package           | May depend on                                    | Must NEVER depend on            |
| ----------------- | ------------------------------------------------ | ------------------------------- |
| `contracts`       | —                                                | anything                        |
| `document`        | `contracts`                                      | React, SVG/DOM, Studio, canvas  |
| `canvas`          | `contracts`, `document`                          | semantics never mandatory       |
| `renderer-svg`    | `contracts`, `document`                          | canonical state (doc is truth)  |
| `semantics`       | `contracts`, `document`, `profiles`              | canvas, renderer, react         |
| `profiles`        | `contracts`                                      | canvas, renderer, react         |
| `export-markdown` | `contracts`, `document`, `semantics`, `profiles` | anything depending on it        |
| `react` adapter   | `canvas`                                         | reimplementing canvas internals |

## Consequences

- AI/developer handoff gains a deterministic, human-readable semantic Markdown format that can never disagree with the canvas semantic model.
- Visual styling gains an extensible, deterministic seeded foundation (Crayon) without polluting geometry or document storage.
- Strict package boundaries and zero-dependency rules remain completely preserved.
