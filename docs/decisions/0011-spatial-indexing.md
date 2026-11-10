# ADR-0011 — In-Tree Zero-Dependency Spatial Indexing (STR R-Tree)

- **Status:** Accepted
- **Date:** 2026-11-10
- **Supersedes:** none
- **Rules implemented:** R-002, R-004, R-005, R-008, R-010, R-014, R-015, R-016, R-022, R-043

## Context

As canvas documents grow beyond hundreds of shapes, linear $O(N)$ document traversals for single-point hit testing (`pickShape`), marquee selection (`pickShapesInBox`), and drop-target picking degrade interaction throughput. In particular:

1. `pickShape` performs a linear walk over `shapeListInOrder(document)`, computing `absoluteBoundingBox` through ancestor hierarchies on every pointer down and hover event ($O(N \times D)$).
2. `pickShapesInBox` loops over all shape entries in `document.shapes`, testing bounding-box intersections linearly ($O(N \times D)$).
3. Third-party spatial index packages (such as `rbush`) introduce external runtime dependencies, violating **R-002** (`dependencies: {}` in workspace packages) and requiring adapter translations between `BoundingBox` and `{ minX, minY, maxX, maxY }`.

A high-performance, clean-room, zero-dependency spatial index is required to provide $O(\log N + K)$ spatial queries while preserving package boundaries and document purity.

## Decision

### D1 — In-Tree 2D STR (Sort-Tile-Recursive) R-Tree

- `@open-draw/canvas` implements an in-tree 2D R-Tree bulk-loaded via the standard Sort-Tile-Recursive (STR) algorithm.
- Leaf and internal nodes index 2D Axis-Aligned Bounding Boxes conforming directly to `@open-draw/contracts` `BoundingBox` (`{ x, y, width, height }`) and `Point` (`{ x, y }`).
- Zero external runtime dependencies are introduced, strictly satisfying **R-002** and **ADR-0008 D1**.

### D2 — Transient Controller Lifecycle (R-016, ADR-0001 D1)

- The spatial index is derived acceleration state held in transient memory inside `CanvasController` (`createCanvas()`).
- Per the placement test ("does this survive save + reload?"), the spatial index is **never** persisted in the canonical `Document` model (R-016).
- When document transactions commit via `CanvasController`, the spatial index is refreshed from the document's absolute shape bounding boxes.

### D3 — Two-Phase Hit Testing: Broad Phase + Narrow Phase

Hit testing decomposes cleanly into two stages:

1. **Broad Phase (Spatial Index):** Query the STR R-Tree with a world point or marquee box in $O(\log N + K)$ time to retrieve intersecting candidates pre-sorted by document stacking order (z-index descending).
2. **Narrow Phase (Custom Shape Testers):** For point queries, evaluate custom shape hit testers (e.g., `hitTestLine`, `hitTestPenPath` from `@open-draw/shapes`) or fall back to rectangle containment (`pointInBox`). The first candidate satisfying narrow-phase testing is returned as the topmost hit.

### D4 — Pure Functional Interface & Node Capacity

- In adherence to **R-008** (_Functional core, imperative shell_), all tree construction and querying functions are pure:
  ```ts
  export interface SpatialIndexItem {
    readonly id: ShapeId;
    readonly box: BoundingBox;
    readonly zIndex: number;
  }
  export function createSpatialIndex(items: readonly SpatialIndexItem[]): SpatialIndex;
  export function querySpatialIndexPoint(
    index: SpatialIndex,
    point: Point,
  ): readonly SpatialIndexItem[];
  export function querySpatialIndexBox(
    index: SpatialIndex,
    box: BoundingBox,
  ): readonly SpatialIndexItem[];
  ```
- Maximum node capacity is fixed at $M = 16$.
- Source code is strictly scoped under 300 lines per **R-010**.

### D5 — Backward Compatibility Fallback

- The pure functions `pickShape` and `pickShapesInBox` accept an optional `spatialIndex?: SpatialIndex` parameter.
- When `spatialIndex` is provided, queries execute against the index in $O(\log N + K)$.
- When omitted, existing linear scan behavior executes, preserving contract stability for callers invoking hit-testing directly without an active controller.

## Consequences

- Pointer hit-testing and marquee drag-selection scale to 10,000+ shapes with sub-millisecond query latency.
- Runtime `dependencies: {}` remains completely empty in `packages/canvas/package.json`.
- The document core (`@open-draw/document`) remains completely decoupled from spatial indexing, preserving package boundaries.
- Clean-room requirements (R-022) are maintained through independent algorithmic implementation.
