# Milestone 04 — Agent execution instructions

**Place at:** `docs/plans/milestone-04-agent-instructions.md` — commit it under version control on branch `feat/extension-system` (per the standing ruling from milestone 02b: agent instructions live in `docs/plans/`, checked in, never gitignored). It rides in the same PR as the implementation.

---

# Milestone 04 Agent Instructions — Extension System

You are implementing milestone 04 of the OpenDraw roadmap. You are an executor, not a decision-maker: every judgment below is already ruled (R-043). If you find something not covered here or by the rules, STOP and log it in `docs/od-questions.md` — never invent (R-038).

Read `docs/rules/RULES.md` first. Quote the rule you are implementing in each commit message body (review gate).

## Rulings in force (do not re-open)

1. **Capabilities contract shape:** Shared core + optional capabilities (`CAPABILITIES` in `@open-draw/contracts`). Shape modules declare `capabilities: readonly CapabilityId[]`.
2. **Plugin ID format:** Branded `PluginId` with regex `/^[a-z0-9-]+:[a-z0-9-]+$/` (`<scope>:<name>`).
3. **Fallback semantics:** When renderer meets an unregistered kind: render neutral dashed placeholder box + kind label via `SHAPE_KIND_LABELS` or kind id, and emit optional `rendererFallback` event via pure `onFallback` option; NEVER throw in render loop.
4. **Plugin data location & R-044:** `meta.pluginData?: Readonly<Record<PluginId, unknown>>` on `ShapeMeta`. Opaque forward-compatibility namespace exempt from R-006 content validation. Envelope validation (PluginId format + JSON-serializability at serialize time) is enforced loudly.
5. **Geometry storage:** Points on `LineShape` (`start`, `end`) and `PenPathShape` (`points`) are stored **box-relative**. `applyMoveShapes` translates geometry automatically without shape-specific branches. Resizing scales points proportionally to the new box.
6. **Shape-kind registry:** Hybrid closed-core + pattern-open. `SHAPE_KINDS` in contracts stays closed for built-ins (`page`, `section`, `rect`, `ellipse`, `line`, `pen-path`). `parseDocument` accepts built-in kinds or valid namespaced custom kinds (`scope:name`) as `CustomShapeKind`. Malformed strings fail loudly with typed `invalidShape` errors (R-006).
7. **Tools:** Static. `drawLine` and `drawPenPath` added to `TOOLS` in `@open-draw/canvas`. Dynamic tool registration deferred to future milestones.
8. **Transaction boundary:** Freehand pen points accumulate in transient shell state (`gestureRef.current`). Exactly ONE `createShape` transaction dispatches on `pointerUp`.

## Work items

### 1. `@open-draw/contracts` — capability and plugin contracts

- `src/capabilities.ts`: `CAPABILITIES` const registry (`resizable`, `movable`, `text-label`, `freehand-path`) and `CapabilityId` type.
- `src/plugin-contract.ts`: `PluginId` branded string, `parsePluginId`, `isValidPluginId`, and `PluginContract`.
- `src/shape-kinds.ts`: Add `line` and `pen-path` built-in kinds and labels; define `CustomShapeKind` and `isValidCustomShapeKind`.
- Export all new types and registries in `src/index.ts`.

### 2. `@open-draw/shapes` — new package

- Follow standard package layout: `package.json`, `tsconfig.json`. Depends ONLY on `@open-draw/contracts`. Zero runtime dependencies (R-002).
- One folder per shape kind (R-012):
  - `src/rect/index.ts`: capabilities, factory helper.
  - `src/ellipse/index.ts`: capabilities, factory helper, ellipse hit-test.
  - `src/line/index.ts`: capabilities, factory helper, point-to-segment distance hit-test, point scaler for box resize.
  - `src/pen-path/index.ts`: capabilities, factory helper, polyline distance hit-test, bounding-box derivation from raw points, point scaler for box resize.
- `src/shapes.test.ts`: test hit-testing, bounding box derivation, and box-relative scaling.

### 3. `@open-draw/document` — shape union, pluginData, validation & serialization

- `src/shape.ts`: add `LineShape`, `PenPathShape`, and `CustomShape`; add `meta.pluginData`; export `createLine` and `createPenPath`.
- `src/validation.ts`: validate `pluginData` envelope (valid `PluginId` keys, R-044); validate line and pen-path shapes; accept `CustomShapeKind` (throws on invalid kinds per R-006).
- `src/serialize-document.ts`: emit `start`/`end` for line and `points` for pen-path; assert JSON-serializability for `pluginData` (typed throw on non-serializable data per R-044); preserve key insertion order.
- `src/commands/set-shape-bounding-box/index.ts`: scale box-relative points proportionally when resizing point-carrying shapes.
- Tests: pluginData byte-stability round-trip, rejection of non-serializable pluginData, custom kind validation, line/pen-path round-tripping.

### 4. `@open-draw/renderer-svg` — registry rendering and fallback

- Add `@open-draw/shapes` dependency in `package.json`.
- Refactor `shapeToSvg` to dispatch through a shape renderer registry.
- Render fallback dashed box with kind label and fire optional `onFallback` callback when an unregistered kind is encountered.
- Add renderers for `line` and `pen-path`.
- Tests: fallback rendering, `onFallback` event emission, line and pen-path SVG output.

### 5. `@open-draw/canvas` — tools and registration seam

- `src/tools.ts`: add `drawLine` and `drawPenPath` to `TOOLS`.
- `src/register-shape-kind.ts`: pure shape-kind registry mapping kind to capabilities and geometry helpers.
- `src/create-canvas.ts`: wire shape-kind registry into controller options and methods.

### 6. `apps/playground` — dogfooding

- Wire line and freehand pen tools with toolbar buttons.
- Accumulate pen points in `gestureRef.current.points` during pointerMove; commit exactly one `createShape` transaction on pointerUp (R-018).
- Wire `onFallback` option on `documentToSvg` to display fallback status in the UI.

## Constraints

- No file over ~300 lines (R-010). TS strict everywhere; no `any`.
- Zero runtime dependencies in all new packages (R-002).
- Pure cores, imperative shell (R-008).
- Tests named by behavior (R-015).

## Verification

```bash
pnpm check
pnpm --filter @open-draw/contracts test
pnpm --filter @open-draw/shapes test
pnpm --filter @open-draw/document test
pnpm --filter @open-draw/renderer-svg test
pnpm --filter @open-draw/canvas test
```

## Deliverable protocol (R-043)

Ship with:

1. Decision inventory of every transcription judgment.
2. Quoted rules per file.
3. Exact verification commands.
4. Independent adversarial review before final PR.
