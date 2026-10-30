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
