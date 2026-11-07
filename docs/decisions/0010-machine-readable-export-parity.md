# ADR-0010 — Machine-Readable Export Parity

- **Status:** Accepted
- **Date:** 2026-11-07
- **Supersedes:** amends ADR-0005 D2 (geometry in Markdown export)
- **Rules implemented:** R-002, R-005, R-006, R-008, R-010, R-014, R-016, R-020, R-021, R-025, R-041, R-042, R-043

## Context

OpenDraw's export formats previously exhibited significant semantic and structural drift:

1. **Markdown**: Emitted a flat bullet list without shape IDs, hierarchy, spatial geometry, or shape-keyed legend. While ADR-0005 D2 previously stated a strict "Zero Geometry Invariant" for Markdown, practical AI codegen and design handoff require parent-relative spatial arrangement (e.g. avatar left, name right, button below) to synthesize accurate code and responsive layouts.
2. **SVG**: Contained zero semantic or structural data attributes. The document's identity was visible only in a detached generic glossary (`heading / button / card`) that had no association with rendered shapes.
3. **JSON**: While structurally rich via `serializeDocument()`, it lacked explicit z-order, style properties (`fill`, `stroke`, `strokeWidth`), explicit distinction between untagged and uninitialized semantics, and semantic registry version fingerprinting.

Crucially, OpenDraw doctrine mandates that the canonical `Document` is the single source of truth (R-016), export derivations must never be stored in the document (R-025), and package boundaries must be strictly preserved (R-020, AGENTS.md Section 5).

## Decision

### D1 — Universal Chip ID System (`EXPORT_CHIP_PREFIX`)

- Every exported shape receives a **chip ID**: a short, deterministic, machine-readable identifier derived from `shape.id` at export time (`#s-7a01`).
- The prefix `#` is defined as `EXPORT_CHIP_PREFIX = "#"` in `@open-draw/contracts`.
- Chip IDs are never stored on the document model (R-025) and act as the universal join key across all three export formats (SVG annotation chips ↔ Markdown tree references ↔ JSON shape records).

### D2 — Export-Time JSON Parity Projection

- Enriched JSON export is implemented as a pure projection function `exportJson(doc, options)` in `@open-draw/export-markdown`.
- `@open-draw/document` (`serializeDocument()`, `Document` schema) remains **strictly untouched and unpolluted** (R-016, R-025).
- Output features:
  - Top-level `shapeOrder: ShapeId[]` reflecting canonical document z-order.
  - Top-level `semantics: { version: SEMANTICS_REGISTRY_VERSION }` fingerprint (`SEMANTICS_REGISTRY_VERSION = 1` housed in `@open-draw/semantics`).
  - Shape records enriched with `chipId`, explicit `style` properties (`fill`, `stroke`, `strokeWidth` where present), and explicit `"semantic": null` for untagged shapes.
  - Empty `meta.order: {}` objects are omitted from export output.

### D3 — Markdown Tree Hierarchy & Parent-Relative Geometry (amends ADR-0005 D2)

- Amends the ADR-0005 D2 "Zero Geometry Invariant": Markdown exports now include parent-relative bounding boxes formatted as `[x:0.00 y:0.00 w:0.00 h:0.00]` with pinned 2-decimal precision.
- Hierarchical structure: Indented tree view walking `subtreeOf(doc, rootId)` in canonical z-order, displaying Chip ID, label/content, resolved semantic display name with properties, shape kind, and parent-relative bounding box.

### D4 — Deterministic 80-Column ASCII Layout Sketch

- Exports include an 80-column ASCII sketch visualizing approximate 2D spatial arrangement.
- Inclusion threshold: Automatically included when document shape count $> 5$ (`ASCII_SKETCH_SHAPE_THRESHOLD = 5`), omitted when $\le 5$, with explicit override via `MarkdownExportOptions.includeAsciiSketch`.
- Renderer: Pure function in `@open-draw/export-markdown` utilizing standard Unicode box-drawing characters, proportional scaling capped at 40 rows, z-order painter's overlap resolution, and omitting lines/pen-paths with an explanatory caption. Zero `Math.random()` (R-021, R-041).

### D5 — SVG Annotations Layer & Dependency Inversion

- SVG export gains a rich machine-readable annotation layer enabled via `ExportSvgOptions.includeAnnotations` (default `true` for export).
- Inverted dependency: `@open-draw/renderer-svg` **never** imports `@open-draw/semantics` or `@open-draw/profiles` (R-020). Instead, display names are resolved via `ExportSvgOptions.resolveDisplayName: (shape: Shape) => string`, injected by Studio (`apps/studio/src/document-io.ts`).
- Annotations:
  - Shape wrapper `<g>` elements carry `data-shape-id`, `data-chip-id`, `data-semantic`, `data-parent-id`, `role="img"`, `aria-label`, and `<title>`.
  - Top-level `<g class="annotation-chips">` overlays visual chip ID pills with deterministic z-order collision avoidance.
  - Live canvas render loop is completely unaffected (annotations disabled during interaction).

### D6 — On-Demand Chip-Keyed Legend

- The legacy generic glossary legend is **removed** across all export formats.
- New on-demand legend (`includeLegend`, default `false` across all formats) generates chip-keyed mappings (`#s-7a01 — Profie Card (Card)`).
- Studio export modal provides explicit toggle controls for Legend, ASCII Sketch, and Annotations.

## Consequences

- Full parity between visual canvas representation, AI prompt compilation, and machine-readable data across all three formats.
- Complete adherence to architectural boundaries: `@open-draw/document` remains an unpolluted storage kernel; `@open-draw/renderer-svg` remains a decoupled visual renderer.
- 100% byte-stability and determinism preserved across reloads and environments without timestamps or non-deterministic floats.
