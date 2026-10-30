# Milestone 02 — Document Model Implementation

Implements ADR-0002 (D1–D9). Every file below is paste-ready, Prettier-compliant
(double quotes, semicolons, trailing commas, 2-space, 100 cols), and compiles under
the repo's strict TS config (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
`verbatimModuleSyntax`).

## Two scoped notes before you paste

1. **Platforms registry:** `PLATFORMS` below uses the converged platform tree
   (web, android-native, flutter, ios). Your ADR-0002 D6 text says
   `"web" | "react-native"` — adjust the registry values to your final ruling; it is
   pure data, nothing else changes.
2. **`style` meta field deferred:** StyleId has no registry yet (profiles milestone),
   so `meta.style` is not in this implementation. Adding it later = one field + one
   parse branch. Also: validation is a hand-rolled typed parser (zero runtime deps) —
   Zod gets re-evaluated only when a real external boundary needs it.

---

## `packages/contracts/src/ids.ts`

```ts
// Branded shape id — the only identity a shape ever has (R-006: parse, don't
// validate). The brand keeps ids distinct from plain strings inside the core.
export type ShapeId = string & { readonly __brand: "ShapeId" };

// Structural virtual root: a registry constant, never a record in `shapes`.
// It cannot be selected, moved, deleted, or exported as a shape (ADR-0002 D2).
export const ROOT_ID = "canvas:root" as ShapeId;

const SHAPE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

// Boundary conversion: validates a candidate id and brands it. Fails loudly —
// never a silent fallback.
export function parseShapeId(value: unknown): ShapeId {
  if (typeof value !== "string" || !SHAPE_ID_PATTERN.test(value)) {
    throw new Error(`parseShapeId: invalid shape id: ${JSON.stringify(value)}`);
  }
  return value as ShapeId;
}

export function isRootId(id: ShapeId): boolean {
  return id === ROOT_ID;
}
```

## `packages/contracts/src/shape-kinds.ts`

```ts
// Closed registry of shape kinds (R-005, ADR-0002 D3). One canonical list;
// `SHAPE_KIND_LABELS` lives in the same module so display names never drift
// from the kinds they label.
export const SHAPE_KINDS = {
  page: "page",
  section: "section",
  rect: "rect",
  ellipse: "ellipse",
} as const;

export type ShapeKind = keyof typeof SHAPE_KINDS;

export const SHAPE_KIND_LABELS: Readonly<Record<ShapeKind, string>> = {
  page: "Page",
  section: "Section",
  rect: "Rectangle",
  ellipse: "Ellipse",
};

export const SHAPE_KIND_VALUES: ReadonlySet<string> = new Set(Object.values(SHAPE_KINDS));
```

## `packages/contracts/src/device-classes.ts`

```ts
// Closed registry: web device classes (ADR-0002 D6, R-028). Keys are the
// type-level ids; values are the serialized forms (kebab-case).
export const DEVICE_CLASSES = {
  mobile: "mobile",
  tablet: "tablet",
  laptop: "laptop",
  desktop: "desktop",
  largeScreen: "large-screen",
} as const;

export type DeviceClass = keyof typeof DEVICE_CLASSES;

export const DEVICE_CLASS_BY_VALUE: Readonly<Record<string, DeviceClass>> = Object.fromEntries(
  (Object.keys(DEVICE_CLASSES) as DeviceClass[]).map((deviceClass) => [
    DEVICE_CLASSES[deviceClass],
    deviceClass,
  ]),
);
```

## `packages/contracts/src/platforms.ts`

```ts
// Closed registry: platform profiles (ADR-0002 D6). Values are the serialized
// forms. Vocabulary itself lives in the profiles data modules, not here.
export const PLATFORMS = {
  web: "web",
  androidNative: "android-native",
  flutter: "flutter",
  ios: "ios",
} as const;

export type PlatformId = keyof typeof PLATFORMS;

export const PLATFORM_BY_VALUE: Readonly<Record<string, PlatformId>> = Object.fromEntries(
  (Object.keys(PLATFORMS) as PlatformId[]).map((platform) => [PLATFORMS[platform], platform]),
);
```

## `packages/contracts/src/box.ts`

```ts
// Geometry value types (ADR-0002 D4). Boxes are parent-local coordinates.
export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
```

## `packages/contracts/src/index.ts` (replaces placeholder)

```ts
// @open-draw/contracts — shared types, branded ids, and closed registries.
// Zero dependencies, zero behavior beyond constants and boundary conversion
// (R-006). Implements ADR-0002.
export * from "./box";
export * from "./device-classes";
export * from "./ids";
export * from "./platforms";
export * from "./shape-kinds";
```

---

## `packages/document/package.json` (replace existing — adds the contracts dep)

```json
{
  "name": "@open-draw/document",
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
    "@open-draw/contracts": "workspace:*"
  },
  "devDependencies": {
    "eslint": "^10.13.0",
    "typescript": "~6.0.3",
    "vitest": "^5.0.5"
  }
}
```

## `packages/document/src/errors.ts`

```ts
// Typed document errors (R-006: fail loudly with typed errors — never silent
// fallback or coercion). One canonical registry; callers branch on `code`.
export const DOCUMENT_ERRORS = {
  duplicateShapeId: "duplicate-shape-id",
  invalidCommand: "invalid-command",
  invalidDocument: "invalid-document",
  invalidMeta: "invalid-meta",
  invalidSchema: "invalid-schema",
  invalidShape: "invalid-shape",
  parentCycle: "parent-cycle",
  shapeNotFound: "shape-not-found",
  unknownParent: "unknown-parent",
} as const;

export type DocumentErrorCode = keyof typeof DOCUMENT_ERRORS;

export class DocumentError extends Error {
  readonly code: DocumentErrorCode;

  constructor(code: DocumentErrorCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = "DocumentError";
    this.code = code;
  }
}
```

## `packages/document/src/shape.ts`

```ts
// The shape union and validating constructors (ADR-0002 D3–D7). Invariants
// live in types; constructors validate at the boundary and internal code
// trusts the result (R-006, R-008).
import type { Box, DeviceClass, PlatformId, ShapeId, ShapeKind } from "@open-draw/contracts";
import { ROOT_ID, SHAPE_KINDS, isRootId } from "@open-draw/contracts";
import { DocumentError } from "./errors";

// Section flow direction: stored and validated now, consumed by the derive
// pipeline later (ADR-0002 D7).
export const SECTION_DIRECTIONS = {
  row: "row",
  column: "column",
} as const;

export type SectionDirection = keyof typeof SECTION_DIRECTIONS;

export interface SemanticTag {
  readonly id: string;
  readonly platform: PlatformId;
}

// meta absent semantic = NONE (R-024); absent hiddenOn = visible everywhere
// (R-028); absent order entry = 0 (one mechanism, two uses — ADR-0002 D6).
// `style` (local render-style override, R-026) is deferred to the profiles
// milestone: StyleId has no registry yet.
export interface ShapeMeta {
  readonly semantic?: SemanticTag;
  readonly order: Partial<Record<DeviceClass, number>>;
  readonly hiddenOn?: readonly DeviceClass[];
}

export interface BaseShape {
  readonly id: ShapeId;
  readonly kind: ShapeKind;
  readonly parent: ShapeId;
  readonly box: Box;
  readonly label?: string;
  readonly meta: ShapeMeta;
}

export interface PageShape extends BaseShape {
  readonly kind: "page";
}

export interface SectionShape extends BaseShape {
  readonly kind: "section";
  readonly direction: SectionDirection;
}

export interface RectShape extends BaseShape {
  readonly kind: "rect";
}

export interface EllipseShape extends BaseShape {
  readonly kind: "ellipse";
}

export type Shape = PageShape | SectionShape | RectShape | EllipseShape;

export interface ShapeInit {
  readonly parent?: ShapeId;
  readonly label?: string;
  readonly meta?: ShapeMeta;
}

const DEFAULT_META: ShapeMeta = { order: {} };

function baseInit(id: ShapeId, kind: ShapeKind, box: Box, init: ShapeInit): BaseShape {
  if (isRootId(id)) {
    throw new DocumentError("invalidShape", `a shape may not use the root id: ${id}`);
  }
  return {
    id,
    kind,
    parent: init.parent ?? ROOT_ID,
    box,
    ...(init.label === undefined ? {} : { label: init.label }),
    meta: init.meta ?? DEFAULT_META,
  };
}

export function createPage(id: ShapeId, box: Box, init: ShapeInit = {}): PageShape {
  return Object.freeze({ ...baseInit(id, SHAPE_KINDS.page, box, init), kind: SHAPE_KINDS.page });
}

export function createSection(
  id: ShapeId,
  box: Box,
  direction: SectionDirection,
  init: ShapeInit = {},
): SectionShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.section, box, init),
    kind: SHAPE_KINDS.section,
    direction,
  });
}

export function createRect(id: ShapeId, box: Box, init: ShapeInit = {}): RectShape {
  return Object.freeze({ ...baseInit(id, SHAPE_KINDS.rect, box, init), kind: SHAPE_KINDS.rect });
}

export function createEllipse(id: ShapeId, box: Box, init: ShapeInit = {}): EllipseShape {
  return Object.freeze({
    ...baseInit(id, SHAPE_KINDS.ellipse, box, init),
    kind: SHAPE_KINDS.ellipse,
  });
}
```

## `packages/document/src/document.ts`

```ts
// The Document value and its validating constructor (ADR-0002 D1–D2). The tree
// is derived, never stored twice; `createDocument` is the single place where
// the structural invariants (parent chains, cycle check, container rules) are
// enforced, so every document — parsed or built by commands — is valid.
import type { ShapeId } from "@open-draw/contracts";
import { SHAPE_KINDS, isRootId } from "@open-draw/contracts";
import { DocumentError } from "./errors";
import type { Shape } from "./shape";

export const SCHEMA_VERSION = 1 as const;

export interface DocumentSchema {
  readonly version: typeof SCHEMA_VERSION;
}

export interface Document {
  readonly schema: DocumentSchema;
  readonly shapes: Readonly<Record<ShapeId, Shape>>;
}

const CONTAINER_KINDS: ReadonlySet<string> = new Set([SHAPE_KINDS.page, SHAPE_KINDS.section]);

function validateStructure(shapes: Readonly<Record<ShapeId, Shape>>): void {
  for (const shape of Object.values(shapes)) {
    if (isRootId(shape.parent)) {
      if (shape.kind !== SHAPE_KINDS.page) {
        throw new DocumentError(
          "invalidShape",
          `root children must be pages, got kind: ${shape.kind} (${shape.id})`,
        );
      }
      continue;
    }
    const visited = new Set<ShapeId>([shape.id]);
    let cursor = shape.parent;
    while (!isRootId(cursor)) {
      if (visited.has(cursor)) {
        throw new DocumentError("parentCycle", `parent chain cycles at: ${cursor}`);
      }
      visited.add(cursor);
      const parent = shapes[cursor];
      if (parent === undefined) {
        throw new DocumentError("unknownParent", `unknown parent: ${cursor} (of ${shape.id})`);
      }
      cursor = parent.parent;
    }
  }
  for (const shape of Object.values(shapes)) {
    if (!isRootId(shape.parent) && !CONTAINER_KINDS.has(shapes[shape.parent]!.kind)) {
      throw new DocumentError(
        "invalidShape",
        `parent must be a page or section, got: ${shapes[shape.parent]!.kind} (${shape.id})`,
      );
    }
  }
}

export function createDocument(shapes: readonly Shape[] = []): Document {
  const shapesMap: Record<ShapeId, Shape> = {};
  for (const shape of shapes) {
    if (shapesMap[shape.id] !== undefined) {
      throw new DocumentError("duplicateShapeId", `duplicate shape id: ${shape.id}`);
    }
    shapesMap[shape.id] = shape;
  }
  validateStructure(shapesMap);
  return Object.freeze({
    schema: Object.freeze({ version: SCHEMA_VERSION }),
    shapes: Object.freeze(shapesMap),
  });
}
```

## `packages/document/src/validation.ts`

```ts
// Boundary parser: `unknown` in, typed `Document` out (R-006: parse, don't
// validate; R-014: internal code never revalidates). Hand-rolled on purpose —
// zero runtime dependencies in the document core; Zod is re-evaluated only
// when a real external boundary demands it.
import type { Box, DeviceClass, PlatformId, ShapeId, ShapeKind } from "@open-draw/contracts";
import {
  DEVICE_CLASS_BY_VALUE,
  DEVICE_CLASSES,
  PLATFORM_BY_VALUE,
  ROOT_ID,
  SHAPE_KIND_VALUES,
  isRootId,
  parseShapeId,
} from "@open-draw/contracts";
import type { Document } from "./document";
import { SCHEMA_VERSION, createDocument } from "./document";
import { DocumentError } from "./errors";
import type { SectionDirection, SemanticTag, Shape, ShapeMeta } from "./shape";
import { SECTION_DIRECTIONS } from "./shape";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseBox(value: unknown): Box {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y) ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height)
  ) {
    throw new DocumentError(
      "invalidShape",
      "box must be { x, y, width, height } with finite numbers",
    );
  }
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

function parseDeviceClass(value: unknown): DeviceClass {
  if (typeof value !== "string") {
    throw new DocumentError(
      "invalidMeta",
      `device class must be a string: ${JSON.stringify(value)}`,
    );
  }
  const deviceClass = DEVICE_CLASS_BY_VALUE[value];
  if (deviceClass === undefined) {
    throw new DocumentError("invalidMeta", `unknown device class: ${value}`);
  }
  return deviceClass;
}

function parseSemantic(value: unknown): SemanticTag {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.platform !== "string") {
    throw new DocumentError("invalidMeta", "semantic must be { id, platform } with strings");
  }
  const platform = PLATFORM_BY_VALUE[value.platform];
  if (platform === undefined) {
    throw new DocumentError("invalidMeta", `unknown platform: ${value.platform}`);
  }
  return { id: value.id, platform };
}

function parseMeta(value: unknown): ShapeMeta {
  if (!isRecord(value)) {
    throw new DocumentError("invalidMeta", "meta must be an object");
  }
  const order: Partial<Record<DeviceClass, number>> = {};
  if (value.order !== undefined) {
    if (!isRecord(value.order)) {
      throw new DocumentError("invalidMeta", "meta.order must be an object");
    }
    for (const [serialized, orderValue] of Object.entries(value.order)) {
      const deviceClass = parseDeviceClass(serialized);
      if (!isFiniteNumber(orderValue)) {
        throw new DocumentError("invalidMeta", `order for ${serialized} must be a number`);
      }
      order[deviceClass] = orderValue;
    }
  }
  let hiddenOn: readonly DeviceClass[] | undefined;
  if (value.hiddenOn !== undefined) {
    if (!Array.isArray(value.hiddenOn)) {
      throw new DocumentError("invalidMeta", "meta.hiddenOn must be an array");
    }
    hiddenOn = value.hiddenOn.map(parseDeviceClass);
  }
  const semantic = value.semantic === undefined ? undefined : parseSemantic(value.semantic);
  // Cast is safe here: every field was validated above; internal code trusts
  // the type from here on (R-006).
  return {
    ...(semantic === undefined ? {} : { semantic }),
    order,
    ...(hiddenOn === undefined ? {} : { hiddenOn }),
  };
}

function parseDirection(value: unknown): SectionDirection {
  if (
    typeof value !== "string" ||
    (value !== SECTION_DIRECTIONS.row && value !== SECTION_DIRECTIONS.column)
  ) {
    throw new DocumentError("invalidShape", "section direction must be row or column");
  }
  return value === SECTION_DIRECTIONS.row ? SECTION_DIRECTIONS.row : SECTION_DIRECTIONS.column;
}

function parseShape(value: unknown): Shape {
  if (!isRecord(value)) {
    throw new DocumentError("invalidShape", "a shape must be an object");
  }
  const id = parseShapeId(value.id);
  if (typeof value.kind !== "string" || !SHAPE_KIND_VALUES.has(value.kind)) {
    throw new DocumentError("invalidShape", `unknown kind on shape: ${String(value.kind)}`);
  }
  const kind = value.kind as ShapeKind;
  if (value.parent === undefined) {
    throw new DocumentError("invalidShape", "parent must be present (virtual root, no nulls)");
  }
  const parent: ShapeId = value.parent === ROOT_ID ? ROOT_ID : parseShapeId(value.parent);
  const box = parseBox(value.box);
  if (value.label !== undefined && typeof value.label !== "string") {
    throw new DocumentError("invalidShape", "label must be a string when present");
  }
  const meta = parseMeta(value.meta);
  const base = {
    id,
    kind,
    parent,
    box,
    ...(value.label === undefined ? {} : { label: value.label }),
    meta,
  };
  // Validated cast at the boundary: kind membership was checked above and the
  // kind-specific fields are checked right here.
  if (kind === "section") {
    return { ...base, kind, direction: parseDirection(value.direction) } as Shape;
  }
  return base as Shape;
}

export function parseDocument(input: unknown): Document {
  if (!isRecord(input)) {
    throw new DocumentError("invalidDocument", "a document must be an object");
  }
  if (!isRecord(input.schema) || input.schema.version !== SCHEMA_VERSION) {
    throw new DocumentError("invalidSchema", `expected schema version ${SCHEMA_VERSION}`);
  }
  if (!isRecord(input.shapes)) {
    throw new DocumentError("invalidDocument", "shapes must be a record keyed by shape id");
  }
  const shapes: Shape[] = [];
  for (const [key, entry] of Object.entries(input.shapes)) {
    const shape = parseShape(entry);
    if (shape.id !== key) {
      throw new DocumentError("invalidShape", `record key must match shape id: ${key}`);
    }
    if (!isRootId(shape.parent) && shape.parent === ROOT_ID) {
      throw new DocumentError("unknownParent", `invalid parent on shape: ${shape.id}`);
    }
    shapes.push(shape);
  }
  return createDocument(shapes);
}
```

## `packages/document/src/tree.ts`

```ts
// Derived tree operations (ADR-0002 D1: the tree is never stored twice) —
// small pure functions over the flat map (R-008).
import type { Box, ShapeId } from "@open-draw/contracts";
import { ROOT_ID } from "@open-draw/contracts";
import type { Document } from "./document";
import { DocumentError } from "./errors";
import type { Shape } from "./shape";

// Sibling order: map insertion order by default; meta.order overrides per
// device class (the derive pipeline consumes both — ADR-0002 D6).
export function childrenOf(document: Document, parent: ShapeId): readonly Shape[] {
  return Object.values(document.shapes).filter((shape) => shape.parent === parent);
}

// The shape and all its descendants, parent-first (breadth-first).
export function subtreeOf(document: Document, id: ShapeId): readonly Shape[] {
  const root = document.shapes[id];
  if (root === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${id}`);
  }
  const result: Shape[] = [root];
  const queue: Shape[] = [root];
  while (queue.length > 0) {
    const shape = queue.shift()!;
    for (const child of childrenOf(document, shape.id)) {
      result.push(child);
      queue.push(child);
    }
  }
  return result;
}

// Ancestors from the immediate parent up to the root (exclusive).
export function ancestorsOf(document: Document, shape: Shape): readonly Shape[] {
  const result: Shape[] = [];
  let cursor = shape.parent;
  while (cursor !== ROOT_ID) {
    const parent = document.shapes[cursor];
    if (parent === undefined) {
      throw new DocumentError("unknownParent", `broken parent chain at: ${cursor}`);
    }
    result.push(parent);
    cursor = parent.parent;
  }
  return result;
}

// Absolute page-space box, derived by walking parent-local boxes (D4).
export function absoluteBox(document: Document, shape: Shape): Box {
  let x = shape.box.x;
  let y = shape.box.y;
  for (const ancestor of ancestorsOf(document, shape)) {
    x += ancestor.box.x;
    y += ancestor.box.y;
  }
  return { x, y, width: shape.box.width, height: shape.box.height };
}

// Depth-first pre-order walk: pages in map order, then each subtree.
export function shapeListInOrder(document: Document): readonly Shape[] {
  const result: Shape[] = [];
  const walk = (parent: ShapeId): void => {
    for (const child of childrenOf(document, parent)) {
      result.push(child);
      walk(child.id);
    }
  };
  walk(ROOT_ID);
  return result;
}
```

## `packages/document/src/display-name.ts`

```ts
// Derived display names (ADR-0002 D5): labels describe for humans, ids
// identify for machines; the display name is never stored.
import { SHAPE_KIND_LABELS } from "@open-draw/contracts";
import type { Shape } from "./shape";

export function getDisplayName(shape: Shape): string {
  if (shape.label !== undefined && shape.label !== "") {
    return shape.label;
  }
  return SHAPE_KIND_LABELS[shape.kind];
}
```

## `packages/document/src/commands/registry.ts`

```ts
// Closed registry of named commands (R-011/R-012, ADR-0002 D8). Members live
// in uniform folders next to this file; this file is the registry index.
export const COMMANDS = {
  createShape: "CreateShape",
  deleteShape: "DeleteShape",
  setShapeLabel: "SetShapeLabel",
  reparentShape: "ReparentShape",
} as const;

export type CommandId = (typeof COMMANDS)[keyof typeof COMMANDS];
```

## `packages/document/src/commands/create-shape/index.ts`

```ts
// CreateShape: inserts a fully-formed shape (ADR-0002 D8). The inverse of a
// create is a delete of the created id.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface CreateShape {
  readonly type: (typeof COMMANDS)["createShape"];
  readonly shape: Shape;
}

export function applyCreateShape(document: Document, command: CreateShape): CommandResult {
  const { shape } = command;
  if (document.shapes[shape.id] !== undefined) {
    throw new DocumentError("duplicateShapeId", `shape already exists: ${shape.id}`);
  }
  const next = createDocument([...Object.values(document.shapes), shape]);
  const inverse: readonly Command[] = [{ type: COMMANDS.deleteShape, id: shape.id as ShapeId }];
  return { document: next, inverse };
}
```

## `packages/document/src/commands/delete-shape/index.ts`

```ts
// DeleteShape: removes a shape and its whole subtree; the inverse recreates
// the subtree parent-first, so undo restores it in one batch (ADR-0002 D8).
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import { subtreeOf } from "../../tree";
import type { CreateShape } from "../create-shape";
import { COMMANDS } from "../registry";

export interface DeleteShape {
  readonly type: (typeof COMMANDS)["deleteShape"];
  readonly id: ShapeId;
}

export function applyDeleteShape(document: Document, command: DeleteShape): CommandResult {
  const subtree = subtreeOf(document, command.id);
  const removed = new Set(subtree.map((shape) => shape.id));
  const next = createDocument(
    Object.values(document.shapes).filter((shape) => !removed.has(shape.id)),
  );
  const inverse: readonly Command[] = subtree.map((shape): CreateShape => ({
    type: COMMANDS.createShape,
    shape,
  }));
  return { document: next, inverse };
}
```

## `packages/document/src/commands/set-shape-label/index.ts`

```ts
// SetShapeLabel: sets or clears (null) the only human-authored stored field
// (ADR-0002 D5). Inverse restores the previous label.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeLabel {
  readonly type: (typeof COMMANDS)["setShapeLabel"];
  readonly id: ShapeId;
  readonly label: string | null;
}

function withoutLabel(shape: Shape): Shape {
  const { label: _previous, ...rest } = shape;
  return rest as Shape;
}

export function applySetShapeLabel(document: Document, command: SetShapeLabel): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousLabel = shape.label === undefined ? null : shape.label;
  const nextShape =
    command.label === null ? withoutLabel(shape) : ({ ...shape, label: command.label } as Shape);
  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setShapeLabel, id: command.id, label: previousLabel },
  ];
  return { document: next, inverse };
}
```

## `packages/document/src/commands/reparent-shape/index.ts`

```ts
// ReparentShape: moves a shape under a new parent; the caller supplies the
// new parent-local box (ADR-0002 D4/D8). The inverse restores the old parent
// and box. Cycles are rejected by createDocument's structural validation.
import type { Box, ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import { COMMANDS } from "../registry";

export interface ReparentShape {
  readonly type: (typeof COMMANDS)["reparentShape"];
  readonly id: ShapeId;
  readonly parent: ShapeId;
  readonly box: Box;
}

export function applyReparentShape(document: Document, command: ReparentShape): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousParent = shape.parent;
  const previousBox = shape.box;
  const moved = { ...shape, parent: command.parent, box: command.box };
  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, moved]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.reparentShape, id: command.id, parent: previousParent, box: previousBox },
  ];
  return { document: next, inverse };
}
```

## `packages/document/src/commands/index.ts`

```ts
// Command registry index (uniform registry-folder layout, R-011/R-012).
import type { Document } from "../document";
import type { CreateShape } from "./create-shape";
import type { DeleteShape } from "./delete-shape";
import type { ReparentShape } from "./reparent-shape";
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

export type Command = CreateShape | DeleteShape | SetShapeLabel | ReparentShape;

export interface CommandResult {
  readonly document: Document;
  readonly inverse: readonly Command[];
}
```

## `packages/document/src/transactions.ts`

```ts
// Transactions (R-018, ADR-0002 D8): one gesture = one batch = one event.
// Applying a transaction returns the inverse batch; history is an inverse
// stack (see history.ts). No snapshots: undo is O(batch).
import { COMMANDS } from "./commands";
import type { Command, CommandResult } from "./commands";
import { applyCreateShape } from "./commands/create-shape";
import { applyDeleteShape } from "./commands/delete-shape";
import { applyReparentShape } from "./commands/reparent-shape";
import { applySetShapeLabel } from "./commands/set-shape-label";
import type { Document } from "./document";
import { DocumentError } from "./errors";

export interface Transaction {
  readonly commands: readonly Command[];
}

export function createTransaction(commands: readonly Command[]): Transaction {
  if (commands.length === 0) {
    throw new DocumentError("invalidCommand", "a transaction requires at least one command");
  }
  return Object.freeze({ commands });
}

export interface TransactionResult {
  readonly document: Document;
  readonly inverse: readonly Command[];
}

function applyCommand(document: Document, command: Command): CommandResult {
  switch (command.type) {
    case COMMANDS.createShape:
      return applyCreateShape(document, command);
    case COMMANDS.deleteShape:
      return applyDeleteShape(document, command);
    case COMMANDS.setShapeLabel:
      return applySetShapeLabel(document, command);
    case COMMANDS.reparentShape:
      return applyReparentShape(document, command);
  }
}

export function applyTransaction(document: Document, transaction: Transaction): TransactionResult {
  let current = document;
  const inverse: Command[] = [];
  for (const command of transaction.commands) {
    const result = applyCommand(current, command);
    current = result.document;
    inverse.push(...result.inverse);
  }
  // Undo runs the inverses back-to-front.
  return { document: current, inverse: inverse.reverse() };
}
```

## `packages/document/src/history.ts`

```ts
// History as an inverse stack (R-018, ADR-0002 D8): push the inverse batch
// after every transaction; undo applies it, redo applies the undo's inverse.
// Pure data in, pure data out (R-008).
import type { Command } from "./commands";
import type { Document } from "./document";
import { applyTransaction, createTransaction } from "./transactions";
import type { Transaction } from "./transactions";

export interface HistoryState {
  readonly undoStack: readonly Transaction[];
  readonly redoStack: readonly Transaction[];
}

export const EMPTY_HISTORY: HistoryState = { undoStack: [], redoStack: [] };

export interface UndoRedoResult {
  readonly document: Document;
  readonly history: HistoryState;
}

export function recordHistory(state: HistoryState, inverse: readonly Command[]): HistoryState {
  return {
    undoStack: [...state.undoStack, createTransaction(inverse)],
    redoStack: [],
  };
}

export function undo(document: Document, history: HistoryState): UndoRedoResult | null {
  const latest = history.undoStack[history.undoStack.length - 1];
  if (latest === undefined) {
    return null;
  }
  const result = applyTransaction(document, latest);
  return {
    document: result.document,
    history: {
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, createTransaction(result.inverse)],
    },
  };
}

export function redo(document: Document, history: HistoryState): UndoRedoResult | null {
  const latest = history.redoStack[history.redoStack.length - 1];
  if (latest === undefined) {
    return null;
  }
  const result = applyTransaction(document, latest);
  return {
    document: result.document,
    history: {
      undoStack: [...history.undoStack, createTransaction(result.inverse)],
      redoStack: history.redoStack.slice(0, -1),
    },
  };
}
```

## `packages/document/src/index.ts` (replaces placeholder)

```ts
// @open-draw/document — canonical document model (ADR-0002): flat normalized
// map, derived tree, validating constructors, typed transactions, inverse
// history. Pure data + pure functions only (R-008); zero runtime deps.
export * from "./display-name";
export * from "./document";
export * from "./errors";
export * from "./tree";
export * from "./shape";
export * from "./validation";
export * from "./commands";
export * from "./transactions";
export * from "./history";
```

---

## Tests (RED-first companions — add alongside the code)

## `packages/document/src/validation.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { ROOT_ID } from "@open-draw/contracts";
import type { Shape } from "./shape";
import { createPage, createRect, createSection } from "./shape";
import { DocumentError } from "./errors";
import { parseDocument } from "./validation";

function serialize(shapes: readonly Shape[]): unknown {
  return {
    schema: { version: 1 },
    shapes: Object.fromEntries(shapes.map((shape) => [shape.id, shape])),
  };
}

const page = createPage("page-1", { x: 0, y: 0, width: 1440, height: 900 });
const section = createSection("section-1", { x: 0, y: 0, width: 1400, height: 120 }, "row", {
  parent: "page-1",
});
const rect = createRect(
  "rect-1",
  { x: 10, y: 10, width: 200, height: 80 },
  {
    parent: "section-1",
    label: "Hero",
  },
);

describe("parseDocument", () => {
  it("parses a valid document and preserves shape data", () => {
    const document = parseDocument(serialize([page, section, rect]));
    expect(document.schema.version).toBe(1);
    expect(document.shapes["rect-1"]?.label).toBe("Hero");
    expect(document.shapes["rect-1"]?.parent).toBe("section-1");
  });

  it("rejects a schema with the wrong version", () => {
    const input = serialize([page]) as { schema: { version: number } };
    input.schema.version = 2;
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects an unknown kind", () => {
    const input = serialize([page]) as { shapes: Record<string, Record<string, unknown>> };
    input.shapes["page-1"]!.kind = "pentagon";
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects a record key that does not match the shape id", () => {
    const input = serialize([page]) as { shapes: Record<string, Record<string, unknown>> };
    input.shapes["wrong-key"] = input.shapes["page-1"]!;
    delete input.shapes["page-1"];
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects a parent chain that cycles", () => {
    const input = serialize([page, section]) as { shapes: Record<string, Record<string, unknown>> };
    input.shapes["page-1"]!.parent = "section-1";
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });

  it("rejects a non-container parent", () => {
    const nested = createRect(
      "rect-2",
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: "rect-1",
      },
    );
    expect(() => parseDocument(serialize([page, section, rect, nested]))).toThrow(DocumentError);
  });

  it("rejects a root child that is not a page", () => {
    const stray = createRect(
      "stray-1",
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: ROOT_ID,
      },
    );
    expect(() => parseDocument(serialize([stray]))).toThrow(DocumentError);
  });

  it("rejects an invalid device class in meta", () => {
    const input = serialize([rect]) as { shapes: Record<string, Record<string, unknown>> };
    input.shapes["rect-1"]!.meta = { order: { phablet: 1 } };
    expect(() => parseDocument(serialize([page, section, rect]))).not.toThrow();
    expect(() => parseDocument(input)).toThrow(DocumentError);
  });
});
```

## `packages/document/src/transactions.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { EMPTY_HISTORY, redo, recordHistory, undo } from "./history";
import { DocumentError } from "./errors";
import { createPage, createRect, createSection } from "./shape";
import { COMMANDS } from "./commands";
import { applyTransaction, createTransaction } from "./transactions";
import { createDocument } from "./document";
import type { Document } from "./document";
import type { Shape } from "./shape";

const empty = createDocument();
const page = createPage("page-1", { x: 0, y: 0, width: 1440, height: 900 });

function withShapes(shapes: readonly Shape[]): Document {
  return createDocument(shapes);
}

describe("applyTransaction", () => {
  it("creates a shape and reports a delete as its inverse", () => {
    const create = createTransaction([{ type: COMMANDS.createShape, shape: page }]);
    const result = applyTransaction(empty, create);
    expect(result.document.shapes["page-1"]?.kind).toBe("page");
    expect(result.inverse).toEqual([{ type: COMMANDS.deleteShape, id: "page-1" }]);
  });

  it("rejects an empty transaction", () => {
    expect(() => createTransaction([])).toThrow(DocumentError);
  });

  it("rejects creating a duplicate id", () => {
    const once = applyTransaction(
      empty,
      createTransaction([{ type: COMMANDS.createShape, shape: page }]),
    );
    expect(() =>
      applyTransaction(
        once.document,
        createTransaction([{ type: COMMANDS.createShape, shape: page }]),
      ),
    ).toThrow(DocumentError);
  });

  it("deletes a subtree and recreates it on undo", () => {
    const section = createSection("section-1", { x: 0, y: 0, width: 1400, height: 120 }, "column", {
      parent: "page-1",
    });
    const rect = createRect(
      "rect-1",
      { x: 0, y: 0, width: 100, height: 50 },
      {
        parent: "section-1",
        label: "Button",
      },
    );
    const built = withShapes([page, section, rect]);

    const removed = applyTransaction(
      built,
      createTransaction([{ type: COMMANDS.deleteShape, id: "section-1" }]),
    );
    expect(removed.document.shapes["section-1"]).toBeUndefined();
    expect(removed.document.shapes["rect-1"]).toBeUndefined();

    let history = recordHistory(EMPTY_HISTORY, removed.inverse);
    const undone = undo(removed.document, history);
    expect(undone?.document.shapes["rect-1"]?.label).toBe("Button");
    expect(undone?.document.shapes["rect-1"]?.parent).toBe("section-1");

    history = undone!.history;
    const redone = redo(undone!.document, history);
    expect(redone?.document.shapes["rect-1"]).toBeUndefined();
  });

  it("restores the previous label through set/clear/undo", () => {
    const labeled = createRect("rect-1", { x: 0, y: 0, width: 10, height: 10 }, { label: "Old" });
    const section = createSection("section-1", { x: 0, y: 0, width: 100, height: 100 }, "row");
    const built = withShapes([page, section, labeled]);

    const renamed = applyTransaction(
      built,
      createTransaction([{ type: COMMANDS.setShapeLabel, id: "rect-1", label: "New" }]),
    );
    expect(renamed.document.shapes["rect-1"]?.label).toBe("New");

    const undone = undo(renamed.document, recordHistory(EMPTY_HISTORY, renamed.inverse));
    expect(undone?.document.shapes["rect-1"]?.label).toBe("Old");
  });

  it("rejects a reparent that would create a cycle", () => {
    const section = createSection("section-1", { x: 0, y: 0, width: 100, height: 100 }, "row");
    const built = withShapes([page, section]);
    expect(() =>
      applyTransaction(
        built,
        createTransaction([
          { type: COMMANDS.reparentShape, id: "page-1", parent: "section-1", box: page.box },
        ]),
      ),
    ).toThrow(DocumentError);
  });
});
```

---

## Build steps (Chandra executes)

```bash
git checkout main && git pull
git checkout -b feat/document-core
# ... paste the files above ...
pnpm install                 # link the new @open-draw/contracts workspace dep
pnpm check                   # format + lint + typecheck + test + build — must be green
```

Commits (conventional vocabulary, squash-friendly):

1. `feat: add contracts registries and branded ids`
2. `feat: implement document model core per ADR-0002`

PR title: `feat: implement document model core (ADR-0002 D1–D9)`
PR body line (quote-your-rule gate): `Implements ADR-0002 D1–D9; rules quoted: R-005, R-006, R-008, R-011, R-012, R-016, R-017, R-018, R-024, R-025, R-026, R-028.`

After squash-merge: delete the branch (standing hygiene rule).
