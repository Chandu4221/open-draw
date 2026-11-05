// The Document value and its validating constructor (ADR-0002 D1–D2). The tree
// is derived, never stored twice; `createDocument` is the single place where
// the structural invariants (parent chains, cycle check, container rules) are
// enforced, so every document — parsed or built by commands — is valid.
import type { ShapeId } from "@open-draw/contracts";
import { MAX_DOCUMENT_DEPTH, SHAPE_KINDS, isRootId } from "@open-draw/contracts";
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

export const CONTAINER_KINDS: ReadonlySet<string> = new Set([
  SHAPE_KINDS.page,
  SHAPE_KINDS.section,
  SHAPE_KINDS.rect,
]);

function validateStructure(shapes: Readonly<Record<ShapeId, Shape>>): void {
  for (const shape of Object.values(shapes)) {
    if (isRootId(shape.parentId)) {
      continue;
    }
    const visited = new Set<ShapeId>([shape.id]);
    let cursor = shape.parentId;
    let depth = 1;
    while (!isRootId(cursor)) {
      depth++;
      if (depth > MAX_DOCUMENT_DEPTH) {
        throw new DocumentError(
          "documentDepthExceeded",
          `document depth exceeds maximum of ${MAX_DOCUMENT_DEPTH}`,
        );
      }
      if (visited.has(cursor)) {
        throw new DocumentError("parentCycle", `parent chain cycles at: ${cursor}`);
      }
      visited.add(cursor);
      const parent = shapes[cursor];
      if (parent === undefined) {
        throw new DocumentError("unknownParent", `unknown parent: ${cursor} (of ${shape.id})`);
      }
      cursor = parent.parentId;
    }
  }
  for (const shape of Object.values(shapes)) {
    if (!isRootId(shape.parentId)) {
      const parentShape = shapes[shape.parentId];
      const isValidContainer =
        parentShape !== undefined &&
        (CONTAINER_KINDS.has(parentShape.kind) || isRootId(parentShape.parentId));
      if (!isValidContainer) {
        throw new DocumentError(
          "invalidShape",
          `parent must be a root shape, page, section, or rect, got: ${parentShape?.kind} (${shape.id})`,
        );
      }
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
