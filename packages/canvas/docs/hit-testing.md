# Hit Testing and Spatial Query Architecture

This document specifies the hit-testing, spatial acceleration, and collision disambiguation contracts implemented in `@open-draw/canvas` (ADR-0008, ADR-0011, R-008, R-016).

---

## 1. Overview

Hit testing determines which shape (if any) is located at a world point (`pickShape`) or intersects a bounding region (`pickShapesInBox`). To scale efficiently to documents with 10,000+ shapes while retaining mathematical purity (R-008, R-021), hit testing is executed in two stages:

1. **Broad Phase (STR R-Tree Spatial Index):**
   - Axis-Aligned Bounding Box (AABB) intersection query evaluated in $O(\log N + K)$ time.
   - Accelerates candidates using Sort-Tile-Recursive (STR) R-Tree indexing.
   - Candidates are pre-sorted by document stacking order (z-index descending).

2. **Narrow Phase (Shape-Specific Hit Testers):**
   - For complex geometries (e.g., lines, pen paths, ellipses, custom shapes), precise geometric evaluation is applied (e.g., distance to segment, polyline vertex threshold, ellipse radius equation).
   - For standard rectangular shapes, bounding-box containment (`pointInBox`) is evaluated.
   - The first candidate satisfying narrow-phase testing is returned as the topmost hit.

---

## 2. Deterministic Stacking Order and Collision Disambiguation

When multiple shapes occupy overlapping or identical coordinates (such as concurrent multi-user insertions, duplicates, or stacked layers), hit testing and selection must be strictly deterministic:

- **Single Source of Truth (R-016):**
  Document stacking order (`shapeListInOrder(document)`) defines the canonical z-index.
  - Shape index `0` is the bottom-most shape in the scene.
  - Shape index `N - 1` is the topmost shape in the scene.

- **Deterministic Hit Disambiguation:**
  - When querying with an active spatial index (`querySpatialIndexPoint`), results are explicitly ordered by `b.zIndex - a.zIndex` (descending). The topmost shape (`highest zIndex`) is returned first.
  - When querying via linear fallback scan (`pickShape`), the loop iterates backwards from `ordered.length - 1` down to `0`.
  - Both pathways guarantee **identical, byte-stable hit resolution**: the visually topmost shape in document order always receives the hit.

---

## 3. Selection Drill-Down for Overlapping Hierarchies

For nested structures (shapes inside sections or frames) and overlapping siblings:

1. **Single Click:**
   - Always selects the topmost root or direct sibling if already inside the parent container (`resolveSelectionDrillDown`).
2. **Double Click:**
   - Drills down to the next descendant level beneath the clicked point.
3. **Marquee Selection (`pickShapesInBox`):**
   - Returns all intersecting shape IDs conforming to the selection marquee, pre-sorted by stacking order.
