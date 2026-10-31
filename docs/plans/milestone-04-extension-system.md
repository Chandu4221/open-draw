# Milestone 04 — Extension System

> Target: `docs/plans/milestone-04-extension-system.md` · Branch: `feat/extension-system` ·
> Rides in the same PR as the code it describes (R-043 pattern from 02b/03).
> Status: RATIFIED and in execution (ADR-0003, R-044).

## Goal

Stand up the extension seams promised by the blueprint (§ Plugin system, § Shape contract, §
Rendering): shape **capabilities**, **custom renderer registration with defined fallback**, and a
**first-class plugin registration/validation layer** that treats unknown plugin data as opaque and
preserves it. Dogfood the system by adding the two remaining initial shapes — **pen path** and
**line** — through the extension system itself, not by special-casing the core.

## Exit criteria

- A new shape kind can be registered at runtime without touching `@open-draw/canvas`,
  `@open-draw/document`, or `@open-draw/renderer-svg` internals (apps integrate, not implement —
  R per ADR-0001 D4).
- Every renderer declares the shape kinds it supports; unsupported kinds hit a **defined fallback**,
  never a crash and never a silent no-op.
- A plugin can be registered with a namespaced id and a versioned contract; invalid registrations
  fail loudly with typed errors (R-006 "parse, don't validate").
- Plugin-authored data on a shape round-trips through serialize/parse **byte-stably and opaquely** —
  the engine never interprets it (unknown data preserved, R per blueprint).
- All 5 shape kinds (page, section, rect, ellipse, + pen path, line) render in the playground via
  the registry path, zero `if kind ===` stringly branches in core code.
- CI green: format + lint + typecheck + test + build; Codex adversarial review pass recorded
  (R-043).

## Scope (in)

- `packages/contracts`: capability + plugin contract types (pure types + registries, no runtime).
- New package `@open-draw/shapes`: built-in shape-kind modules — rect, ellipse, pen path, line —
  each one folder per registry layout (R: one item = one folder = one index.ts).
- `@open-draw/renderer-svg`: shape-kind render function registry + fallback rendering (renderer
  never canonical state — dep rules table).
- `@open-draw/canvas`: registration seam (`registerShapeKind`-style API on the controller /
  createCanvas options), tool registration for pen + line.
- `@open-draw/document`: plugin-data field on ShapeMeta (opaque), validation treats it as
  pass-through; serialize/parse preserve it byte-stably.
- Playground glue: register built-ins, draw with pen/line tools.

## Scope (out)

- Semantic wireframing vocabulary (milestone 05).
- Crayon/hand-drawn render styles (milestone 06).
- Third-party plugin loading from network/npm (registration API only).
- Spatial index / perf work.

## Decision inventory (ALL RATIFIED, Oct 31 — Chandra + delegation)

1. **[RULING] Capability contract shape.** Blueprint says "shared core + optional capabilities, no
   god-interface". Proposal: each shape-kind module declares `capabilities: readonly
CapabilityId[]` from a `CAPABILITIES` const registry in contracts (e.g. `resizable`,
   `movable`, `text-label`, `freehand-path`); the canvas core checks capability membership
   (typed lookup, no stringly `===`). Alternative: per-capability interface detection
   (structural). Which?
2. **[RULING] Plugin id format.** Proposal: `"<scope>:<name>"` kebab-case branded type
   `PluginId`, registry-validated on registration; document-level unknown ids preserved as-is.
   Confirm, or prefer `@scope/name`?
3. **[RULING] Fallback semantics.** When the active renderer meets an unregistered kind:
   proposal = render a neutral dashed placeholder box + kind label via `SHAPE_KIND_LABELS`,
   and emit a typed `rendererFallback` event; NEVER throw in render loop. Confirm?
4. **[RULING] Plugin data location + versioning.** Proposal: `meta.pluginData?: Readonly<
Record<PluginId, unknown>>` on ShapeMeta (opaque, never validated past type level), plugin
   contract carries `contractVersion: 1` literal checked at registration. Confirm? PLUS
   (review-1 finding 2): ADR-0003 records an explicit R-006 exemption — R-044 candidate:
   "`meta.pluginData` is an opaque forward-compatibility namespace; R-006 applies to the
   envelope (PluginId format + JSON-serializability check at serialize time — a non-serializable
   value IS a typed throw), never to contents."
5. **[RULING] Pen path / line geometry in milestone 04.** Both need non-rect hit-testing
   (path-distance) and a `points`-based bounding-box derivation. In-scope here, or defer pen
   path and ship only `line` (cheaper) this milestone? (Blueprint lists rect/ellipse/pen/line
   as initial shapes; no deadline pressure.)
6. **[RULING — RESOLVED RECOMMENDED] Where the shape-kind registry lives.** PROPOSAL: hybrid
   closed-core + pattern-open. `SHAPE_KINDS` in contracts stays the CLOSED core registry
   (page/section/rect/ellipse/line/pen-path). `parseDocument` accepts kind values that either
   (a) match `SHAPE_KIND_VALUES`, or (b) match the namespaced `scope:name` format → branded
   `CustomShapeId` (leaf-only: container-kind validation applies, custom kinds default to leaf
   unless the module declares `isContainer`). Renderer/tool lookup keyed by kind value. NO silent
   string acceptance — malformed format = typed `invalidShape` throw (R-006). Rationale: keeps
   R-005 for the closed core, makes the boundary rule-based, and unblocks true runtime
   registration (Codex review-1 finding 1).
7. **[RULING — NEW, review-1 finding 5] Tools: static or dynamic?** RECOMMENDATION: static.
   `drawLine` + `drawPenPath` are built-ins → add to the closed `TOOLS` registry in canvas
   (R-005, R-036 forever-contract). Dynamic third-party tool registration is explicitly DEFERRED
   to ADR-0003 "future work" — extensions register shape kinds + renderers in 04, not tools.

## Work breakdown (sketch — final file list after rulings)

- `packages/contracts/src/capabilities.ts` — `CAPABILITIES` registry + `CapabilityId`.
- `packages/contracts/src/plugin-contract.ts` — `PluginId` (branded), `PluginContract`,
  `CONTRACT_VERSION`.
- `packages/contracts/src/shape-kinds.ts` — add `pen-path`, `line` values + labels.
- `packages/shapes/*` — new package, one folder per shape kind; each module: kind id, default
  shape constructor (smart, frozen, rejects ROOT_ID per 02 pattern), capabilities list, geometry
  helpers (pure). DEPENDENCY PLACEMENT (review-1 finding 3, amends ADR-0001 D2 table in this
  PR): `shapes → contracts` ONLY; `document` does NOT depend on shapes (stays kind-agnostic);
  `renderer-svg → shapes` allowed; `canvas` does NOT depend on shapes (built-ins registered by
  the app; canvas stays generic); playground wires all.
- `packages/document/src/shape.ts` — extend union with pen-path/line variants;
  `meta.pluginData` field; validation pass-through; serialize/parse: pluginData emitted only when
  present, key order = insertion order (z-order ruling precedent), unknown ids preserved.
- `packages/canvas/src/register-shape-kind.ts` (+ tool registration for pen/line) — pure
  registration functions + controller wiring; registration validation throws typed errors
  (duplicate id, unknown capability, malformed plugin id).
- `packages/renderer-svg/src/kinds/*` — per-kind render fn registry keyed by ShapeKind value,
  fallback renderer, `rendererFallback` event.
- Tests: registration validation, fallback rendering, pluginData byte-stable round-trip,
  line/pen-path hit-test geometry, capability gating (e.g. non-movable kinds ignored by
  MoveShapes), custom-kind parse (namespaced format accepted, malformed throws).
- Docs: `docs/decisions/0003-extension-system.md` (records all 7 rulings + the R-044 exemption
  and the ADR-0001 D2 table amendment for `@open-draw/shapes`), this plan file.

## Transaction boundary spec (review-1 finding 4 — R-018)

Pen-path (and line) drawing: pointer coordinates accumulate in **transient shell gesture
state** — never in the document, never reactive, never committed mid-gesture. Exactly **ONE
`CreateShape` transaction** dispatches at `pointerUp` with the full point list. Undo removes the
whole stroke in one history step. Regression test required: "drawing a 60-point stroke adds
exactly 1 history entry" (count history stack depth before/after).

## Geometry storage spec (review-2 findings — point-carrying kinds)

1. **Box-relative points (finding 1, confirmed in `applyMoveShapes` code).**
   `LineShape.start/end` and `PenPathShape.points` are stored **relative to the shape's own
   `boundingBox` origin** (box is the local translation frame). Then `MoveShapes` — which
   translates only `boundingBox.x/y` — moves the rendered geometry with ZERO shape-specific
   branches in core commands. Smart constructors derive the box from raw points and store
   normalized box-relative points; render functions offset by the absolute box.
2. **Resize must scale points (agent extension of finding 1 — same trap, second order).**
   `SetShapeBoundingBox` also touches only `boundingBox`. For point-carrying kinds, resizing
   without touching points would detach geometry from the box. Resolution: resize of
   point-carrying kinds **proportionally scales points** to the new box. Implementation:
   `SetShapeBoundingBox` accepts an optional per-kind pure geometry hook
   (`scalePointsForBox(prevBox, nextBox, points)`) that the canvas layer injects from the
   registered shape module — the document package stays kind-agnostic (hook = explicit
   parameter, R-008 functional core). No hook registered = points unchanged (rect-like
   behavior). Tests: move line → rendered endpoints translate; resize line wider → endpoints
   scale, geometry stays inside box.

## rendererFallback emission (review-2 finding 2 — R-008 purity)

`documentToSvg` stays a pure `Document → string`. Fallback surfaces via an **optional options
object with a callback** — no event bus, no singleton, no global emitter in the renderer:

```ts
export interface RenderOptions {
  readonly onFallback?: (event: RendererFallbackEvent) => void;
}

export function documentToSvg(document: Document, options?: RenderOptions): string;
```

The canvas controller (imperative shell) passes `onFallback` and translates it into a session
event for subscribers. Pure + testable + deterministic; R-008 intact.

## Quoted rules (must appear in PR description)

- R-005 closed registries / R-006 parse-don't-validate / R-008 no classes with methods /
  R-009 pure cores / R-011+R-012 named commands / R-018 one gesture one transaction /
  R-036 forever-contract gate on public API additions / R-043 adversarial review is a
  deliverable requirement.

## Verification (Chandra runs locally)

```bash
git checkout main && git pull
git checkout -b feat/extension-system
# paste files, then:
pnpm install
pnpm check   # format + lint + typecheck + test + build
pnpm dev      # playground: draw rect/ellipse/line/pen, reload persistence, check fallback
```

## Hand-test gate (R-043 lesson: green tests ≠ working product)

1. Draw each of the 4 leaf kinds; drag, resize (movable/resizable capabilities), undo/redo.
2. Register a bogus kind in playground console → typed error, no crash.
3. Save (serialize) with plugin data injected → reload → byte-identical pluginData.
4. Unregister a renderer kind → fallback dashed box renders, event fires.

## Review gate

Codex adversarial review BEFORE paste (R-043): null-finding pass required (per proposed
amendment, review rounds repeat until a null-finding pass). Red-first tests for any defect found.

## Pending follow-ups (separate branches, do NOT ride in this PR)

- `build/ci-runner-pin` — ubuntu-24.04 pin PR.
- Tag decision: `v0.2.0` for 02b+03, and whether 04 lands in `v0.3.0`.
- R-043 amendment PR ("repeat until null-finding pass") if adopted.
- R-044 rule addition (pluginData opaque-namespace exemption) — lands in the RULES.md portion of
  THIS PR (it is a prerequisite of the milestone, not a follow-up, if ruling 4 is confirmed).
