// DuplicateShapes: clones shapes and their subtrees with an offset (F5, ADR-0006 Option A).
// Parent-child links are remapped to new cloned IDs. One gesture = one transaction (R-018).
// Platform and style are preserved on root shapes (R-026).
import type { ShapeId } from "@open-draw/contracts";
import { parseShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import { pruneSelectedDescendants } from "../../reparent";
import type { Shape } from "../../shape";
import { subtreeOf } from "../../tree";
import { COMMANDS } from "../registry";

export interface DuplicateShapes {
  readonly type: (typeof COMMANDS)["duplicateShapes"];
  readonly ids: readonly ShapeId[];
  readonly dx?: number;
  readonly dy?: number;
  readonly newShapeIds?: Readonly<Record<ShapeId, ShapeId>>;
}

function deriveDeterministicId(
  document: Document,
  usedIds: ReadonlySet<ShapeId>,
  originalId: ShapeId,
): ShapeId {
  let counter = 1;
  while (true) {
    const candidate = parseShapeId(
      counter === 1 ? `${originalId}-copy` : `${originalId}-copy-${counter}`,
    );
    if (document.shapes[candidate] === undefined && !usedIds.has(candidate)) {
      return candidate;
    }
    counter += 1;
  }
}

export function applyDuplicateShapes(document: Document, command: DuplicateShapes): CommandResult {
  for (const id of command.ids) {
    if (document.shapes[id] === undefined) {
      throw new DocumentError("shapeNotFound", `no shape with id: ${id}`);
    }
  }

  const topLevelIds = pruneSelectedDescendants(document, command.ids);
  if (topLevelIds.length === 0) {
    return { document, inverse: [] };
  }

  const dx = command.dx ?? 20;
  const dy = command.dy ?? 20;

  // Collect all shapes across subtrees of top-level roots in pre-order
  const shapesToClone: Shape[] = [];
  const topLevelSet = new Set<ShapeId>(topLevelIds);
  for (const topId of topLevelIds) {
    shapesToClone.push(...subtreeOf(document, topId));
  }

  // Assign fresh unique IDs
  const idMap = new Map<ShapeId, ShapeId>();
  const usedIds = new Set<ShapeId>();
  for (const shape of shapesToClone) {
    const mapped = command.newShapeIds?.[shape.id];
    const newId = mapped ?? deriveDeterministicId(document, usedIds, shape.id);
    idMap.set(shape.id, newId);
    usedIds.add(newId);
  }

  // Clone shapes: remap parent pointers and offset top-level bounding boxes
  const clonedShapes: Shape[] = shapesToClone.map((shape): Shape => {
    const isTopLevel = topLevelSet.has(shape.id);
    const newId = idMap.get(shape.id)!;
    const newParent = isTopLevel ? shape.parent : (idMap.get(shape.parent) ?? shape.parent);
    const newBoundingBox = isTopLevel
      ? {
          ...shape.boundingBox,
          x: shape.boundingBox.x + dx,
          y: shape.boundingBox.y + dy,
        }
      : shape.boundingBox;

    return {
      ...shape,
      id: newId,
      parent: newParent,
      boundingBox: newBoundingBox,
    };
  });

  const next = createDocument([...Object.values(document.shapes), ...clonedShapes]);
  const inverse: readonly Command[] = topLevelIds.map((oldId) => ({
    type: COMMANDS.deleteShape,
    id: idMap.get(oldId)!,
  }));

  return { document: next, inverse };
}
