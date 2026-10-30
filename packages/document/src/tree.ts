// Derived tree operations (ADR-0002 D1: the tree is never stored twice) —
// small pure functions over the flat map (R-008).
import type { BoundingBox, ShapeId } from "@open-draw/contracts";
import { ROOT_ID } from "@open-draw/contracts";
import type { Document } from "./document";
import { DocumentError } from "./errors";
import type { Shape } from "./shape";

// Sibling order: map insertion order by default; meta.order overrides per
// device type (the derive pipeline consumes both — ADR-0002 D6).
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

// Absolute page-space bounding box, derived by walking parent-local
// bounding boxes (ADR-0002 D4).
export function absoluteBoundingBox(document: Document, shape: Shape): BoundingBox {
  let x = shape.boundingBox.x;
  let y = shape.boundingBox.y;
  for (const ancestor of ancestorsOf(document, shape)) {
    x += ancestor.boundingBox.x;
    y += ancestor.boundingBox.y;
  }
  return { x, y, width: shape.boundingBox.width, height: shape.boundingBox.height };
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
