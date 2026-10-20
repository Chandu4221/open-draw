# ADR-002: Parenting — Explicit Storage with Geometric Drop-Time Suggestion

## Status
Accepted

## Context
In wireframing and design-to-spec tools, shapes frequently reside inside containers (e.g., a button inside a card, a card inside a frame). 

Two opposing models exist for determining parent/child relationships:
1. **Continuous Geometric Containment:** The system dynamically computes the parent on every frame or drag movement by checking which bounding box encloses which shape.
2. **Explicit Declared Parenting:** The relationship is persisted in shape data.

Continuous geometric recomputation causes severe usability problems: as shapes are dragged or moved near overlapping boundaries, sudden hierarchy switches occur, creating layout jitter and unintended re-parenting.

## Decision
We decide that:
- **The stored explicit parent (in shape `meta.parentId`, managed by semantics/host) is the single source of truth.**
- **Geometric containment is a drop-time suggestion only.** When a user drops a shape, the system evaluates geometric bounds to suggest a parent (using an **innermost-frame-wins** tie-breaking rule if multiple containers overlap).
- **No continuous recomputation in v0.x.** Moving or resizing shapes does not automatically recalculate parentage mid-flight.
- **Validity events fire on parent mutation:** If a parent is moved or deleted, validity events notify the semantics layer and host application to handle orphan or relationship resolution.

## Consequences
### Positive
- **Stability and Determinism:** Parenting never thrashes or jumps unexpectedly while dragging shapes.
- **Separation of Concerns:** The canvas engine remains an unopinionated geometry container; it persists and diffs the opaque `meta` bag without dictating semantic rules.
- **Node-Testable:** Parenting resolution rules can be verified purely in Node using plain snapshot objects without running a browser layout engine.

### Negative / Trade-offs
- If a user moves a shape completely outside its parent frame without using a container-aware drop action, the explicit relationship persists until the user or host explicitly updates it.
