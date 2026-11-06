# Document Model Contract

This document defines the schema and structural invariants of the canonical OpenDraw document model.

## 1. Document Structure

A document is an immutable snapshot representing a complete drawing scene:

```ts
export interface Document {
  readonly schema: {
    readonly version: number;
  };
  readonly shapes: ReadonlyMap<ShapeId, Shape>;
}
```

### Invariants

- **R-041 — Version-Only Schema; No Timestamps**: Documents store `schema.version` and zero temporal fields (`createdAt`, `updatedAt`). Recency is a storage concern, not drawing data.
- **R-016 — Canonical Truth**: SVG strings, canvas DOM elements, and UI state are derived projections and never persisted in document state.

## 2. Shape Record

Every shape is a plain typed data record:

```ts
export interface Shape {
  readonly id: ShapeId;
  readonly kind: ShapeKindId;
  readonly parentId: ShapeId | null;
  readonly boundingBox: BoundingBox;
  readonly label?: string;
  readonly content?: string;
  readonly style?: ShapeStyle;
  readonly semantic?: SemanticTag;
  readonly meta?: ShapeMeta;
}
```

### Fields

- **`id`**: Branded string identifier (`ShapeId`).
- **`kind`**: From closed `SHAPE_KINDS` registry (`rect`, `ellipse`, `line`, `pen-path`, `text`, etc.).
- **`parentId`**: References parent container, or `null` for root shapes (immediate canvas children).
- **`boundingBox`**: Coordinate frame `{ x, y, width, height }` in canvas world units.
- **`label`**: Human-authored descriptive label (R-042).
- **`content`**: Textual body or vector path data for shapes requiring inline content.
- **`style`**: Visual parameters `{ fill?, stroke?, strokeWidth? }`.
- **`semantic`**: Platform-specific semantic tag mapping.
- **`meta`**: Root metadata (platform, design style) or child responsive metadata (`hiddenOn`, `order`).

## 3. Tree Hierarchy & Root Resolution

- **R-026 — Root Resolution**: Platform and design style are properties of root shapes (`parentId === null`) only. Nested children inherit both from their root ancestor.
- **Container Nesting**: Hierarchical nesting is bounded by `MAX_DOCUMENT_DEPTH` (default 5 levels).
- **Orphan Prevention**: All non-root shapes must reference a valid parent present in the document.

## 4. Transactional Mutation Pipeline

All mutations to the document occur through typed transactions:

1. One or more typed commands (`CreateShape`, `MoveShapes`, `DeleteShape`, etc.) are packaged into a transaction.
2. The transaction applies commands sequentially to produce a new immutable `Document`.
3. Validation verifies tree integrity, depth limits, and coordinate bounds.
4. History records forward and inverse operations for deterministic undo/redo.
