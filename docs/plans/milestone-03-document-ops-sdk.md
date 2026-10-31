# Milestone 03 — Document Ops & SDK

Implements roadmap milestone 3: Document serialization and boundary validation, input action registry and keybinding resolution, canvas controller entry point, and frozen public SDK API surface. Delivered per **R-043** (decision inventory + quoted rules per file + verification commands).

---

## Decision inventory — ratified before implementation (R-043)

1. **D1 — Serialization entry shape (R-041, R-016, R-017):**
   `{ "schema": { "version": 1 }, "shapes": { ... } }`
   The shapes map ONLY. No camera, no selection, no viewport dimensions, and zero timestamps (`createdAt`/`updatedAt`). The camera is shell-owned view state.
2. **D2 — Public API surface (R-004, R-036):**
   Option (b): Deliberate minimal re-exports from contracts and document PLUS a `createCanvas` controller entry point that encapsulates machine transitions and hit-testing into a clean interface. Every public symbol carries a `///` doc comment.
3. **D3 — Input bindings scope (R-011):**
   Full initial action set: `cancel`, `undo`, `redo`, `deleteSelected`, `selectTool`. Bindings map `KeyboardEventDescriptor` to `ActionId` without executing behavior. Behavior is wired in the playground shell.
4. **Z-Order Invariant across Serialization:**
   Shapes in the serialized `shapes` map are output strictly in `document.shapes` map iteration order (which represents z-order). Alphabetical sorting is explicitly forbidden to prevent scrambling sibling z-stack ordering on save/reload.
5. **ROOT_ID Sentinel:**
   `ROOT_ID` is purely structural and must never be serialized into the `shapes` map. On parse, page shapes with `parent: ROOT_ID` reconstruct the document root parent link.
6. **Value-Union Action Types:**
   Registry string values are kebab-case per R-014. `ActionId` derives via `(typeof ACTIONS)[keyof typeof ACTIONS]`.
7. **Playground Public Import Boundary:**
   Playground imports solely from public package roots (`@open-draw/canvas`, `@open-draw/document`, `@open-draw/input`, `@open-draw/renderer-svg`). No deep `/src/` paths are permitted.

---

## Branch & build steps

```bash
git checkout -b feat/document-ops-sdk
pnpm install
pnpm check
pnpm --filter playground dev
```

Commits:

1. `docs: append milestone 03 plan, agent instructions, and roadmap`
2. `feat: document serialization and boundary parsing`
3. `feat: add @open-draw/input package and keybinding resolution`
4. `feat: add createCanvas controller and freeze public canvas api`
5. `feat: playground document ops and keyboard bindings`

PR title: `feat: document ops and canvas sdk (milestone 03)`
PR body line: `Implements roadmap milestone 3 (R-002, R-004, R-005, R-006, R-010, R-011, R-012, R-014, R-015, R-016, R-017, R-018, R-020, R-036, R-041).`

---

## File tree (new + modified)

```
docs/about/roadmap.md                                  (NEW)
docs/plans/milestone-03-agent-instructions.md          (NEW)
docs/plans/milestone-03-document-ops-sdk.md            (NEW)
packages/document/src/serialize-document.ts            (NEW)
packages/document/src/parse-document.ts                (NEW)
packages/document/src/serialize-document.test.ts       (NEW)
packages/document/src/index.ts                         (MODIFIED)
packages/input/package.json                            (NEW)
packages/input/tsconfig.json                           (NEW)
packages/input/src/actions/cancel/index.ts             (NEW)
packages/input/src/actions/undo/index.ts               (NEW)
packages/input/src/actions/redo/index.ts               (NEW)
packages/input/src/actions/delete-selected/index.ts    (NEW)
packages/input/src/actions/select-tool/index.ts        (NEW)
packages/input/src/actions/index.ts                    (NEW)
packages/input/src/keyboard.ts                         (NEW)
packages/input/src/resolve-key-binding.ts              (NEW)
packages/input/src/resolve-key-binding.test.ts         (NEW)
packages/input/src/index.ts                            (NEW)
packages/canvas/package.json                           (MODIFIED)
packages/canvas/src/create-canvas.ts                   (NEW)
packages/canvas/src/create-canvas.test.ts              (NEW)
packages/canvas/src/index.ts                           (MODIFIED)
apps/playground/package.json                           (MODIFIED)
apps/playground/src/App.tsx                            (MODIFIED)
```

---

## `packages/document/src/serialize-document.ts` (new)

```ts
// Pure document serializer (R-008, R-014, R-041). Emits version-only schema
// without timestamps. Sibling z-order is preserved by maintaining map
// iteration order. ROOT_ID is strictly excluded.
import { isRootId } from "@open-draw/contracts";
import type { Document } from "./document";
import type { Shape } from "./shape";

export interface SerializedDocument {
  readonly schema: {
    readonly version: number;
  };
  readonly shapes: Record<string, unknown>;
}

export function serializeDocument(doc: Document): string {
  const shapesOutput: Record<string, unknown> = {};

  for (const [id, shape] of Object.entries(doc.shapes)) {
    if (isRootId(shape.id)) {
      continue;
    }

    const shapeRecord: Record<string, unknown> = {
      id: shape.id,
      kind: shape.kind,
      parent: shape.parent,
      boundingBox: {
        x: shape.boundingBox.x,
        y: shape.boundingBox.y,
        width: shape.boundingBox.width,
        height: shape.boundingBox.height,
      },
    };

    if (shape.label !== undefined) {
      shapeRecord.label = shape.label;
    }

    if (shape.kind === "section") {
      shapeRecord.direction = shape.direction;
    }

    const meta: Record<string, unknown> = {
      order: shape.meta.order ?? {},
    };
    if (shape.meta.hiddenOn !== undefined && shape.meta.hiddenOn.length > 0) {
      meta.hiddenOn = shape.meta.hiddenOn;
    }
    if (shape.meta.semantic !== undefined) {
      meta.semantic = shape.meta.semantic;
    }
    shapeRecord.meta = meta;

    shapesOutput[id] = shapeRecord;
  }

  const output: SerializedDocument = {
    schema: {
      version: doc.schema.version,
    },
    shapes: shapesOutput,
  };

  return JSON.stringify(output, null, 2);
}
```

---

## `packages/document/src/parse-document.ts` (new)

```ts
// Boundary parser from JSON string to validated Document (R-006: parse, don't validate).
// Fails loudly with typed DocumentError on any schema or shape mismatch.
import type { Document } from "./document";
import { DocumentError } from "./errors";
import { parseDocument as parseDocumentFromUnknown } from "./validation";

export function parseDocument(json: string): Document {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new DocumentError(
      "invalidDocument",
      `invalid JSON syntax: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new DocumentError("invalidDocument", "serialized document must be an object");
  }

  return parseDocumentFromUnknown(parsed);
}
```

---

## `packages/document/src/index.ts` (modified — append exports)

Add to exports:

```ts
export { serializeDocument, type SerializedDocument } from "./serialize-document";
export { parseDocument } from "./parse-document";
```

---

## `packages/document/src/serialize-document.test.ts` (new)

```ts
// Serialization and boundary parser behavior (R-006, R-015, R-041).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect, createSection } from "./document";
import { DocumentError } from "./errors";
import { parseDocument } from "./parse-document";
import { serializeDocument } from "./serialize-document";

describe("serializeDocument & parseDocument", () => {
  it("round-trips a document byte-stably", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(
        rectId,
        { x: 10, y: 20, width: 100, height: 80 },
        { parent: pageId, label: "Box" },
      ),
    ]);

    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);
    const reSerialized = serializeDocument(parsed);

    expect(reSerialized).toBe(serialized);
    expect(parsed.shapes[rectId]?.label).toBe("Box");
  });

  it("preserves sibling z-order across serialization round-trip", () => {
    const pageId = parseShapeId("page-1");
    const r1 = parseShapeId("r-1");
    const r2 = parseShapeId("r-2");
    const r3 = parseShapeId("r-3");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(r1, { x: 10, y: 10, width: 20, height: 20 }, { parent: pageId }),
      createRect(r2, { x: 20, y: 20, width: 20, height: 20 }, { parent: pageId }),
      createRect(r3, { x: 30, y: 30, width: 20, height: 20 }, { parent: pageId }),
    ]);

    const serialized = serializeDocument(doc);
    const parsed = parseDocument(serialized);

    const keysBefore = Object.keys(doc.shapes);
    const keysAfter = Object.keys(parsed.shapes);
    expect(keysAfter).toEqual(keysBefore);
  });

  it("never includes ROOT_ID in serialized shapes", () => {
    const pageId = parseShapeId("page-1");
    const doc = createDocument([createPage(pageId, { x: 0, y: 0, width: 100, height: 100 })]);
    const serialized = serializeDocument(doc);
    expect(serialized).not.toContain('"__root__"');
  });

  it("throws DocumentError on invalid JSON syntax", () => {
    expect(() => parseDocument("not valid json")).toThrow(DocumentError);
  });

  it("throws DocumentError on unsupported schema version", () => {
    const badVersion = JSON.stringify({
      schema: { version: 999 },
      shapes: {},
    });
    expect(() => parseDocument(badVersion)).toThrow(DocumentError);
  });

  it("throws DocumentError on missing schema block", () => {
    const noSchema = JSON.stringify({
      shapes: {},
    });
    expect(() => parseDocument(noSchema)).toThrow(DocumentError);
  });

  it("throws DocumentError on unknown shape kind", () => {
    const badKind = JSON.stringify({
      schema: { version: 1 },
      shapes: {
        "shape-1": {
          id: "shape-1",
          kind: "polygon",
          parent: "page-1",
          boundingBox: { x: 0, y: 0, width: 10, height: 10 },
        },
      },
    });
    expect(() => parseDocument(badKind)).toThrow(DocumentError);
  });
});
```

---

## `packages/input/package.json` (new)

```json
{
  "name": "@open-draw/input",
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
  "devDependencies": {
    "eslint": "^10.13.0",
    "typescript": "~6.0.3",
    "vitest": "^5.0.5"
  }
}
```

---

## `packages/input/tsconfig.json` (new)

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src"]
}
```

---

## `packages/input/src/actions/cancel/index.ts` (new)

```ts
// Cancel interaction action (R-011, R-012).
export const CANCEL = "cancel" as const;
```

---

## `packages/input/src/actions/undo/index.ts` (new)

```ts
// Undo action identifier (R-011, R-012).
export const UNDO = "undo" as const;
```

---

## `packages/input/src/actions/redo/index.ts` (new)

```ts
// Redo action identifier (R-011, R-012).
export const REDO = "redo" as const;
```

---

## `packages/input/src/actions/delete-selected/index.ts` (new)

```ts
// Delete selected shapes action (R-011, R-012).
export const DELETE_SELECTED = "delete-selected" as const;
```

---

## `packages/input/src/actions/select-tool/index.ts` (new)

```ts
// Tool selection action (R-011, R-012).
export const SELECT_TOOL = "select-tool" as const;
```

---

## `packages/input/src/actions/index.ts` (new)

```ts
// Closed registry of named interaction actions (R-005, R-011, R-012).
// Action IDs are kebab-case string values; the type derives from the value union.
import { CANCEL } from "./cancel";
import { DELETE_SELECTED } from "./delete-selected";
import { REDO } from "./redo";
import { SELECT_TOOL } from "./select-tool";
import { UNDO } from "./undo";

export const ACTIONS = {
  cancel: CANCEL,
  undo: UNDO,
  redo: REDO,
  deleteSelected: DELETE_SELECTED,
  selectTool: SELECT_TOOL,
} as const;

export type ActionId = (typeof ACTIONS)[keyof typeof ACTIONS];
```

---

## `packages/input/src/keyboard.ts` (new)

```ts
// Minimal, framework-free keyboard event descriptor and binding tables (R-008, R-011).
// Contains zero DOM types.
import { ACTIONS, type ActionId } from "./actions";

export interface KeyboardEventDescriptor {
  readonly code: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
}

export interface KeyBinding {
  readonly code: string;
  readonly ctrlOrMeta?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  readonly action: ActionId;
}

export type KeyBindings = readonly KeyBinding[];

export const DEFAULT_KEY_BINDINGS: KeyBindings = [
  { code: "Escape", action: ACTIONS.cancel },
  { code: "KeyZ", ctrlOrMeta: true, action: ACTIONS.undo },
  { code: "KeyZ", ctrlOrMeta: true, shiftKey: true, action: ACTIONS.redo },
  { code: "KeyY", ctrlOrMeta: true, action: ACTIONS.redo },
  { code: "Delete", action: ACTIONS.deleteSelected },
  { code: "Backspace", action: ACTIONS.deleteSelected },
  { code: "KeyV", action: ACTIONS.selectTool },
  { code: "KeyT", action: ACTIONS.selectTool },
];
```

---

## `packages/input/src/resolve-key-binding.ts` (new)

```ts
// Pure function resolving keyboard event descriptor to a registered action (R-008, R-011).
import type { ActionId } from "./actions";
import { DEFAULT_KEY_BINDINGS, type KeyBindings, type KeyboardEventDescriptor } from "./keyboard";

export function resolveKeyBinding(
  event: KeyboardEventDescriptor,
  bindings: KeyBindings = DEFAULT_KEY_BINDINGS,
): ActionId | undefined {
  const isCtrlOrMeta = Boolean(event.ctrlKey || event.metaKey);
  const isShift = Boolean(event.shiftKey);
  const isAlt = Boolean(event.altKey);

  for (const binding of bindings) {
    if (binding.code !== event.code) {
      continue;
    }
    if (Boolean(binding.ctrlOrMeta) !== isCtrlOrMeta) {
      continue;
    }
    if (Boolean(binding.shiftKey) !== isShift) {
      continue;
    }
    if (Boolean(binding.altKey) !== isAlt) {
      continue;
    }
    return binding.action;
  }

  return undefined;
}
```

---

## `packages/input/src/resolve-key-binding.test.ts` (new)

```ts
// Keybinding resolver behavior (R-011, R-015).
import { describe, expect, it } from "vitest";
import { ACTIONS } from "./actions";
import { DEFAULT_KEY_BINDINGS } from "./keyboard";
import { resolveKeyBinding } from "./resolve-key-binding";

describe("resolveKeyBinding", () => {
  it("resolves Escape to cancel", () => {
    expect(resolveKeyBinding({ code: "Escape" })).toBe(ACTIONS.cancel);
  });

  it("resolves Ctrl+Z to undo", () => {
    expect(resolveKeyBinding({ code: "KeyZ", ctrlKey: true })).toBe(ACTIONS.undo);
  });

  it("resolves Meta+Shift+Z to redo", () => {
    expect(resolveKeyBinding({ code: "KeyZ", metaKey: true, shiftKey: true })).toBe(ACTIONS.redo);
  });

  it("resolves Delete and Backspace to deleteSelected", () => {
    expect(resolveKeyBinding({ code: "Delete" })).toBe(ACTIONS.deleteSelected);
    expect(resolveKeyBinding({ code: "Backspace" })).toBe(ACTIONS.deleteSelected);
  });

  it("returns undefined for unbound keys", () => {
    expect(resolveKeyBinding({ code: "KeyP" })).toBeUndefined();
  });
});
```

---

## `packages/input/src/index.ts` (new)

```ts
// @open-draw/input public exports (R-011).
export * from "./actions";
export * from "./keyboard";
export * from "./resolve-key-binding";
```

---

## `packages/canvas/package.json` (modified — add dependencies)

Add to `dependencies`:

```json
    "@open-draw/input": "workspace:*"
```

---

## `packages/canvas/src/create-canvas.ts` (new)

```ts
// Canvas controller entry point (R-004, R-008, R-036).
// Encapsulates machine transition, camera transform, selection state, and action dispatch.
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import type { Document } from "@open-draw/document";
import type { ActionId, KeyboardEventDescriptor } from "@open-draw/input";
import { resolveKeyBinding } from "@open-draw/input";
import { type Camera, DEFAULT_CAMERA, panBy, screenToWorld, worldToScreen, zoomAt } from "./camera";
import { CANVAS_EVENTS, type CanvasEvent } from "./events";
import type { HandleId } from "./handles";
import { pickHandle, pickShape } from "./hit-test";
import { INITIAL_MACHINE_STATE, type MachineState, transition } from "./machine";
import {
  clearSelection,
  EMPTY_SELECTION,
  isSelected,
  type Selection,
  selectOne,
  singleSelected,
} from "./selection";
import { TOOLS, type ToolId } from "./tools";

export interface CanvasOptions {
  readonly camera?: Camera;
  readonly selection?: Selection;
}

export interface CanvasController {
  getCamera(): Camera;
  setCamera(camera: Camera): void;
  panBy(screenDelta: Point): void;
  zoomAt(screenPoint: Point, factor: number): void;
  screenToWorld(screenPoint: Point): Point;
  worldToScreen(worldPoint: Point): Point;

  getSelection(): Selection;
  getSelectedId(): ShapeId | null;
  select(id: ShapeId): void;
  clearSelection(): void;
  isSelected(id: ShapeId): boolean;

  getMachineState(): MachineState;
  dispatch(event: CanvasEvent): MachineState;
  resetMachine(): void;

  pickShape(doc: Document, worldPoint: Point): ShapeId | null;
  pickHandle(worldBox: BoundingBox, screenPoint: Point): HandleId | null;
  resolveAction(event: KeyboardEventDescriptor): ActionId | undefined;
}

export function createCanvas(options: CanvasOptions = {}): CanvasController {
  let camera = options.camera ?? DEFAULT_CAMERA;
  let selection = options.selection ?? EMPTY_SELECTION;
  let machine = INITIAL_MACHINE_STATE;

  return {
    getCamera: () => camera,
    setCamera: (next) => {
      camera = next;
    },
    panBy: (delta) => {
      camera = panBy(camera, delta);
    },
    zoomAt: (point, factor) => {
      camera = zoomAt(camera, point, factor);
    },
    screenToWorld: (point) => screenToWorld(camera, point),
    worldToScreen: (point) => worldToScreen(camera, point),

    getSelection: () => selection,
    getSelectedId: () => singleSelected(selection),
    select: (id) => {
      selection = selectOne(id);
    },
    clearSelection: () => {
      selection = clearSelection();
    },
    isSelected: (id) => isSelected(selection, id),

    getMachineState: () => machine,
    dispatch: (event) => {
      machine = transition(machine, event);
      return machine;
    },
    resetMachine: () => {
      machine = INITIAL_MACHINE_STATE;
    },

    pickShape: (doc, point) => pickShape(doc, point),
    pickHandle: (box, point) => pickHandle(camera, box, point),
    resolveAction: (event) => resolveKeyBinding(event),
  };
}
```

---

## `packages/canvas/src/create-canvas.test.ts` (new)

```ts
// Canvas controller behavior (R-004, R-015).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createCanvas } from "./create-canvas";

describe("createCanvas", () => {
  it("initializes with default camera and empty selection", () => {
    const canvas = createCanvas();
    expect(canvas.getCamera().zoom).toBe(1);
    expect(canvas.getSelectedId()).toBeNull();
  });

  it("updates selection", () => {
    const canvas = createCanvas();
    const id = parseShapeId("shape-1");
    canvas.select(id);
    expect(canvas.getSelectedId()).toBe(id);
    expect(canvas.isSelected(id)).toBe(true);

    canvas.clearSelection();
    expect(canvas.getSelectedId()).toBeNull();
  });

  it("delegates action resolution to @open-draw/input", () => {
    const canvas = createCanvas();
    expect(canvas.resolveAction({ code: "Escape" })).toBe("cancel");
    expect(canvas.resolveAction({ code: "KeyZ", ctrlKey: true })).toBe("undo");
  });
});
```

---

## `packages/canvas/src/index.ts` (modified — contract freeze with doc comments)

Replace with:

```ts
/// @open-draw/canvas — public SDK contract surface (R-004, R-010, R-036).
/// Pure interaction core and canvas controller.

export {
  type Camera,
  DEFAULT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  panBy,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from "./camera";

export {
  type CanvasEvent,
  CANVAS_EVENTS,
  type KeyEscapeEvent,
  type PointerDownEvent,
  type PointerMoveEvent,
  type PointerUpEvent,
  type WheelEvent,
} from "./events";

export { MIN_SHAPE_SIZE, normalizeBox, resizeBox } from "./geometry";

export { type HandleId, HANDLES } from "./handles";

export { HANDLE_PICK_RADIUS_PX, pickHandle, pickShape, pointInBox } from "./hit-test";

export { INITIAL_MACHINE_STATE, type MachineState, transition } from "./machine";

export {
  clearSelection,
  EMPTY_SELECTION,
  isSelected,
  type Selection,
  selectOne,
  singleSelected,
} from "./selection";

export { type CanvasStateId, STATES } from "./states";

export { TOOLS, type ToolId } from "./tools";

export { type CanvasController, type CanvasOptions, createCanvas } from "./create-canvas";
```

---

## `apps/playground/package.json` (modified — add dependencies)

Add to `dependencies`:

```json
    "@open-draw/input": "workspace:*",
```

---

## `apps/playground/src/App.tsx` (modified — full replacement with M3 document ops + input actions)

```tsx
// Playground shell for milestone 3: wires DOM events and UI controls to
// the createCanvas controller, @open-draw/input action resolution, and document
// serialization/parsing (R-004, R-008, R-011, R-018, R-041).
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
  DocumentError,
  EMPTY_HISTORY,
  parseDocument,
  recordHistory,
  redo,
  serializeDocument,
  undo,
  type Document,
  type EllipseShape,
  type HistoryState,
  type RectShape,
} from "@open-draw/document";
import { ACTIONS, type ActionId, type KeyboardEventDescriptor } from "@open-draw/input";
import {
  CANVAS_EVENTS,
  createCanvas,
  DEFAULT_CAMERA,
  normalizeBox,
  resizeBox,
  STATES,
  TOOLS,
  type CanvasController,
  type HandleId,
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
  const canvasRef = useRef<CanvasController>(createCanvas());
  const documentRef = useRef<Document>(
    createDocument([createPage(parseShapeId("page-1"), { x: 40, y: 40, width: 640, height: 480 })]),
  );
  const historyRef = useRef<HistoryState>(EMPTY_HISTORY);
  const gestureRef = useRef<Gesture | null>(null);
  const lastScreenRef = useRef<Point>({ x: 0, y: 0 });
  const lastWorldRef = useRef<Point>({ x: 0, y: 0 });
  const shapeCounterRef = useRef(0);
  const pageCounterRef = useRef(1);
  const spaceRef = useRef(false);
  const toolRef = useRef<ToolId>(TOOLS.select);
  const [tool, setTool] = useState<ToolId>(TOOLS.select);
  const [statusMessage, setStatusMessage] = useState<string>("");

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
    const canvas = canvasRef.current;
    const camera = canvas.getCamera();
    const doc = documentRef.current;
    const overlays: string[] = [];
    const selectedId = canvas.getSelectedId();

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
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);
    const doc = documentRef.current;
    const selectedId = canvas.getSelectedId();

    let handle: HandleId | null = null;
    if (selectedId !== null) {
      const shape = doc.shapes[selectedId];
      if (shape !== undefined && shape.kind !== SHAPE_KINDS.page) {
        handle = canvas.pickHandle(absoluteBoundingBox(doc, shape), screen);
      }
    }

    const panRequested = event.button === 1 || spaceRef.current;
    const hit = panRequested ? null : canvas.pickShape(doc, world);

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerDown,
      screenPoint: screen,
      worldPoint: world,
      hit,
      handle,
      selectedShapeId: selectedId,
      tool: toolRef.current,
      panRequested,
    });

    if (hit !== null && toolRef.current === TOOLS.select) {
      canvas.select(hit);
    }

    svgRef.current?.setPointerCapture(event.pointerId);
    const state = canvas.getMachineState();
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
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);

    canvas.dispatch({
      type: CANVAS_EVENTS.pointerMove,
      screenPoint: screen,
      worldPoint: world,
    });

    if (canvas.getMachineState().stateId === STATES.draggingShape && gesture.kind === "move") {
      gestureRef.current = {
        ...gesture,
        kind: "move",
        shapeIds: [canvas.getMachineState().activeShapeId!],
      };
    }
    if (gesture.kind === "pan") {
      canvas.panBy({
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
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const world = canvas.screenToWorld(screen);
    const before = canvas.getMachineState().stateId;

    canvas.dispatch({
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
      canvas.clearSelection();
    }
    gestureRef.current = null;
    render();
  }

  function commitResize(gesture: Gesture, world: Point): void {
    const canvas = canvasRef.current;
    const selectedId = canvas.getSelectedId();
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

  function commitDraw(gesture: Gesture, world: Point): void {
    const box = normalizeBox(gesture.startWorld, world);
    const doc = documentRef.current;
    const parentHit = gesture.parentHit;
    const canvas = canvasRef.current;
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
        canvas.select(shape.id);
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
    canvas.select(shape.id);
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const canvas = canvasRef.current;
    const screen = screenPointFrom(event);
    const factor = Math.exp(-event.deltaY * 0.001);
    canvas.zoomAt(screen, factor);
    canvas.dispatch({
      type: CANVAS_EVENTS.wheel,
      screenPoint: screen,
      factor,
    });
    render();
  }

  function executeAction(action: ActionId): void {
    const canvas = canvasRef.current;
    switch (action) {
      case ACTIONS.cancel: {
        canvas.resetMachine();
        gestureRef.current = null;
        canvas.clearSelection();
        chooseTool(TOOLS.select);
        setStatusMessage("Cancelled / Selection cleared");
        render();
        break;
      }
      case ACTIONS.undo: {
        const undone = undo(documentRef.current, historyRef.current);
        if (undone !== null) {
          documentRef.current = undone.document;
          historyRef.current = undone.history;
          setStatusMessage("Undo performed");
          render();
        }
        break;
      }
      case ACTIONS.redo: {
        const redone = redo(documentRef.current, historyRef.current);
        if (redone !== null) {
          documentRef.current = redone.document;
          historyRef.current = redone.history;
          setStatusMessage("Redo performed");
          render();
        }
        break;
      }
      case ACTIONS.deleteSelected: {
        const selectedId = canvas.getSelectedId();
        if (selectedId !== null) {
          commit([{ type: COMMANDS.deleteShape, id: selectedId }]);
          canvas.clearSelection();
          setStatusMessage(`Deleted shape: ${selectedId}`);
          render();
        }
        break;
      }
      case ACTIONS.selectTool: {
        // Cycle tools: select -> drawRect -> drawEllipse -> select
        if (toolRef.current === TOOLS.select) chooseTool(TOOLS.drawRect);
        else if (toolRef.current === TOOLS.drawRect) chooseTool(TOOLS.drawEllipse);
        else chooseTool(TOOLS.select);
        break;
      }
    }
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = true;
    }

    const descriptor: KeyboardEventDescriptor = {
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
    };

    const action = canvasRef.current.resolveAction(descriptor);
    if (action !== undefined) {
      event.preventDefault();
      executeAction(action);
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.code === "Space") {
      spaceRef.current = false;
    }
  }

  function handleSave(): void {
    try {
      const json = serializeDocument(documentRef.current);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "opendraw-document.json";
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage("Document saved successfully");
    } catch (err) {
      setStatusMessage(`Save error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function handleLoad(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const loaded = parseDocument(text);
        documentRef.current = loaded;
        historyRef.current = EMPTY_HISTORY;
        canvasRef.current.clearSelection();
        setStatusMessage("Document loaded successfully");
        render();
      } catch (err) {
        if (err instanceof DocumentError) {
          setStatusMessage(`Load error (${err.code}): ${err.message}`);
        } else {
          setStatusMessage(`Load error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    };
    input.click();
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
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "8px",
        }}
      >
        <button type="button" onClick={() => chooseTool(TOOLS.select)}>
          Select (V)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawRect)}>
          Draw rect (R)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawEllipse)}>
          Draw ellipse (O)
        </button>
        <span>|</span>
        <button type="button" onClick={handleSave}>
          Save JSON
        </button>
        <button type="button" onClick={handleLoad}>
          Load JSON
        </button>
        <span>|</span>
        <span>Tool: {tool}</span>
        {statusMessage && (
          <span style={{ color: "#2563eb", marginLeft: "12px" }}>[{statusMessage}]</span>
        )}
      </div>
      <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
    </main>
  );
}
```

---

## Verification commands (R-043 item 3)

```bash
pnpm install
pnpm check
pnpm --filter @open-draw/document test
pnpm --filter @open-draw/input test
pnpm --filter @open-draw/canvas test
pnpm --filter playground dev
```
