// Pure reparenting helpers for N-level deep canvas hierarchies (R-008, R-016, R-026).
// Handles container drop-target picking, coordinate-space conversion,
// cycle prevention, and multi-selection pruning.
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { isRootId, ROOT_ID, SHAPE_KINDS } from "@open-draw/contracts";
import type { Document } from "./document";
import { DocumentError } from "./errors";
import type { Shape } from "./shape";
import { absoluteBoundingBox, ancestorsOf, childrenOf, shapeListInOrder, subtreeOf } from "./tree";

/**
 * Tests whether a world-space point is inside a world-space bounding box.
 */
export function pointInBox(box: BoundingBox, point: Point): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}

const LEAF_SEMANTICS: ReadonlySet<string> = new Set([
  "button",
  "input",
  "checkbox",
  "radio",
  "switch",
  "slider",
]);

function isInsidePlatformRoot(shape: Shape, doc?: Document): boolean {
  if (shape.kind === SHAPE_KINDS.page || shape.meta.platform !== undefined) return true;
  if (doc === undefined) return false;
  let current = shape;
  while (!isRootId(current.parentId)) {
    const parent = doc.shapes[current.parentId];
    if (parent === undefined) break;
    if (parent.kind === SHAPE_KINDS.page || parent.meta.platform !== undefined) return true;
    current = parent;
  }
  return false;
}

/**
 * Checks whether a shape qualifies as a drop-target container.
 * Open strokes (lines, pen paths), leaf text shapes, and atomic interactive
 * controls (buttons, inputs) cannot be containers unless they already hold children.
 * On a platform-agnostic canvas (R-024, R-026), plain rectangles are geometric shapes,
 * not containers. Inside a platform root or with platform semantics, rectangles act
 * as UI containers (R-004, R-026).
 */
export function isContainerShape(shape: Shape, doc?: Document): boolean {
  if (
    shape.kind === SHAPE_KINDS.line ||
    shape.kind === SHAPE_KINDS.penPath ||
    shape.kind === SHAPE_KINDS.text
  ) {
    return false;
  }
  if (shape.meta.semantic !== undefined) {
    if (LEAF_SEMANTICS.has(shape.meta.semantic.id)) {
      return doc !== undefined && childrenOf(doc, shape.id).length > 0;
    }
    return true;
  }
  if (shape.kind === SHAPE_KINDS.page || shape.kind === SHAPE_KINDS.section) {
    return true;
  }
  if (shape.meta.platform !== undefined) {
    return true;
  }
  if (doc !== undefined && childrenOf(doc, shape.id).length > 0) {
    return true;
  }
  if (shape.kind === SHAPE_KINDS.rect) {
    return isInsidePlatformRoot(shape, doc);
  }
  return false;
}

/**
 * Purely picks the deepest valid container under a world-space drop point.
 * Excludes the dragged shapes and all their descendants to prevent cycles.
 * Returns ROOT_ID if no container contains the point.
 */
export function pickDropTarget(
  doc: Document,
  worldPoint: Point,
  excludedIds: readonly ShapeId[] = [],
): ShapeId {
  const fullExcluded = new Set<ShapeId>();
  for (const id of excludedIds) {
    fullExcluded.add(id);
    if (doc.shapes[id] !== undefined) {
      for (const descendant of subtreeOf(doc, id)) {
        fullExcluded.add(descendant.id);
      }
    }
  }

  const ordered = shapeListInOrder(doc);
  // Iterate in reverse pre-order walk so the deepest/topmost children are checked first
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const candidate = ordered[index]!;
    if (fullExcluded.has(candidate.id)) {
      continue;
    }
    if (!isContainerShape(candidate, doc)) {
      continue;
    }
    const box = absoluteBoundingBox(doc, candidate);
    if (pointInBox(box, worldPoint)) {
      return candidate.id;
    }
  }

  return ROOT_ID;
}

/**
 * Converts a shape's world-space bounding box to the local coordinate system
 * of a target parent shape (or leaves it as world coordinates if parenting to ROOT_ID).
 */
export function computeReparentBoundingBox(
  doc: Document,
  shape: Shape,
  newParentId: ShapeId,
  currentWorldBox: BoundingBox,
): BoundingBox {
  if (isRootId(newParentId)) {
    return {
      x: currentWorldBox.x,
      y: currentWorldBox.y,
      width: currentWorldBox.width,
      height: currentWorldBox.height,
    };
  }
  const parentShape = doc.shapes[newParentId];
  if (parentShape === undefined) {
    throw new DocumentError(
      "unknownParent",
      `cannot reparent ${shape.id} to nonexistent shape: ${newParentId}`,
    );
  }
  const parentWorldBox = absoluteBoundingBox(doc, parentShape);
  return {
    x: currentWorldBox.x - parentWorldBox.x,
    y: currentWorldBox.y - parentWorldBox.y,
    width: currentWorldBox.width,
    height: currentWorldBox.height,
  };
}

/**
 * Filters a list of selected shapes so that if both an ancestor and a descendant
 * are selected, only the ancestor is returned. Descendants travel with their ancestor.
 */
export function pruneSelectedDescendants(
  doc: Document,
  selectedIds: readonly ShapeId[],
): readonly ShapeId[] {
  const selectedSet = new Set<ShapeId>(selectedIds);
  return selectedIds.filter((id) => {
    const shape = doc.shapes[id];
    if (shape === undefined) {
      return false;
    }
    for (const ancestor of ancestorsOf(doc, shape)) {
      if (selectedSet.has(ancestor.id)) {
        return false;
      }
    }
    return true;
  });
}
