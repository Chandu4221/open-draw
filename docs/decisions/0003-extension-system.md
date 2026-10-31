# ADR-0003 — Extension System & Plugin Contracts

- **Status:** Accepted
- **Date:** 2026-10-31
- **Supersedes:** amends ADR-0001 D2 (dependency table)
- **Rules implemented:** R-005, R-006, R-008, R-009, R-016, R-018, R-020, R-021, R-036, R-044

## Context

OpenDraw requires extensibility across three distinct axes:

1. **Shapes**: new structural and content shapes (both built-in additions like line/pen-path and future third-party custom shapes) without touching core document commands.
2. **Renderers**: modular SVG rendering pipelines with defined fallback behavior for unsupported shapes.
3. **Metadata**: forward-compatible plugin data stored on shapes without requiring the core engine to validate or understand third-party payloads.

Previous visual canvas systems degrade because core commands accumulate shape-specific special cases, plugins mutate canonical state directly, and unknown data is either silently discarded or crashes strict parsers.

## Decision

### D1 — Capability-based shape contract

- Instead of a monolithic "god-interface" for shapes, shape modules declare a set of typed capabilities from a closed registry in contracts:
  ```ts
  export const CAPABILITIES = {
    resizable: "resizable",
    movable: "movable",
    textLabel: "text-label",
    freehandPath: "freehand-path",
  } as const;
  export type CapabilityId = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];
  ```
- Canvas interactions gate operations against capabilities rather than shape kinds (e.g. `hasCapability(shape, CAPABILITIES.movable)`), ensuring new shape kinds integrate seamlessly.

### D2 — Hybrid shape-kind registry

- Built-in shape kinds remain closed in `SHAPE_KINDS` (`page`, `section`, `rect`, `ellipse`, `line`, `pen-path`) to satisfy R-005 for core code.
- Custom shape kinds follow a strict namespaced format `<scope>:<name>` (`/^[a-z0-9-]+:[a-z0-9-]+$/`) branded as `CustomShapeKind`.
- `parseDocument` accepts built-in kinds or valid custom kinds; malformed strings fail loudly with typed `invalidShape` errors (R-006).

### D3 — Defined fallback for renderers

- Renderers maintain a per-kind render table.
- When encountering an unregistered shape kind, the renderer:
  1. Never crashes and never throws in the render loop.
  2. Renders a neutral dashed placeholder box with a descriptive kind label derived from `SHAPE_KIND_LABELS` or the kind id.
  3. Surfaces an optional typed `RendererFallbackEvent` through pure render options:
     ```ts
     export interface RenderOptions {
       readonly onFallback?: (event: RendererFallbackEvent) => void;
     }
     export function documentToSvg(document: Document, options?: RenderOptions): string;
     ```
- The renderer remains a pure function (`Document → string`, R-008, R-016) with no global event emitters or singletons.

### D4 — Opaque plugin data forward compatibility namespace (R-044)

- Shapes carry an optional `meta.pluginData?: Readonly<Record<PluginId, unknown>>`.
- Plugin IDs use a branded format `PluginId` matching `/^[a-z0-9-]+:[a-z0-9-]+$/`.
- **R-044 Exemption**: `meta.pluginData` is an opaque forward-compatibility namespace. Content validation is exempt from R-006; envelope validation is enforced loudly:
  - Keys must be valid `PluginId` strings.
  - At serialization time, contents must be strictly JSON-serializable (non-serializable data throws `invalidDocument`).
- The engine preserves unknown plugin data byte-stably across serialize/parse round-trips without interpreting it.

### D5 — Box-relative geometry storage

- For point-carrying shapes (`LineShape` with `start`/`end`, `PenPathShape` with `points`), points are stored **relative to the shape's own boundingBox origin**.
- `MoveShapes` only updates `boundingBox.x/y`. Because points are box-relative, moving a shape automatically translates its rendered geometry without any shape-specific branches in core document commands.
- `SetShapeBoundingBox` proportionally scales box-relative points so geometry scales with the bounding box.

### D6 — Package dependency table amendment (ADR-0001 D2)

The dependency table from ADR-0001 D2 is updated to incorporate `@open-draw/shapes`:

| Package        | May depend on                     | Must NEVER depend on                |
| -------------- | --------------------------------- | ----------------------------------- |
| `contracts`    | —                                 | anything                            |
| `shapes`       | `contracts`                       | `document`, `canvas`, `renderer`    |
| `document`     | `contracts`                       | `shapes`, React, SVG/DOM, canvas    |
| `renderer-svg` | `contracts`, `document`, `shapes` | canonical state (document is truth) |
| `canvas`       | `contracts`, `document`           | `shapes`, semantics never mandatory |
| `input`        | `contracts`                       | DOM, React                          |

- `@open-draw/shapes` contains pure shape definitions and depends only on contracts.
- `@open-draw/document` remains kind-agnostic and does NOT depend on shapes.
- Applications (`apps/playground`, `apps/studio`) wire shapes into canvas and renderer.

### D7 — Commit-boundary streaming gestures (R-018)

- Freehand pen drawing and line drawing accumulate pointer coordinates in **transient shell gesture state** (`gestureRef.current`).
- Points are never streamed into the document and never create interim transactions.
- Exactly **ONE** `createShape` transaction dispatches on `pointerUp`. Undo reverts the complete stroke in a single history step.

### D8 — Static interaction tools for built-ins

- `drawLine` and `drawPenPath` are added to the static `TOOLS` registry in `@open-draw/canvas`.
- Dynamic third-party tool registration is explicitly deferred.

## Consequences

- New shapes can be introduced modularly without modifying the document core.
- Third-party documents with custom shapes or plugin data can be loaded, rendered with fallbacks, and saved back without data loss.
- Core commands remain strictly generic, pure, and fast.
