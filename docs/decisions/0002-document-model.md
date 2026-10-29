# ADR-0002 — The OpenDraw Document Model

- **Status:** Accepted
- **Date:** 2026-10-29
- **Supersedes:** none
- **Rules implemented:** R-005, R-006, R-008, R-010, R-011, R-012, R-016, R-017, R-018, R-024, R-025, R-026, R-028, R-038

## Context

Milestone 02 needs the canonical data structure every later capability hangs from:
rendering, interactions, history, export, profiles, and the responsive derive.
This ADR fixes the shape of that structure before any engine code is written.

## Decisions

### D1 — Document is a flat normalized map

```ts
type Document = {
  schema: { version: 1 };
  shapes: Readonly<Record<ShapeId, Shape>>;
};
```

- One record per shape, keyed by id. The tree (page → section → child) is
  **derived**, never stored twice (R-010: one source of truth).
- `schema.version: 1` is present from the first save file. Migrations become a
  real capability the day they are needed; retrofits are impossible.
- References between shapes are ids only — never nesting, never pointers.

### D2 — Virtual root; no nullable parent

```ts
export const ROOT_ID = "canvas:root" as ShapeId; // registry constant, structural

interface BaseShape {
  id: ShapeId;
  kind: ShapeKind;
  parent: ShapeId; // never null
  box: Box;
  label?: string;
  meta: ShapeMeta;
}
```

- `ROOT_ID` is the conceptual canvas: a **structural constant**, not a record in
  `shapes`. It cannot be selected, moved, deleted, or exported as a shape.
- `ROOT_ID`'s children are the page roots: an unlimited free plane with multiple
  PAGE shapes.
- Uniform code paths: every shape has a parent; traversal terminates at
  `ROOT_ID`; no null-branches anywhere in the codebase.
- Validation must reject any document whose parent chains do not terminate at
  `ROOT_ID` (the cycle check).

### D3 — Discriminated shape union from a const registry

`Shape = PageShape | SectionShape | RectShape | EllipseShape | …`,
discriminated by `kind`, with `SHAPE_KINDS` an `as const` registry (R-005) and
`SHAPE_KIND_LABELS` providing display names in the same registry module.

### D4 — Boxes are parent-local coordinates

`box: { x, y, width, height }` is relative to the parent's coordinate space.
Reflowing a section for a device class never rewrites child boxes; absolute
page positions are always derived. The camera remains a transform outside the
document (R-017).

### D5 — `label` is the only human-authored stored field

- `label?: string` — optional, presentation-only, never load-bearing. Rename
  freely; the document does not care.
- Display names are **derived**, never stored:
  `getDisplayName(shape, profile)` → label → semantic display name (from the
  active platform profile's data module) → `SHAPE_KIND_LABELS[kind]`.
- Principle: _labels describe for humans, IDs identify for machines; neither
  ever does the other's job._
- `label` also feeds accessibility attributes in exports.

### D6 — The meta block carries semantics and responsive controls

```ts
type ShapeMeta = {
  semantic?: { id: SemanticId; platform: "web" | "react-native" };
  order: Partial<Record<DeviceClass, number>>; // flex order per class; absent = 0
  hiddenOn?: readonly DeviceClass[];            // absent = visible everywhere
  style?: StyleId;                             // local override; inherited by default
};
```

- Absent semantic = NONE (R-024). A foreign tag keeps its platform inside the
  tag; conflict with the page platform is a computed one-line check (R-025),
  not stored state.
- Even default sibling ordering is a number; device-class ordering is the same
  mechanism with a per-class value (R-028: defaults keep all children active).
- Style resolves root-down with local overrides only where explicitly set
  (R-026).

### D7 — Sections carry flow direction now

`SectionShape.direction: "row" | "column"` is part of the record from day one.
The engine ignores it until the derive pipeline lands. The field is decided
(R-038); its consumer is sequenced, not speculative.

### D8 — Transactions: commands, batches, inverses (R-018)

```ts
type Transaction = {
  readonly id: TransactionId;
  readonly commands: readonly Command[]; // one gesture = one batch
  readonly inverse: readonly Command[];  // computed at apply time
};
```

- Commands are named, from a registry (R-011/R-012).
- Applying a batch returns the inverse batch; history is an inverse stack.
  Undo applies the inverse; redo applies the inverse's inverse.
- No snapshots: undo is O(batch), documents stay small.

### D9 — Value objects as types, never classes

- Invariants live in **types**: branded primitives + validating smart
  constructors at boundaries, throwing typed errors (R-006: parse, don't
  validate). Internal code trusts the types it receives; no revalidation.
- Behavior lives in free pure functions over plain, JSON-serializable data
  (R-008). No classes with methods, no identity ceremony, no serialization
  hooks.

### D10 — Export formats: JSON and Markdown at launch

- Exporters are registry-driven pure derive functions: `Document → string`
  (R-010/R-012). The format list is data.
- **JSON** = full machine truth. **Markdown** = semantic projection for AI and
  prompt context: hierarchy + `getDisplayName` output only, **no geometry** —
  it never pretends to be a rendering.
- Both walk the same semantic order from the same data; they cannot disagree
  by construction.

## Consequences

- Everything downstream (renderer, commands, history, export, profiles,
  responsive derive) reads one structure and derives the rest.
- Save files are honest: reload reproduces exactly what was saved; nothing
  presentational is persisted (camera, display names, transient state).
- Adding a shape kind, device class, or export format touches registries —
  not core logic.
- The first implementation increments (packages/contracts, then
  packages/document) follow directly from D1–D9.