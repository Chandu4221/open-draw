# ADR-0004 — Semantic Wireframing & Platform Profiles

- **Status:** Accepted
- **Date:** 2026-11-01
- **Supersedes:** amends ADR-0001 D2, ADR-0003 D6 (dependency table)
- **Rules implemented:** R-005, R-006, R-008, R-011, R-012, R-016, R-018, R-020, R-023, R-024, R-025, R-026, R-027, R-028, R-029, R-036, R-040, R-042, R-044

## Context

OpenDraw's founding blueprint separates visual geometry from semantics and platform behavior. Rather than baking platform-specific components or hardcoded HTML/widget tags into the core engine, OpenDraw treats platforms and semantics as **pluggable data modules**:

1. The canvas core ships **zero** universal tag lists or hardcoded platform semantics (R-023).
2. Untagged shapes are complete and valid baseline geometry (`NONE`, R-024).
3. Switching a root page's platform never mutates or deletes child tags; conflict with the active platform is **computed** dynamically (R-025).
4. Platform and style are properties of root shapes (pages) only; nested children inherit both by tree position (R-026).
5. Inspector controls are data-driven, derived from the active semantic's property schema.
6. Shapes hidden on the active `DeviceType` render as presentation-only ghosts (R-029).

## Decision

### D1 — Semantic ID format & stored semantic contract

- In `@open-draw/contracts`, semantic IDs are branded strings `SemanticId` matching `/^[a-z0-9-]+$/` (R-005, R-014).
- The stored form on `ShapeMeta` in `@open-draw/document` remains:
  ```ts
  export interface SemanticTag {
    readonly id: string;
    readonly platform: PlatformId;
    readonly properties?: Readonly<Record<string, string | number | boolean>>;
  }
  ```
- Untagged shapes omit `meta.semantic` (R-024: absent = `NONE`, never an error or fallback).

### D2 — Display name derivation split (R-042)

- To preserve strict package boundaries (ADR-0001 D2):
  1. `getDisplayName(shape: Shape)` remains in `@open-draw/document` as the base fallback resolver: `shape.label ?? SHAPE_KIND_LABELS[shape.kind]`. `@open-draw/document` never imports profiles or semantics.
  2. `resolveShapeDisplayName(shape: Shape, profile?: PlatformProfile): string` lives in `@open-draw/semantics`. It executes the complete chain:
     $$\text{label} \longrightarrow \text{semantic display name (from profile)} \longrightarrow \text{shape kind label}$$

### D3 — Computed conflict state (R-025)

- Foreign-tag conflicts (e.g. Web `navbar` tag under an Android Native page) are evaluated purely via `computeSemanticConflict(doc, shape, profile)` in `@open-draw/semantics`.
- The returned conflict status (`SEMANTIC_CONFLICTS.conflicted` with diagnostic details) is presentation state for inspectors and exports.
- **Nothing is written to or deleted from the document.** Switching back to the original platform immediately clears the conflict with zero data loss.

### D4 — Deferral of responsive `derive()` solver & SVG ghost rendering

- The pure layout reflow solver `derive(doc, deviceType)` is explicitly deferred to Milestone 06 alongside flex properties.
- Milestone 05 ships stored-data editing (`hiddenOn`, `order`) and presentation-only ghost rendering:
  - `RenderOptions` in `@open-draw/renderer-svg` gains `activeDeviceType?: DeviceType`.
  - When `shape.meta.hiddenOn?.includes(activeDeviceType)`, `renderer-svg` applies ghost presentation styling (`opacity="0.35" stroke-dasharray="4 4"` per R-029).
  - The canvas controller owns transient view state only (`getActiveDeviceType()`, `setActiveDeviceType()`, R-017, R-030).

### D5 — Platform and style profiles as pure data modules (R-023)

- Profiles live in `@open-draw/profiles` with zero runtime code dependencies outside `@open-draw/contracts`.
- Milestone 05 ships:
  1. **Web Profile (`web`)**: root semantic `page`, 5 `DEVICE_TYPES`, comprehensive vocabulary (`navbar`, `button`, `footer`, `card`, `input`, `heading`, `sidebar`, `table`), each with typed property schemas.
  2. **Android Native Profile (`android-native`)**: root semantic `screen`, vocabulary (`top-app-bar`, `navigation-bar`, `floating-action-button`, `card`, `button`).
  3. **Flutter Profile (`flutter`)**: minimal stub (`scaffold`, `app-bar`).
  4. **Minimal Style Profile (`minimal`)**: base style profile.

### D6 — Property schema format & value storage (R-044)

- In `@open-draw/contracts`, property controls are governed by:
  ```ts
  export const CONTROL_TYPES = {
    text: "text",
    select: "select",
    toggle: "toggle",
    number: "number",
  } as const;
  export type ControlId = (typeof CONTROL_TYPES)[keyof typeof CONTROL_TYPES];
  ```
- `PropertySchema = { id, control, label, defaultValue?, options?, range? }`.
- Value storage: `SemanticTag.properties` holds JSON primitive values (`string | number | boolean`).
- Validation enforces the envelope at serialize/parse boundaries (R-044). Keys unknown to the local profile are preserved opaquely to prevent data loss when documents travel across environments.

### D7 — Root resolution for platform and style (R-026)

- `meta.platform?: PlatformId` and `meta.style?: StyleId` are settable **only** on root pages (`parent === ROOT_ID` and `kind === "page"`).
- Boundary validation in `parseDocument` and `parseMeta` loudly rejects `platform` or `style` on any non-root shape with a typed `DocumentError("invalidMeta", ...)`.
- Nested children inherit platform and style dynamically by ascending the tree to their root ancestor via `resolveRootPlatform(doc, shapeId)` and `resolveRootStyle(doc, shapeId)`.

### D8 — Package dependency table amendment (ADR-0001 D2, ADR-0003 D6)

The workspace dependency table is updated to incorporate `@open-draw/profiles` and `@open-draw/semantics`:

| Package        | May depend on                       | Must NEVER depend on                 |
| -------------- | ----------------------------------- | ------------------------------------ |
| `contracts`    | —                                   | anything                             |
| `shapes`       | `contracts`                         | `document`, `canvas`, `renderer-svg` |
| `profiles`     | `contracts`                         | `document`, `canvas`, `semantics`    |
| `document`     | `contracts`                         | `profiles`, `semantics`, React, DOM  |
| `semantics`    | `contracts`, `document`, `profiles` | `canvas`, `renderer-svg`, React, DOM |
| `renderer-svg` | `contracts`, `document`, `shapes`   | canonical state, `semantics`         |
| `canvas`       | `contracts`, `document`, `input`    | `profiles`, `semantics`              |
| `input`        | `contracts`                         | DOM, React                           |
| `playground`   | everything                          | —                                    |

The dependency graph remains a strictly acyclic DAG.

### D9 — Typed document commands inventory (R-011, R-012, R-018)

All mutations to semantic and responsive properties flow through reversible, typed commands in `@open-draw/document/src/commands/`:

1. `set-shape-semantic`: sets or clears `meta.semantic` (including `properties`).
2. `set-root-platform`: sets `meta.platform` on root pages (throws typed error if target is not a root page).
3. `set-root-style`: sets `meta.style` on root pages (throws typed error if target is not a root page).
4. `set-shape-hidden-on`: sets `meta.hiddenOn` (R-028, R-029).
5. `set-shape-order`: sets `meta.order[deviceType]` (R-027).

## Consequences

- Adding a platform or design style requires zero modifications to engine code.
- User data is preserved during platform changes.
- The inspector UI is completely data-driven and reusable across platforms.
- Document validation enforces structural invariants (R-026) at the system boundary.
