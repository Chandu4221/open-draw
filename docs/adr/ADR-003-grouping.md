# ADR-003: Grouping — Absolute Coordinates and Selection Operators

## Status
Accepted

## Context
Visual grouping is essential for organizing diagram elements, moving multi-shape clusters together, and executing group-level transformations (rotation, scaling).

Traditional CAD/drawing systems often implement groups as deep nested coordinate systems where child shapes store coordinates relative to their parent group's local origin. While mathematically elegant, relative transform trees introduce substantial complexity:
- Deep matrix concatenation and inversion are needed for hit testing and bounding box calculation.
- Serialized formats become tightly coupled to hierarchy trees.
- Cumulative floating-point rounding errors can creep in after repeated group/ungroup cycles.

Furthermore, confusion often arises between *visual grouping* (two shapes temporarily grouped to move together) and *semantic containment* (a button belonging to a card).

## Decision
We decide that:
- **Canvas groups act as selection sets and transform operators:** A `group` shape is registered via the shape registry API with properties `{ type: 'group', memberIds: string[], ... }`.
- **Members store absolute world coordinates:** Children do not store relative local offsets. When a group is dragged, all members move by the drag delta in a single transaction. When rotated or scaled, member coordinates are updated directly relative to the group origin in absolute space.
- **Resize Semantics:** Group resizing defaults to proportional scaling; holding `Alt` performs bounds-only stretching.
- **Nesting in v0.x:** Schema permits N-level nesting without breaking changes, but the v0.x UI exposes single-level grouping. Shortcuts: `Ctrl+G` (group) and `Ctrl+Shift+G` (ungroup).
- **Strict Naming Rule:** Canvas `group` (`memberIds`) $\ne$ semantic parent (`parentId` in `meta`). They must never share field names or API contracts. OpenDraw Studio's inspector shows the *semantic* parent, never the canvas group (unless they happen to coincide).

## Consequences
### Positive
- **Simplicity & Robustness:** Flat absolute coordinates prevent cumulative rounding errors and simplify serialization/deserialization.
- **Unambiguous Vocabulary:** Clear boundary between visual manipulation (canvas grouping) and structural specification (semantic parenting).
- **Fast Hit Testing:** Hit testing does not require traversing complex nested transformation matrices.

### Negative / Trade-offs
- Group transformations require recalculating and committing absolute positions for each individual member in a batch transaction rather than updating a single parent transform matrix.
