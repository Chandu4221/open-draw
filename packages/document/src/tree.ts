// Derived tree operations (ADR-0002 D1: the tree is never stored twice) —
// small pure functions over the flat map (R-008).
import type { BoundingBox, ShapeId } from "@open-draw/contracts";
import { ROOT_ID } from "@open-draw/contracts";
import type { Document } from "./document";
import { DocumentError } from "./errors";
import type { Shape } from "./shape";

export type ChildIndex = ReadonlyMap<ShapeId, readonly Shape[]>;

export function buildChildIndex(document: Document): ChildIndex {
  const index = new Map<ShapeId, Shape[]>();
  for (const shape of Object.values(document.shapes)) {
    const list = index.get(shape.parentId);
    if (list === undefined) {
      index.set(shape.parentId, [shape]);
    } else {
      list.push(shape);
    }
  }
  return index;
}

// Sibling order: map insertion order by default; meta.order overrides per
// device type (the derive pipeline consumes both — ADR-0002 D6).
export function childrenOf(
  document: Document,
  parent: ShapeId,
  childIndex?: ChildIndex,
): readonly Shape[] {
  if (childIndex !== undefined) {
    return childIndex.get(parent) ?? [];
  }
  return Object.values(document.shapes).filter((shape) => shape.parentId === parent);
}

// The shape and all its descendants, parent-first (breadth-first).
export function subtreeOf(
  document: Document,
  id: ShapeId,
  childIndex?: ChildIndex,
): readonly Shape[] {
  const root = document.shapes[id];
  if (root === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${id}`);
  }
  const index = childIndex ?? buildChildIndex(document);
  const result: Shape[] = [root];
  let cursor = 0;
  while (cursor < result.length) {
    const shape = result[cursor]!;
    cursor += 1;
    const children = index.get(shape.id);
    if (children !== undefined) {
      for (const child of children) {
        result.push(child);
      }
    }
  }
  return result;
}

// Ancestors from the immediate parent up to the root (exclusive).
export function ancestorsOf(document: Document, shape: Shape): readonly Shape[] {
  const result: Shape[] = [];
  let cursor = shape.parentId;
  while (cursor !== ROOT_ID) {
    const parent = document.shapes[cursor];
    if (parent === undefined) {
      throw new DocumentError("unknownParent", `broken parent chain at: ${cursor}`);
    }
    result.push(parent);
    cursor = parent.parentId;
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
export function shapeListInOrder(document: Document, childIndex?: ChildIndex): readonly Shape[] {
  const index = childIndex ?? buildChildIndex(document);
  const result: Shape[] = [];
  const walk = (parent: ShapeId): void => {
    const children = index.get(parent);
    if (children !== undefined) {
      for (const child of children) {
        result.push(child);
        walk(child.id);
      }
    }
  };
  walk(ROOT_ID);
  return result;
}
