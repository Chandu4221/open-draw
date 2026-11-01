# Milestone 05 — Agent execution instructions

**Place at:** `docs/plans/milestone-05-agent-instructions.md` — commit it under version control on branch `feat/semantic-wireframing` (per R-043 pattern: agent instructions live in `docs/plans/`, checked in, never gitignored). It rides in the same PR as the implementation.

---

# Milestone 05 Agent Instructions — Semantic Wireframing

You are implementing milestone 05 of the OpenDraw roadmap. You are an executor, not a decision-maker: every judgment below is already ruled (R-043). If you find something not covered here or by the rules, STOP and log it in `docs/od-questions.md` — never invent (R-038).

Read `docs/rules/RULES.md` and `docs/decisions/0004-semantic-wireframing.md` first. Quote the rule you are implementing in each commit message body (review gate).

## Rulings in force (do not re-open)

1. **Semantic ID format:** Branded string `SemanticId` matching `/^[a-z0-9-]+$/`. Stored in `meta.semantic = { id, platform, properties? }`.
2. **Display name split:** `getDisplayName(shape)` in `@open-draw/document` remains the base resolver (`shape.label ?? SHAPE_KIND_LABELS[kind]`). Profile-aware full chain `resolveShapeDisplayName(shape, profile?)` lives in `@open-draw/semantics`.
3. **Conflict state:** Computed dynamically via pure function `computeSemanticConflict(doc, shape, profile)` in `@open-draw/semantics`. Foreign tags stay stored untouched (R-025). Never modify stored document state on platform switch.
4. **Responsive derive() deferral:** The reflow engine `derive()` is deferred to Milestone 06. Milestone 05 ships ghost presentation in `@open-draw/renderer-svg` via `RenderOptions.activeDeviceType` (`opacity 0.35, stroke-dasharray 4 4`, R-029).
5. **Profile coverage:** Pure data modules in `@open-draw/profiles`. Full Web vocabulary + minimal-but-real Android Native + Flutter stub.
6. **Inspector surface:** Dogfood inspector lives in `apps/playground`. Studio bootstraps at integration milestone.
7. **Style profile:** Root-resolved like platform (R-026). `STYLE_PROFILES = { minimal: "minimal" }` with `meta.style?: StyleId` on root pages.
8. **Property schema:** Pure data `PropertySchema = { id, control, label, defaultValue?, options?, range? }`. Storage in `meta.semantic.properties?: Record<string, string | number | boolean>` with R-044 envelope validation.
9. **Dependency table:** `profiles → contracts`; `semantics → contracts, document, profiles`; `document → contracts`; `canvas → contracts, document, input`.

## Work items

### 1. `@open-draw/contracts` — semantic & profile contracts

- `src/semantic-contract.ts`: `SemanticId`, `PropertySchema`, `CONTROL_TYPES`, `ControlId`, `SEMANTIC_CONFLICTS`, `SemanticConflict`.
- `src/profile-contract.ts`: `PlatformProfile`, `SemanticDefinition`, `StyleProfile`, `STYLE_PROFILES`, `StyleId`.
- Export from `src/index.ts`.
- Tests in `src/semantic-contracts.test.ts`.

### 2. `@open-draw/profiles` — new package

- `package.json`, `tsconfig.json`. Depends on `@open-draw/contracts: workspace:*`.
- Web profile (`platforms/web/index.ts`), Android Native profile (`platforms/android-native/index.ts`), Flutter stub (`platforms/flutter/index.ts`), Minimal style (`styles/minimal/index.ts`).
- Central export in `src/index.ts`.
- Tests in `src/profiles.test.ts`.

### 3. `@open-draw/document` — shape meta, validation, serialization & commands

- `src/shape.ts`: add `properties` to `SemanticTag`, add `platform` and `style` to `ShapeMeta`.
- `src/validation.ts`: enforce R-026 (reject `platform`/`style` on non-roots), validate `semantic.properties` envelope.
- `src/serialize-document.ts`: serialize `platform`, `style`, and `properties` in insertion order.
- `src/commands/`:
  - `set-shape-semantic/`
  - `set-root-platform/` (validates root page per R-026)
  - `set-root-style/` (validates root page per R-026)
  - `set-shape-hidden-on/`
  - `set-shape-order/`
- Register commands in `src/commands/registry.ts` and export from `src/commands/index.ts`.
- Tests for non-root rejection, envelope roundtrip, and commands.

### 4. `@open-draw/semantics` — new package

- `package.json`, `tsconfig.json`. Depends on `@open-draw/contracts`, `@open-draw/document`, and `@open-draw/profiles`.
- `src/resolve-semantic.ts`: validate and resolve tag against profile.
- `src/compute-conflict.ts`: detect foreign tags and missing definitions.
- `src/resolve-root.ts`: find root page ancestor and resolve effective platform/style.
- `src/display-name.ts`: execute full label → semantic display name → kind chain.
- `src/tree-walk.ts`: hierarchical traversal order for export consumption.
- Tests in `src/semantics.test.ts`.

### 5. `@open-draw/renderer-svg` — ghost rendering

- Update `RenderOptions` with `activeDeviceType?: DeviceType`.
- Render ghost presentation attributes when shape is hidden on `activeDeviceType`.
- Tests in `src/renderer.test.ts`.

### 6. `@open-draw/canvas` — active device type view state

- Add `getActiveDeviceType()` and `setActiveDeviceType(type?: DeviceType)`.
- Tests in `src/create-canvas.test.ts`.

### 7. `apps/playground` — inspector panel & device switcher

- Add inspector UI: platform/style selectors for root pages, semantic tag dropdown, dynamic property controls, conflict warning banner, responsive visibility/order toggles.
- Add device type switcher in toolbar driving SVG ghost rendering.
