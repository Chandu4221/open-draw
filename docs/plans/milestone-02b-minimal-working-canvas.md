# Milestone 02b — Minimal Working Canvas

Implements roadmap milestone 2: SVG render, selection, drag-to-draw, move, resize, pan, zoom. Delivered per **R-043** (decision inventory + quoted rules per file + verification commands). The RULES.md update (R-039…R-043) rides along in the same PR.

---

## Decision inventory — ratify these before pasting (R-043)

Every judgment made while transcribing, listed explicitly:

1. **Zoom:** wheel = zoom-at-cursor, clamp [0.1×, 10×]. No trackpad-pinch distinction this milestone.
2. **Pan:** middle-mouse drag OR hold Space + left-drag. Empty-canvas left-drag with the select tool does NOT pan (it clears selection; marquee comes later).
3. **Selection:** single-select only. Click empty = clear. No shift-click, no marquee — but `Selection` is a `Set`, structurally ready.
4. **Resize:** 4 corner handles on the single selection. Dragged below 1 world unit is clamped to 1 — no flip this milestone.
5. **No drag threshold:** any pointer move after down-on-shape starts the move gesture.
6. **Draw on empty canvas** creates a NEW PAGE sized to the drag, with the new shape filling it (root children must be pages — `document.ts` enforces it). Drawing over an existing page parents the shape to that page (parent-local box = world box minus the page's absolute origin).
7. **Shape/page ids** are session counters (`shape-3`, `page-2`), collision-free per session. Rethink at SDK milestone.
8. **Renderer colors** live in a `RENDER_STYLES` const registry in renderer-svg — presentation data, not stringly internals (R-005).
9. **Shell location:** the DOM wiring lives in the playground this milestone; the framework-free shell is promoted INTO `@open-draw/canvas` at milestone 3 (SDK). This milestone's canvas package = pure interaction core (camera, selection, machine, hit-test, geometry) — fully testable, zero DOM.
10. **No delete key, no keyboard navigation** this milestone (`DeleteShape` command exists; wiring deferred — milestone 2 roadmap doesn't list delete).
11. **Select on pointer-down** (review ruling): a shape hit by pointer-down is selected immediately, so the drag carries its selection overlay through the whole gesture. Click-on-empty still clears on release.
12. **Command naming follows R-039:** `SetShapeBoundingBox` with field `boundingBox` — never `SetShapeBox`/`box` (the review caught the plan's own R-039 violation).

**Adversarial review note (R-043):** this plan was independently reviewed before paste, twice. Round 1 caught six real defects (missing `parent` in `commitDraw`, hardcoded rect in the page-draw branch, inverted resize anchor math, resize delta against the shape instead of its parent, pointer capture on nodes destroyed by re-render, drag-without-select), plus the `MoveShapes` z-order pop and the command naming (R-039). Round 2 caught four more, all fixed: the machine checked `hit` before the tool, so drawing inside an existing page dragged the page instead of drawing; a bare `"page-1"` literal where the branded `ShapeId` requires `parseShapeId` (would fail typecheck); the same z-order bug still present in `SetShapeBoundingBox`; and a commit-title typo. A regression test now locks the tool-priority invariant. Round 3 caught one compile-blocking pair: `ToolId`/`CanvasStateId` derived as `keyof typeof` (keys) while all usages pass the kebab-case VALUES — fixed with the value-union pattern already used by `CommandId` (`(typeof X)[keyof typeof X]`). Three review rounds, eleven defects, all pre-paste.

Rules quoted overall: R-005, R-008, R-009, R-011, R-012, R-013, R-014, R-015, R-016, R-017, R-018, R-019, R-031, R-039, R-041.

---

## Branch & build steps

```bash
git checkout main && git pull
git checkout -b feat/minimal-canvas
# ... paste the files below (plus docs/rules/RULES.md from the rules canvas) ...
pnpm install                 # links the two new workspace packages
pnpm check                   # format + lint + typecheck + test + build — must be green
pnpm --filter playground dev # hand-test gate: draw/select/move/resize/pan/zoom/undo
```

Commits (conventional vocabulary, squash-friendly):

1. `docs: append R-039...R-043 (naming, device types, schema, delegation)`
2. `feat: add MoveShapes and SetShapeBoundingBox commands`
3. `feat: add canvas interaction core and svg renderer`
4. `feat: playground canvas shell (draw, select, move, resize, pan, zoom)`

PR title: `feat: minimal working canvas (milestone 02b)`
PR body line: `Implements roadmap milestone 2 (R-005, R-008, R-009, R-011, R-012, R-016, R-017, R-018, R-019, R-031, R-041). RULES.md R-039...R-043 appended in the same PR.`

After squash-merge: delete the branch (R-032). Also delete stale `feat/document-core` left over from PR #3.

---

## File tree (new + modified)

```
docs/rules/RULES.md                                    (MODIFIED — from the rules canvas)
packages/document/src/commands/registry.ts             (MODIFIED)
packages/document/src/commands/index.ts                (MODIFIED)
packages/document/src/transactions.ts                  (MODIFIED)
packages/document/src/commands/move-shapes/index.ts    (NEW)
packages/document/src/commands/set-shape-bounding-box/index.ts (NEW)
packages/canvas/package.json                           (NEW)
packages/canvas/tsconfig.json                          (NEW)
packages/canvas/src/index.ts                           (NEW)
packages/canvas/src/camera.ts                          (NEW)
packages/canvas/src/selection.ts                       (NEW)
packages/canvas/src/tools.ts                           (NEW)
packages/canvas/src/handles.ts                         (NEW)
packages/canvas/src/states/idle/index.ts               (NEW)
packages/canvas/src/states/pointing-shape/index.ts     (NEW)
packages/canvas/src/states/pointing-handle/index.ts   (NEW)
packages/canvas/src/states/dragging-shape/index.ts    (NEW)
packages/canvas/src/states/resizing-shape/index.ts    (NEW)
packages/canvas/src/states/drawing-shape/index.ts     (NEW)
packages/canvas/src/states/panning/index.ts           (NEW)
packages/canvas/src/states/index.ts                   (NEW)
packages/canvas/src/events.ts                         (NEW)
packages/canvas/src/machine.ts                        (NEW)
packages/canvas/src/machine.test.ts                   (NEW)
packages/canvas/src/hit-test.ts                       (NEW)
packages/canvas/src/geometry.ts                       (NEW)
packages/canvas/src/camera.test.ts                    (NEW)
packages/renderer-svg/package.json                    (NEW)
packages/renderer-svg/tsconfig.json                  (NEW)
packages/renderer-svg/src/index.ts                   (NEW)
apps/playground/src/App.tsx                           (MODIFIED — full replacement)
apps/playground/package.json                           (MODIFIED — deps only)
```

---

## `packages/document/src/commands/registry.ts` (modified)

```ts
// Closed registry of named commands (R-011/R-012, ADR-0002 D8). Members live
// in uniform folders next to this file; this file is the registry index.
export const COMMANDS = {
  createShape: "CreateShape",
  deleteShape: "DeleteShape",
  setShapeLabel: "SetShapeLabel",
  reparentShape: "ReparentShape",
  moveShapes: "MoveShapes",
  setShapeBoundingBox: "SetShapeBoundingBox",
} as const;

export type CommandId = (typeof COMMANDS)[keyof typeof COMMANDS];
```

## `packages/document/src/commands/move-shapes/index.ts` (new)

```ts
// MoveShapes: translates shapes by a parent-local delta (ADR-0002 D4 —
// parent-local coordinates). One gesture = one command batch (R-018). The
// inverse is the same batch negated — no snapshots (R-008).
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface MoveShapes {
  readonly type: (typeof COMMANDS)["moveShapes"];
  readonly ids: readonly ShapeId[];
  readonly dx: number;
  readonly dy: number;
}

export function applyMoveShapes(document: Document, command: MoveShapes): CommandResult {
  for (const id of command.ids) {
    if (document.shapes[id] === undefined) {
      throw new DocumentError("shapeNotFound", `no shape with id: ${id}`);
    }
  }
  // Replace in place, preserving map iteration order — rebuilding the map as
  // [others, moved] would pop moved shapes to the top of the z-stack
  // (review finding: sibling order IS map order).
  const movedIds = new Set<ShapeId>(command.ids);
  const shapes = Object.values(document.shapes).map((shape): Shape =>
    movedIds.has(shape.id)
      ? {
          ...shape,
          boundingBox: {
            ...shape.boundingBox,
            x: shape.boundingBox.x + command.dx,
            y: shape.boundingBox.y + command.dy,
          },
        }
      : shape,
  );
  const next = createDocument(shapes);
  const inverse: readonly Command[] = [
    { type: COMMANDS.moveShapes, ids: command.ids, dx: -command.dx, dy: -command.dy },
  ];
  return { document: next, inverse };
}
```

## `packages/document/src/commands/set-shape-bounding-box/index.ts` (new)

```ts
// SetShapeBoundingBox: replaces one shape's bounding box (resize, ADR-0002
// D4). The inverse restores the previous box. Geometry only — render styles
// never alter semantics (R-021). Named per R-039: explicit over short.
import type { BoundingBox, ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeBoundingBox {
  readonly type: (typeof COMMANDS)["setShapeBoundingBox"];
  readonly id: ShapeId;
  readonly boundingBox: BoundingBox;
}

export function applySetShapeBoundingBox(
  document: Document,
  command: SetShapeBoundingBox,
): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousBox = shape.boundingBox;
  const nextShape: Shape = { ...shape, boundingBox: command.boundingBox };
  // Replace in place, preserving map iteration order — the same z-stack rule
  // as MoveShapes (review round 2, Finding 3: filter-and-append would pop
  // the resized shape to the top of the sibling stack).
  const shapes = Object.values(document.shapes).map((entry): Shape =>
    entry.id === command.id ? nextShape : entry,
  );
  const next = createDocument(shapes);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setShapeBoundingBox, id: command.id, boundingBox: previousBox },
  ];
  return { document: next, inverse };
}
```

## `packages/document/src/commands/index.ts` (modified)

```ts
// Command registry index (uniform registry-folder layout, R-011/R-012).
import type { Document } from "../document";
import type { CreateShape } from "./create-shape";
import type { DeleteShape } from "./delete-shape";
import type { MoveShapes } from "./move-shapes";
import type { ReparentShape } from "./reparent-shape";
import type { SetShapeBoundingBox } from "./set-shape-bounding-box";
import type { SetShapeLabel } from "./set-shape-label";

export { COMMANDS } from "./registry";
export type { CommandId } from "./registry";
export type { CreateShape } from "./create-shape";
export { applyCreateShape } from "./create-shape";
export type { DeleteShape } from "./delete-shape";
export { applyDeleteShape } from "./delete-shape";
export type { SetShapeLabel } from "./set-shape-label";
export { applySetShapeLabel } from "./set-shape-label";
export type { ReparentShape } from "./reparent-shape";
export { applyReparentShape } from "./reparent-shape";
export type { MoveShapes } from "./move-shapes";
export { applyMoveShapes } from "./move-shapes";
export type { SetShapeBoundingBox } from "./set-shape-bounding-box";
export { applySetShapeBoundingBox } from "./set-shape-bounding-box";

export type Command =
  CreateShape | DeleteShape | SetShapeLabel | ReparentShape | MoveShapes | SetShapeBoundingBox;

export interface CommandResult {
  readonly document: Document;
  readonly inverse: readonly Command[];
}
```

## `packages/document/src/transactions.ts` (modified — two additions)

Add to the imports:

```ts
import { applyMoveShapes } from "./commands/move-shapes";
import { applySetShapeBoundingBox } from "./commands/set-shape-bounding-box";
```

Add to the `applyCommand` switch:

```ts
    case COMMANDS.moveShapes:
      return applyMoveShapes(document, command);
    case COMMANDS.setShapeBoundingBox:
      return applySetShapeBoundingBox(document, command);
```

## `packages/canvas/package.json` (new)

```json
{
  "name": "@open-draw/canvas",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@open-draw/contracts": "workspace:*",
    "@open-draw/document": "workspace:*"
  },
  "devDependencies": {
    "eslint": "^10.13.0",
    "typescript": "~6.0.3",
    "vitest": "^5.0.5"
  }
}
```

## `packages/canvas/tsconfig.json` (new)

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

## `packages/canvas/src/camera.ts` (new)

```ts
// Camera as a transform, never geometry (R-017): pan/zoom never rewrites
// shape coordinates. All functions pure (R-008).
import type { Point } from "@open-draw/contracts";

export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;

export function panBy(camera: Camera, screenDelta: Point): Camera {
  return {
    ...camera,
    x: camera.x - screenDelta.x / camera.zoom,
    y: camera.y - screenDelta.y / camera.zoom,
  };
}

export function zoomAt(camera: Camera, screenPoint: Point, factor: number): Camera {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * factor));
  const world = screenToWorld(camera, screenPoint);
  return { zoom, x: world.x - screenPoint.x / zoom, y: world.y - screenPoint.y / zoom };
}

export function screenToWorld(camera: Camera, screenPoint: Point): Point {
  return {
    x: camera.x + screenPoint.x / camera.zoom,
    y: camera.y + screenPoint.y / camera.zoom,
  };
}

export function worldToScreen(camera: Camera, worldPoint: Point): Point {
  return {
    x: (worldPoint.x - camera.x) * camera.zoom,
    y: (worldPoint.y - camera.y) * camera.zoom,
  };
}
```

## `packages/canvas/src/selection.ts` (new)

```ts
// Selection is transient canvas state, never document data (R-016 placement
// test: it does not survive save + reload). A set, ready for multi-select;
// this milestone only ever feeds it one id.
import type { ShapeId } from "@open-draw/contracts";

export type Selection = ReadonlySet<ShapeId>;

export const EMPTY_SELECTION: Selection = new Set();

export function selectOne(id: ShapeId): Selection {
  return new Set([id]);
}

export function clearSelection(): Selection {
  return EMPTY_SELECTION;
}

export function isSelected(selection: Selection, id: ShapeId): boolean {
  return selection.has(id);
}

export function singleSelected(selection: Selection): ShapeId | null {
  for (const id of selection) {
    return id;
  }
  return null;
}
```

## `packages/canvas/src/tools.ts` (new)

```ts
// Closed registry of interaction tools (R-005, R-012). Tools are transient
// view state — never stored in the document (R-016 placement test). Serialized
// values are kebab-case (R-014), so the type derives from the VALUES — the
// same value-union pattern as CommandId in the commands registry.
export const TOOLS = {
  select: "select",
  drawRect: "draw-rect",
  drawEllipse: "draw-ellipse",
} as const;

export type ToolId = (typeof TOOLS)[keyof typeof TOOLS];
```

## `packages/canvas/src/handles.ts` (new)

```ts
// Resize handles: transient presentation affordances (R-031 — overlays are
// presentation state only, never stored). Four corners this milestone.
export const HANDLES = {
  nw: "nw",
  ne: "ne",
  se: "se",
  sw: "sw",
} as const;

export type HandleId = keyof typeof HANDLES;
```

## `packages/canvas/src/states/idle/index.ts` (new)

```ts
// Idle: no gesture in flight (R-009).
export const IDLE = "idle" as const;
```

## `packages/canvas/src/states/pointing-shape/index.ts` (new)

```ts
// PointingShape: pointer down on a shape, not yet a drag (R-009).
export const POINTING_SHAPE = "pointing-shape" as const;
```

## `packages/canvas/src/states/pointing-handle/index.ts` (new)

```ts
// PointingHandle: pointer down on a resize handle of the selection (R-009).
export const POINTING_HANDLE = "pointing-handle" as const;
```

## `packages/canvas/src/states/dragging-shape/index.ts` (new)

```ts
// DraggingShape: a move gesture is in flight (R-009). Transient preview only
// — MoveShapes commits once, on pointer-up (R-018).
export const DRAGGING_SHAPE = "dragging-shape" as const;
```

## `packages/canvas/src/states/resizing-shape/index.ts` (new)

```ts
// ResizingShape: a resize gesture is in flight (R-009). Transient preview
// only — SetShapeBox commits once, on pointer-up (R-018).
export const RESIZING_SHAPE = "resizing-shape" as const;
```

## `packages/canvas/src/states/drawing-shape/index.ts` (new)

```ts
// DrawingShape: a drag-to-draw gesture is in flight (R-009). CreateShape
// commits once, on pointer-up (R-018).
export const DRAWING_SHAPE = "drawing-shape" as const;
```

## `packages/canvas/src/states/panning/index.ts` (new)

```ts
// Panning: the camera is in motion (R-017: a transform, never geometry).
export const PANNING = "panning" as const;
```

## `packages/canvas/src/states/index.ts` (new)

```ts
// Closed registry of interaction states (R-009/R-012): one item = one folder
// = one index.ts, always. This file is the registry index.
import { DRAWING_SHAPE } from "./drawing-shape";
import { DRAGGING_SHAPE } from "./dragging-shape";
import { IDLE } from "./idle";
import { PANNING } from "./panning";
import { POINTING_HANDLE } from "./pointing-handle";
import { POINTING_SHAPE } from "./pointing-shape";
import { RESIZING_SHAPE } from "./resizing-shape";

export const STATES = {
  idle: IDLE,
  pointingShape: POINTING_SHAPE,
  pointingHandle: POINTING_HANDLE,
  draggingShape: DRAGGING_SHAPE,
  resizingShape: RESIZING_SHAPE,
  drawingShape: DRAWING_SHAPE,
  panning: PANNING,
} as const;

export type CanvasStateId = (typeof STATES)[keyof typeof STATES];
```

## `packages/canvas/src/events.ts` (new)

```ts
// Named interaction events from the registry (R-019). The imperative shell
// computes hits and intents; the machine consumes pure data (R-008/R-009).
import type { Point, ShapeId } from "@open-draw/contracts";
import type { HandleId } from "./handles";
import type { ToolId } from "./tools";

export const CANVAS_EVENTS = {
  pointerDown: "pointerDown",
  pointerMove: "pointerMove",
  pointerUp: "pointerUp",
  wheel: "wheel",
  keyEscape: "keyEscape",
} as const;

export interface PointerDownEvent {
  readonly type: (typeof CANVAS_EVENTS)["pointerDown"];
  readonly screenPoint: Point;
  readonly worldPoint: Point;
  readonly hit: ShapeId | null;
  readonly handle: HandleId | null;
  readonly selectedShapeId: ShapeId | null;
  readonly tool: ToolId;
  readonly panRequested: boolean;
}

export interface PointerMoveEvent {
  readonly type: (typeof CANVAS_EVENTS)["pointerMove"];
  readonly screenPoint: Point;
  readonly worldPoint: Point;
}

export interface PointerUpEvent {
  readonly type: (typeof CANVAS_EVENTS)["pointerUp"];
  readonly screenPoint: Point;
  readonly worldPoint: Point;
}

export interface WheelEvent {
  readonly type: (typeof CANVAS_EVENTS)["wheel"];
  readonly screenPoint: Point;
  readonly factor: number;
}

export interface KeyEscapeEvent {
  readonly type: (typeof CANVAS_EVENTS)["keyEscape"];
}

export type CanvasEvent =
  PointerDownEvent | PointerMoveEvent | PointerUpEvent | WheelEvent | KeyEscapeEvent;
```

## `packages/canvas/src/machine.ts` (new)

```ts
// Interaction state machine: a pure (state, event) → state table (R-009).
// The machine owns state, not side effects — gesture effects (transactions)
// are computed by the shell at pointer-up: one gesture = one commit (R-008,
// R-018). Camera changes are transforms handled by the shell (R-017); the
// machine ignores wheel events.
import type { Point, ShapeId } from "@open-draw/contracts";
import type { HandleId } from "./handles";
import { CANVAS_EVENTS, type CanvasEvent } from "./events";
import { STATES, type CanvasStateId } from "./states";
import { TOOLS } from "./tools";

export interface MachineState {
  readonly stateId: CanvasStateId;
  readonly activeShapeId: ShapeId | null;
  readonly activeHandleId: HandleId | null;
  readonly drawOrigin: Point | null;
}

export const INITIAL_MACHINE_STATE: MachineState = {
  stateId: STATES.idle,
  activeShapeId: null,
  activeHandleId: null,
  drawOrigin: null,
};

export function transition(previous: MachineState, event: CanvasEvent): MachineState {
  switch (event.type) {
    case CANVAS_EVENTS.pointerDown: {
      if (event.panRequested) {
        return { ...INITIAL_MACHINE_STATE, stateId: STATES.panning };
      }
      // A draw tool always draws — even over pages and shapes. Checked BEFORE
      // hit/handle so drawing inside an existing page is never hijacked into
      // a drag of the page itself (review round 2, Finding 1).
      if (event.tool !== TOOLS.select) {
        return {
          ...INITIAL_MACHINE_STATE,
          stateId: STATES.drawingShape,
          drawOrigin: event.worldPoint,
        };
      }
      if (event.handle !== null) {
        return {
          ...INITIAL_MACHINE_STATE,
          stateId: STATES.pointingHandle,
          activeShapeId: event.selectedShapeId,
          activeHandleId: event.handle,
        };
      }
      if (event.hit !== null) {
        return {
          ...INITIAL_MACHINE_STATE,
          stateId: STATES.pointingShape,
          activeShapeId: event.hit,
        };
      }
      return INITIAL_MACHINE_STATE;
    }
    case CANVAS_EVENTS.pointerMove: {
      if (previous.stateId === STATES.pointingShape) {
        return { ...previous, stateId: STATES.draggingShape };
      }
      if (previous.stateId === STATES.pointingHandle) {
        return { ...previous, stateId: STATES.resizingShape };
      }
      return previous;
    }
    case CANVAS_EVENTS.pointerUp: {
      return INITIAL_MACHINE_STATE;
    }
    case CANVAS_EVENTS.wheel: {
      return previous;
    }
    case CANVAS_EVENTS.keyEscape: {
      return INITIAL_MACHINE_STATE;
    }
  }
}
```

## `packages/canvas/src/hit-test.ts` (new)

```ts
// Pure hit-testing over the canonical document (R-016: no cached truth).
// Topmost = last in the pre-order walk. Handles are picked in screen space.
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, shapeListInOrder, type Document } from "@open-draw/document";
import { worldToScreen, type Camera } from "./camera";
import { HANDLES, type HandleId } from "./handles";

export const HANDLE_PICK_RADIUS_PX = 8;

export function pointInBox(box: BoundingBox, point: Point): boolean {
  return (
    point.x >= box.x &&
    point.x < box.x + box.width &&
    point.y >= box.y &&
    point.y < box.y + box.height
  );
}

export function pickShape(document: Document, worldPoint: Point): ShapeId | null {
  const ordered = shapeListInOrder(document);
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const shape = ordered[index]!;
    if (pointInBox(absoluteBoundingBox(document, shape), worldPoint)) {
      return shape.id;
    }
  }
  return null;
}

export function pickHandle(
  camera: Camera,
  worldBox: BoundingBox,
  screenPoint: Point,
): HandleId | null {
  const corners: ReadonlyArray<readonly [HandleId, Point]> = [
    [HANDLES.nw, { x: worldBox.x, y: worldBox.y }],
    [HANDLES.ne, { x: worldBox.x + worldBox.width, y: worldBox.y }],
    [HANDLES.se, { x: worldBox.x + worldBox.width, y: worldBox.y + worldBox.height }],
    [HANDLES.sw, { x: worldBox.x, y: worldBox.y + worldBox.height }],
  ];
  for (const [handle, corner] of corners) {
    const onScreen = worldToScreen(camera, corner);
    if (
      Math.abs(onScreen.x - screenPoint.x) <= HANDLE_PICK_RADIUS_PX &&
      Math.abs(onScreen.y - screenPoint.y) <= HANDLE_PICK_RADIUS_PX
    ) {
      return handle;
    }
  }
  return null;
}
```

## `packages/canvas/src/geometry.ts` (new)

```ts
// Pure gesture geometry (R-008): the draw and resize math, free functions
// over plain data. All boxes are in world space; the shell converts to
// parent-local before committing commands.
import type { BoundingBox, Point } from "@open-draw/contracts";
import { HANDLES, type HandleId } from "./handles";

export const MIN_SHAPE_SIZE = 1;

// A draw gesture anchored at `start`, wherever the pointer is now.
export function normalizeBox(start: Point, end: Point): BoundingBox {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.max(MIN_SHAPE_SIZE, Math.abs(end.x - start.x)),
    height: Math.max(MIN_SHAPE_SIZE, Math.abs(end.y - start.y)),
  };
}

// Resizes from a corner handle. The anchored edges NEVER move — only the
// dragged edge does (review Bug 3 fix). Never below MIN_SHAPE_SIZE; no flip
// this milestone.
export function resizeBox(original: BoundingBox, handle: HandleId, worldPoint: Point): BoundingBox {
  const right = original.x + original.width;
  const bottom = original.y + original.height;
  switch (handle) {
    case HANDLES.se:
      return {
        x: original.x,
        y: original.y,
        width: Math.max(MIN_SHAPE_SIZE, worldPoint.x - original.x),
        height: Math.max(MIN_SHAPE_SIZE, worldPoint.y - original.y),
      };
    case HANDLES.ne: {
      const y = Math.min(worldPoint.y, bottom - MIN_SHAPE_SIZE);
      return {
        x: original.x,
        y,
        width: Math.max(MIN_SHAPE_SIZE, worldPoint.x - original.x),
        height: bottom - y,
      };
    }
    case HANDLES.sw: {
      const x = Math.min(worldPoint.x, right - MIN_SHAPE_SIZE);
      return {
        x,
        y: original.y,
        width: right - x,
        height: Math.max(MIN_SHAPE_SIZE, worldPoint.y - original.y),
      };
    }
    case HANDLES.nw: {
      const x = Math.min(worldPoint.x, right - MIN_SHAPE_SIZE);
      const y = Math.min(worldPoint.y, bottom - MIN_SHAPE_SIZE);
      return { x, y, width: right - x, height: bottom - y };
    }
  }
}
```

## `packages/canvas/src/index.ts` (new)

```ts
// @open-draw/canvas — the interaction core for milestone 02b: camera
// transform, selection, pure state machine, hit-testing, gesture geometry.
// Pure data + pure functions only (R-008); zero DOM, zero runtime deps.
// The framework-free DOM shell is promoted into this package at milestone 3.
export * from "./camera";
export * from "./events";
export * from "./geometry";
export * from "./handles";
export * from "./hit-test";
export * from "./machine";
export * from "./selection";
export * from "./states";
export * from "./tools";
```

## `packages/canvas/src/camera.test.ts` (new)

```ts
// Camera behavior (R-015: describe = subject, it = behavior).
import { describe, expect, it } from "vitest";
import { DEFAULT_CAMERA, MAX_ZOOM, MIN_ZOOM, panBy, screenToWorld, zoomAt } from "./camera";

describe("camera", () => {
  it("maps screen points to world points at zoom 1", () => {
    expect(screenToWorld(DEFAULT_CAMERA, { x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });

  it("maps screen points through pan and zoom", () => {
    const camera = { x: 100, y: 50, zoom: 2 };
    expect(screenToWorld(camera, { x: 40, y: 30 })).toEqual({ x: 120, y: 65 });
  });

  it("keeps the world point under the cursor when zooming", () => {
    const screenPoint = { x: 30, y: 40 };
    const before = screenToWorld(DEFAULT_CAMERA, screenPoint);
    const after = zoomAt(DEFAULT_CAMERA, screenPoint, 2);
    expect(screenToWorld(after, screenPoint)).toEqual(before);
  });

  it("clamps zoom to the configured range", () => {
    expect(zoomAt(DEFAULT_CAMERA, { x: 0, y: 0 }, 100).zoom).toBe(MAX_ZOOM);
    expect(zoomAt(DEFAULT_CAMERA, { x: 0, y: 0 }, 0.001).zoom).toBe(MIN_ZOOM);
  });

  it("pans in the opposite direction of the screen drag", () => {
    const panned = panBy(DEFAULT_CAMERA, { x: 100, y: 50 });
    expect(panned.x).toBe(-100);
    expect(panned.y).toBe(-50);
  });
});
```

## `packages/canvas/src/machine.test.ts` (new)

```ts
// Interaction machine behavior (R-009/R-015). Ids are branded types — use
// parseShapeId at the boundary (R-006), never bare literals.
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { CANVAS_EVENTS } from "./events";
import { INITIAL_MACHINE_STATE, transition } from "./machine";
import { STATES } from "./states";
import { TOOLS } from "./tools";

const downOnShape = {
  type: CANVAS_EVENTS.pointerDown,
  screenPoint: { x: 0, y: 0 },
  worldPoint: { x: 10, y: 10 },
  hit: parseShapeId("shape-1"),
  handle: null,
  selectedShapeId: null,
  tool: TOOLS.select,
  panRequested: false,
} as const;

describe("interaction machine", () => {
  it("goes idle to pointingShape on pointer down over a shape", () => {
    const next = transition(INITIAL_MACHINE_STATE, downOnShape);
    expect(next.stateId).toBe(STATES.pointingShape);
    expect(next.activeShapeId).toBe("shape-1");
  });

  it("promotes pointingShape to draggingShape on the first move", () => {
    const pointing = transition(INITIAL_MACHINE_STATE, downOnShape);
    const dragging = transition(pointing, {
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: { x: 5, y: 5 },
      worldPoint: { x: 15, y: 15 },
    });
    expect(dragging.stateId).toBe(STATES.draggingShape);
  });

  it("returns to idle on pointer up", () => {
    const dragging = transition(transition(INITIAL_MACHINE_STATE, downOnShape), {
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: { x: 5, y: 5 },
      worldPoint: { x: 15, y: 15 },
    });
    const released = transition(dragging, {
      type: CANVAS_EVENTS.pointerUp,
      screenPoint: { x: 5, y: 5 },
      worldPoint: { x: 15, y: 15 },
    });
    expect(released.stateId).toBe(STATES.idle);
  });

  it("starts drawing on pointer down over empty space with a draw tool", () => {
    const next = transition(INITIAL_MACHINE_STATE, {
      ...downOnShape,
      hit: null,
      tool: TOOLS.drawRect,
    });
    expect(next.stateId).toBe(STATES.drawingShape);
    expect(next.drawOrigin).toEqual({ x: 10, y: 10 });
  });

  it("draws even when the pointer is over a shape with a draw tool", () => {
    // Review round 2, Finding 1: the draw-tool check MUST win over the hit —
    // otherwise drawing inside the default page drags the page instead.
    const next = transition(INITIAL_MACHINE_STATE, {
      ...downOnShape,
      tool: TOOLS.drawRect,
    });
    expect(next.stateId).toBe(STATES.drawingShape);
  });

  it("stays idle on pointer down over empty space with the select tool", () => {
    const next = transition(INITIAL_MACHINE_STATE, { ...downOnShape, hit: null });
    expect(next.stateId).toBe(STATES.idle);
  });

  it("enters panning when pan is requested", () => {
    const next = transition(INITIAL_MACHINE_STATE, { ...downOnShape, panRequested: true });
    expect(next.stateId).toBe(STATES.panning);
  });

  it("cancels any gesture on escape", () => {
    const drawing = transition(INITIAL_MACHINE_STATE, {
      ...downOnShape,
      hit: null,
      tool: TOOLS.drawEllipse,
    });
    expect(transition(drawing, { type: CANVAS_EVENTS.keyEscape })).toEqual(INITIAL_MACHINE_STATE);
  });
});
```

## `packages/canvas/src/geometry.test.ts` (new)

```ts
// Gesture geometry behavior (R-015). These exist specifically because the
// adversarial review caught inverted anchor math that no test would have
// caught otherwise (R-043).
import { describe, expect, it } from "vitest";
import { HANDLES } from "./handles";
import { MIN_SHAPE_SIZE, normalizeBox, resizeBox } from "./geometry";

describe("normalizeBox", () => {
  it("produces a positive box from an up-left drag", () => {
    expect(normalizeBox({ x: 100, y: 100 }, { x: 40, y: 60 })).toEqual({
      x: 40,
      y: 60,
      width: 60,
      height: 40,
    });
  });

  it("never produces a box smaller than the minimum size", () => {
    expect(normalizeBox({ x: 10, y: 10 }, { x: 10, y: 10 })).toEqual({
      x: 10,
      y: 10,
      width: MIN_SHAPE_SIZE,
      height: MIN_SHAPE_SIZE,
    });
  });
});

describe("resizeBox", () => {
  const original = { x: 10, y: 10, width: 100, height: 50 };

  it("grows from the south-east handle", () => {
    expect(resizeBox(original, HANDLES.se, { x: 150, y: 100 })).toEqual({
      x: 10,
      y: 10,
      width: 140,
      height: 90,
    });
  });

  it("keeps the bottom anchored when dragging the north-east handle down", () => {
    expect(resizeBox(original, HANDLES.ne, { x: 150, y: 40 })).toEqual({
      x: 10,
      y: 40,
      width: 140,
      height: 20,
    });
  });

  it("keeps the right edge anchored when dragging the south-west handle", () => {
    expect(resizeBox(original, HANDLES.sw, { x: 60, y: 100 })).toEqual({
      x: 60,
      y: 10,
      width: 50,
      height: 90,
    });
  });

  it("anchors both opposite edges from the north-west handle", () => {
    expect(resizeBox(original, HANDLES.nw, { x: 0, y: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 110,
      height: 60,
    });
  });

  it("clamps at the minimum size without flipping past the anchored edge", () => {
    const resized = resizeBox(original, HANDLES.ne, { x: 150, y: 200 });
    expect(resized.y + resized.height).toBe(60); // bottom stays anchored
    expect(resized.height).toBe(MIN_SHAPE_SIZE);
  });
});
```

## `packages/canvas/src/hit-test.test.ts` (new)

```ts
// Hit-testing behavior (R-015/R-016: picks are computed from the canonical
// document, never cached).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { DEFAULT_CAMERA } from "./camera";
import { HANDLES } from "./handles";
import { pickHandle, pickShape, pointInBox } from "./hit-test";

const pageId = parseShapeId("page-1");
const firstId = parseShapeId("rect-first");
const secondId = parseShapeId("rect-second");

const document = createDocument([
  createPage(pageId, { x: 0, y: 0, width: 640, height: 480 }),
  createRect(firstId, { x: 10, y: 10, width: 50, height: 50 }, { parent: pageId }),
  createRect(secondId, { x: 30, y: 30, width: 50, height: 50 }, { parent: pageId }),
]);

describe("pointInBox", () => {
  it("detects a point inside a box", () => {
    expect(pointInBox({ x: 10, y: 10, width: 50, height: 50 }, { x: 20, y: 20 })).toBe(true);
  });

  it("treats the right and bottom edges as outside", () => {
    expect(pointInBox({ x: 10, y: 10, width: 50, height: 50 }, { x: 60, y: 10 })).toBe(false);
  });
});

describe("pickShape", () => {
  it("picks the topmost shape in walk order", () => {
    expect(pickShape(document, { x: 40, y: 40 })).toBe(secondId);
  });

  it("picks the only shape at an exclusive point", () => {
    expect(pickShape(document, { x: 15, y: 15 })).toBe(firstId);
  });

  it("returns null over empty canvas", () => {
    expect(pickShape(document, { x: 700, y: 10 })).toBe(null);
  });
});

describe("pickHandle", () => {
  it("picks a corner handle within the screen radius", () => {
    const box = { x: 10, y: 10, width: 50, height: 50 };
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 12, y: 8 })).toBe(HANDLES.nw);
  });

  it("returns null outside the radius", () => {
    const box = { x: 10, y: 10, width: 50, height: 50 };
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 40, y: 40 })).toBe(null);
  });
});
```

## `packages/document/src/transactions.test.ts` (additions)

Add these cases inside the existing describe, merging imports (reuse the
file's existing id helpers if it has them — the shipped file may already
cast ids at a helper boundary):

```ts
it("moves a shape as one batch and undoes without reordering siblings", () => {
  const pageId = parseShapeId("page-1");
  const firstId = parseShapeId("rect-first");
  const secondId = parseShapeId("rect-second");
  const built = createDocument([
    createPage(pageId, { x: 0, y: 0, width: 640, height: 480 }),
    createRect(firstId, { x: 10, y: 10, width: 20, height: 20 }, { parent: pageId }),
    createRect(secondId, { x: 50, y: 10, width: 20, height: 20 }, { parent: pageId }),
  ]);

  const moved = applyTransaction(
    built,
    createTransaction([{ type: COMMANDS.moveShapes, ids: [firstId], dx: 5, dy: 5 }]),
  );
  expect(moved.document.shapes[firstId]?.boundingBox.x).toBe(15);

  const undone = undo(moved.document, recordHistory(EMPTY_HISTORY, moved.inverse));
  expect(undone?.document.shapes[firstId]?.boundingBox.x).toBe(10);
  // z-order preserved (review finding): moving must not pop the shape to the
  // top of the stack.
  const order = Object.keys(undone?.document.shapes ?? {});
  expect(order.indexOf("rect-first")).toBeLessThan(order.indexOf("rect-second"));
});

it("resizes a shape and restores the previous box on undo", () => {
  const pageId = parseShapeId("page-1");
  const rectId = parseShapeId("rect-1");
  const built = createDocument([
    createPage(pageId, { x: 100, y: 100, width: 640, height: 480 }),
    createRect(rectId, { x: 10, y: 10, width: 50, height: 30 }, { parent: pageId }),
  ]);

  const resized = applyTransaction(
    built,
    createTransaction([
      {
        type: COMMANDS.setShapeBoundingBox,
        id: rectId,
        boundingBox: { x: 10, y: 10, width: 80, height: 60 },
      },
    ]),
  );
  expect(resized.document.shapes[rectId]?.boundingBox.width).toBe(80);

  const undone = undo(resized.document, recordHistory(EMPTY_HISTORY, resized.inverse));
  expect(undone?.document.shapes[rectId]?.boundingBox).toEqual({
    x: 10,
    y: 10,
    width: 50,
    height: 30,
  });
});
```

## `packages/renderer-svg/package.json` (new)

```json
{
  "name": "@open-draw/renderer-svg",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run --passWithNoTests",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@open-draw/contracts": "workspace:*",
    "@open-draw/document": "workspace:*"
  },
  "devDependencies": {
    "eslint": "^10.13.0",
    "typescript": "~6.0.3",
    "vitest": "^5.0.5"
  }
}
```

## `packages/renderer-svg/tsconfig.json` (new)

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

## `packages/renderer-svg/src/index.ts` (new)

```ts
// SVG rendering of the canonical document (R-016: SVG is a rendering result,
// never truth; R-020: the renderer never holds canonical state). Pure
// Document → string (R-008). Presentation constants are registry data, not
// stringly internals (R-005).
import type { BoundingBox } from "@open-draw/contracts";
import { SHAPE_KINDS } from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  shapeListInOrder,
  type Document,
  type Shape,
} from "@open-draw/document";

const RENDER_STYLES = {
  contentFill: "#ffffff",
  contentStroke: "#1f2933",
  pageFill: "none",
  pageStroke: "#8a94a6",
  pageDasharray: "8 6",
  sectionFill: "#f5f7fa",
  sectionStroke: "#8a94a6",
  selectionStroke: "#2563eb",
  selectionDasharray: "4 4",
  handleFill: "#2563eb",
} as const;

export const HANDLE_SIZE_PX = 8;

export function shapeToSvg(shape: Shape, box: BoundingBox): string {
  switch (shape.kind) {
    case SHAPE_KINDS.page:
      return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.pageFill}" stroke="${RENDER_STYLES.pageStroke}" stroke-dasharray="${RENDER_STYLES.pageDasharray}" />`;
    case SHAPE_KINDS.section:
      return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.sectionFill}" stroke="${RENDER_STYLES.sectionStroke}" />`;
    case SHAPE_KINDS.rect:
      return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.contentStroke}" />`;
    case SHAPE_KINDS.ellipse:
      return `<ellipse cx="${box.x + box.width / 2}" cy="${box.y + box.height / 2}" rx="${box.width / 2}" ry="${box.height / 2}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.contentStroke}" />`;
  }
}

// The whole document in pre-order walk order (structural order).
export function documentToSvg(document: Document): string {
  return shapeListInOrder(document)
    .map((shape) => shapeToSvg(shape, absoluteBoundingBox(document, shape)))
    .join("");
}

// Selection outline + corner handles, in world space. Handle size is divided
// by zoom so overlays counter-scale and never detach (R-031).
export function selectionOverlayToSvg(box: BoundingBox, zoom: number): string {
  const outline = `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="${RENDER_STYLES.selectionStroke}" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
  const half = HANDLE_SIZE_PX / zoom / 2;
  const corners: ReadonlyArray<readonly [number, number]> = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height],
  ];
  const handles = corners
    .map(
      ([x, y]) =>
        `<rect x="${x - half}" y="${y - half}" width="${half * 2}" height="${half * 2}" fill="${RENDER_STYLES.handleFill}" />`,
    )
    .join("");
  return outline + handles;
}

// A transient gesture preview (draw-in-flight or resize-in-flight box).
// Presentation only (R-031); the document is never touched mid-gesture.
export function previewBoxToSvg(box: BoundingBox): string {
  return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${RENDER_STYLES.contentFill}" stroke="${RENDER_STYLES.selectionStroke}" stroke-dasharray="${RENDER_STYLES.selectionDasharray}" />`;
}
```

## `apps/playground/package.json` (modified — dependencies block only)

Add to `dependencies` (everything else unchanged):

```json
    "@open-draw/canvas": "workspace:*",
    "@open-draw/contracts": "workspace:*",
    "@open-draw/document": "workspace:*",
    "@open-draw/renderer-svg": "workspace:*",
```

## `apps/playground/src/App.tsx` (modified — full replacement)

```tsx
// Playground shell for milestone 02b: the thin imperative shell (R-008)
// wiring DOM events to the pure canvas core. One gesture = one transaction =
// one commit on pointer-up (R-018); drags render transient previews, never
// mid-gesture document mutations. The camera is a wrapping transform (R-017).
import { useEffect, useRef, useState } from "react";
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { parseShapeId, SHAPE_KINDS } from "@open-draw/contracts";
import {
  absoluteBoundingBox,
  applyTransaction,
  COMMANDS,
  createDocument,
  createEllipse,
  createPage,
  createRect,
  createTransaction,
  EMPTY_HISTORY,
  recordHistory,
  undo,
  type Document,
  type EllipseShape,
  type HistoryState,
  type RectShape,
} from "@open-draw/document";
import {
  CANVAS_EVENTS,
  clearSelection,
  DEFAULT_CAMERA,
  EMPTY_SELECTION,
  INITIAL_MACHINE_STATE,
  normalizeBox,
  panBy,
  pickHandle,
  pickShape,
  resizeBox,
  screenToWorld,
  selectOne,
  singleSelected,
  STATES,
  TOOLS,
  transition,
  zoomAt,
  type Camera,
  type HandleId,
  type MachineState,
  type Selection,
  type ToolId,
} from "@open-draw/canvas";
import { documentToSvg, previewBoxToSvg, selectionOverlayToSvg } from "@open-draw/renderer-svg";

type GestureKind = "move" | "draw" | "resize" | "pan" | "press";

interface Gesture {
  readonly kind: GestureKind;
  readonly startScreen: Point;
  readonly startWorld: Point;
  readonly shapeIds: readonly ShapeId[];
  readonly handleId: HandleId | null;
  readonly originalBox: BoundingBox | null;
  readonly parentHit: ShapeId | null;
}

const CANVAS_WIRE_STYLE = { width: "100%", height: "80vh", display: "block", touchAction: "none" };

export default function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const documentRef = useRef<Document>(
    createDocument([createPage(parseShapeId("page-1"), { x: 40, y: 40, width: 640, height: 480 })]),
  );
  const cameraRef = useRef<Camera>(DEFAULT_CAMERA);
  const selectionRef = useRef<Selection>(EMPTY_SELECTION);
  const machineRef = useRef<MachineState>(INITIAL_MACHINE_STATE);
  const historyRef = useRef<HistoryState>(EMPTY_HISTORY);
  const gestureRef = useRef<Gesture | null>(null);
  const lastScreenRef = useRef<Point>({ x: 0, y: 0 });
  const lastWorldRef = useRef<Point>({ x: 0, y: 0 });
  const shapeCounterRef = useRef(0);
  const pageCounterRef = useRef(1);
  const spaceRef = useRef(false);
  const toolRef = useRef<ToolId>(TOOLS.select);
  const [tool, setTool] = useState<ToolId>(TOOLS.select);

  function chooseTool(next: ToolId): void {
    toolRef.current = next;
    setTool(next);
  }

  function screenPointFrom(event: PointerEvent | WheelEvent): Point {
    const svg = svgRef.current;
    if (svg === null) {
      return { x: 0, y: 0 };
    }
    const rect = svg.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function render(): void {
    const svg = svgRef.current;
    if (svg === null) {
      return;
    }
    const camera = cameraRef.current;
    const doc = documentRef.current;
    const overlays: string[] = [];
    const selectedId = singleSelected(selectionRef.current);
    if (selectedId !== null) {
      const shape = doc.shapes[selectedId];
      if (shape !== undefined) {
        let box = absoluteBoundingBox(doc, shape);
        const gesture = gestureRef.current;
        if (gesture !== null && gesture.kind === "move" && gesture.shapeIds.includes(selectedId)) {
          box = {
            ...box,
            x: box.x + (lastWorldRef.current.x - gesture.startWorld.x),
            y: box.y + (lastWorldRef.current.y - gesture.startWorld.y),
          };
        }
        if (
          gesture !== null &&
          gesture.kind === "resize" &&
          gesture.originalBox !== null &&
          gesture.handleId !== null
        ) {
          box = resizeBox(gesture.originalBox, gesture.handleId, lastWorldRef.current);
        }
        overlays.push(selectionOverlayToSvg(box, camera.zoom));
      }
    }
    const gesture = gestureRef.current;
    if (gesture !== null && gesture.kind === "draw") {
      overlays.push(previewBoxToSvg(normalizeBox(gesture.startWorld, lastWorldRef.current)));
    }
    const world = documentToSvg(doc) + overlays.join("");
    svg.innerHTML =
      `<g transform="translate(${-camera.x * camera.zoom} ${-camera.y * camera.zoom}) ` +
      `scale(${camera.zoom})">${world}</g>`;
  }

  function commit(commands: Parameters<typeof createTransaction>[0]): void {
    const result = applyTransaction(documentRef.current, createTransaction(commands));
    documentRef.current = result.document;
    historyRef.current = recordHistory(historyRef.current, result.inverse);
  }

  function nextShapeId(): ShapeId {
    shapeCounterRef.current += 1;
    return `shape-${shapeCounterRef.current}` as ShapeId;
  }

  function nextPageId(): ShapeId {
    pageCounterRef.current += 1;
    return `page-${pageCounterRef.current}` as ShapeId;
  }

  function onPointerDown(event: PointerEvent): void {
    event.preventDefault();
    const screen = screenPointFrom(event);
    const world = screenToWorld(cameraRef.current, screen);
    const doc = documentRef.current;
    const camera = cameraRef.current;
    const selectedId = singleSelected(selectionRef.current);
    let handle: HandleId | null = null;
    if (selectedId !== null) {
      const shape = doc.shapes[selectedId];
      if (shape !== undefined && shape.kind !== SHAPE_KINDS.page) {
        handle = pickHandle(camera, absoluteBoundingBox(doc, shape), screen);
      }
    }
    const panRequested = event.button === 1 || spaceRef.current;
    const hit = panRequested ? null : pickShape(doc, world);
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.pointerDown,
      screenPoint: screen,
      worldPoint: world,
      hit,
      handle,
      selectedShapeId: selectedId,
      tool: toolRef.current,
      panRequested,
    });
    // Select on pointer-down (inventory item 11): the pressed shape carries
    // its selection overlay through the whole gesture (review Bug 6 fix).
    // Never when a draw tool is active — drawing over a page must not
    // select it (review round 2, Finding 1).
    if (hit !== null && toolRef.current === TOOLS.select) {
      selectionRef.current = selectOne(hit);
    }
    // Capture on the persistent <svg> root — inner nodes are destroyed by
    // every render(), which would abort the gesture (review Bug 5 fix).
    svgRef.current?.setPointerCapture(event.pointerId);
    const state = machineRef.current;
    const kind: GestureKind =
      state.stateId === STATES.panning
        ? "pan"
        : state.stateId === STATES.drawingShape
          ? "draw"
          : state.stateId === STATES.pointingHandle
            ? "resize"
            : state.stateId === STATES.pointingShape
              ? "move"
              : "press";
    let shapeIds: readonly ShapeId[] = [];
    if (state.stateId === STATES.pointingShape && state.activeShapeId !== null) {
      shapeIds = [state.activeShapeId];
    }
    gestureRef.current = {
      kind,
      startScreen: screen,
      startWorld: world,
      shapeIds,
      handleId: state.activeHandleId,
      originalBox:
        selectedId !== null && doc.shapes[selectedId] !== undefined
          ? absoluteBoundingBox(doc, doc.shapes[selectedId]!)
          : null,
      parentHit: hit,
    };
    lastScreenRef.current = screen;
    lastWorldRef.current = world;
    render();
  }

  function onPointerMove(event: PointerEvent): void {
    const gesture = gestureRef.current;
    if (gesture === null) {
      return;
    }
    const screen = screenPointFrom(event);
    const world = screenToWorld(cameraRef.current, screen);
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: screen,
      worldPoint: world,
    });
    if (machineRef.current.stateId === STATES.draggingShape && gesture.kind === "move") {
      gestureRef.current = {
        ...gesture,
        kind: "move",
        shapeIds: [machineRef.current.activeShapeId!],
      };
    }
    if (gesture.kind === "pan") {
      cameraRef.current = panBy(cameraRef.current, {
        x: screen.x - lastScreenRef.current.x,
        y: screen.y - lastScreenRef.current.y,
      });
    }
    lastScreenRef.current = screen;
    lastWorldRef.current = world;
    render();
  }

  function onPointerUp(event: PointerEvent): void {
    const gesture = gestureRef.current;
    if (gesture === null) {
      return;
    }
    const screen = screenPointFrom(event);
    const world = screenToWorld(cameraRef.current, screen);
    const before = machineRef.current.stateId;
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.pointerUp,
      screenPoint: screen,
      worldPoint: world,
    });
    if (before === STATES.draggingShape && gesture.shapeIds.length > 0) {
      const dx = world.x - gesture.startWorld.x;
      const dy = world.y - gesture.startWorld.y;
      if (dx !== 0 || dy !== 0) {
        commit([{ type: COMMANDS.moveShapes, ids: gesture.shapeIds, dx, dy }]);
      }
    } else if (before === STATES.resizingShape) {
      commitResize(gesture, world);
    } else if (before === STATES.drawingShape) {
      commitDraw(gesture, world);
    } else if (before === STATES.idle && gesture.kind === "press") {
      selectionRef.current = clearSelection();
    }
    gestureRef.current = null;
    render();
  }

  // Resize commit: the gesture box is world-space (absolute); the document
  // stores parent-local boxes (ADR-0002 D4). The local box is derived by
  // subtracting the PARENT's absolute origin — never the shape's own
  // (review Bug 4 fix).
  function commitResize(gesture: Gesture, world: Point): void {
    const selectedId = singleSelected(selectionRef.current);
    if (selectedId === null || gesture.handleId === null || gesture.originalBox === null) {
      return;
    }
    const doc = documentRef.current;
    const shape = doc.shapes[selectedId];
    if (shape === undefined) {
      return;
    }
    const parentShape = doc.shapes[shape.parent];
    const parentOrigin =
      parentShape === undefined ? { x: 0, y: 0 } : absoluteBoundingBox(doc, parentShape);
    const resized = resizeBox(gesture.originalBox, gesture.handleId, world);
    commit([
      {
        type: COMMANDS.setShapeBoundingBox,
        id: selectedId,
        boundingBox: {
          x: resized.x - parentOrigin.x,
          y: resized.y - parentOrigin.y,
          width: resized.width,
          height: resized.height,
        },
      },
    ]);
  }

  // Drag-to-draw: over a page → shape parented there (parent-local box,
  // `parent` explicitly passed — review Bug 1 fix); over empty canvas → a
  // new page sized to the drag with the shape filling it (inventory item 6).
  // The drawn kind follows the active tool in BOTH branches (review Bug 2
  // fix).
  function commitDraw(gesture: Gesture, world: Point): void {
    const box = normalizeBox(gesture.startWorld, world);
    const doc = documentRef.current;
    const parentHit = gesture.parentHit;
    const createDrawnShape = (parent: ShapeId, localBox: BoundingBox): RectShape | EllipseShape =>
      toolRef.current === TOOLS.drawEllipse
        ? createEllipse(nextShapeId(), localBox, { parent })
        : createRect(nextShapeId(), localBox, { parent });
    if (parentHit !== null) {
      const parent = doc.shapes[parentHit];
      if (parent !== undefined && parent.kind === SHAPE_KINDS.page) {
        const parentBox = absoluteBoundingBox(doc, parent);
        const shape = createDrawnShape(parent.id, {
          x: box.x - parentBox.x,
          y: box.y - parentBox.y,
          width: box.width,
          height: box.height,
        });
        commit([{ type: COMMANDS.createShape, shape }]);
        selectionRef.current = selectOne(shape.id);
        return;
      }
    }
    const page = createPage(nextPageId(), box);
    const shape = createDrawnShape(page.id, {
      x: 0,
      y: 0,
      width: box.width,
      height: box.height,
    });
    commit([
      { type: COMMANDS.createShape, shape: page },
      { type: COMMANDS.createShape, shape },
    ]);
    selectionRef.current = selectOne(shape.id);
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const screen = screenPointFrom(event);
    const factor = Math.exp(-event.deltaY * 0.001);
    cameraRef.current = zoomAt(cameraRef.current, screen, factor);
    machineRef.current = transition(machineRef.current, {
      type: CANVAS_EVENTS.wheel,
      screenPoint: screen,
      factor,
    });
    render();
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = true;
    }
    if (event.code === "Escape") {
      machineRef.current = transition(machineRef.current, { type: CANVAS_EVENTS.keyEscape });
      gestureRef.current = null;
      render();
    }
    if (event.ctrlKey && event.code === "KeyZ") {
      event.preventDefault();
      const undone = undo(documentRef.current, historyRef.current);
      if (undone !== null) {
        documentRef.current = undone.document;
        historyRef.current = undone.history;
        render();
      }
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = false;
    }
  }

  useEffect(() => {
    const svg = svgRef.current;
    if (svg === null) {
      return;
    }
    svg.addEventListener("pointerdown", onPointerDown);
    svg.addEventListener("pointermove", onPointerMove);
    svg.addEventListener("pointerup", onPointerUp);
    svg.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    render();
    return () => {
      svg.removeEventListener("pointerdown", onPointerDown);
      svg.removeEventListener("pointermove", onPointerMove);
      svg.removeEventListener("pointerup", onPointerUp);
      svg.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  return (
    <main>
      <h1>OpenDraw Playground</h1>
      <div>
        <button type="button" onClick={() => chooseTool(TOOLS.select)}>
          Select
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawRect)}>
          Draw rect
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawEllipse)}>
          Draw ellipse
        </button>
        <span>{tool === TOOLS.select ? "select tool" : "draw tool"}</span>
      </div>
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
    </main>
  );
}
```

One deliberate simplification inside the shell: `useEffect` without a dependency array re-wires listeners per render — intentional for this milestone because the shell is recreated fresh each render and the cleanup removes the previous set. Pointer capture sits on the persistent `<svg>` root, so re-rendering its children can never abort a gesture.

---

## Verification commands (R-043 item 3)

```bash
pnpm install
pnpm check
pnpm --filter playground dev
# Hand-test gate (the real gate — CI green ≠ correct product):
# 1. drag-select a page, draw rects/ellipses inside and on empty canvas
# 2. pointer-down selects immediately; click empty clears; drag moves (preview, then commit)
# 3. corner handles resize — anchored edges must NOT move (clamped at 1, no flip)
# 4. wheel zooms at cursor (0.1x..10x); Space/middle-drag pans
# 5. Ctrl+Z undoes the last gesture as ONE step; Escape cancels mid-drag
# 6. a moved shape keeps its z-order (does not pop above its siblings)
# 7. ellipses draw both inside pages and on empty canvas
# 8. with a draw tool active, pressing inside an existing page DRAWS — it must not drag the page
```
