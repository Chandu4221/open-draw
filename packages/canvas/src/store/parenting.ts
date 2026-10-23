import { CycleDetectedError, type ShapeId, type ShapeRecord } from '@open-draw/schema';
import type { CanvasStore } from './store.js';

/**
 * Validates that setting `targetParentId` as parent of `shapeId` does not create a hierarchy cycle.
 * Throws CycleDetectedError if targetParentId is shapeId or a descendant of shapeId.
 */
export function validateParenting(
  store: CanvasStore,
  shapeId: ShapeId,
  targetParentId: ShapeId | null
): void {
  if (!targetParentId) return;

  if (shapeId === targetParentId) {
    throw new CycleDetectedError(shapeId, targetParentId);
  }

  let currId: string | undefined = targetParentId;
  const visited = new Set<string>();

  while (currId) {
    if (currId === shapeId) {
      throw new CycleDetectedError(shapeId, targetParentId);
    }
    if (visited.has(currId)) break;
    visited.add(currId);

    const currShape = store.getShape(currId);
    currId = (currShape?.meta?.parent ?? currShape?.meta?.parentId) as string | undefined;
  }
}

/**
 * Sets parent of a shape with mandatory cycle validation in a single store transaction.
 */
export function setShapeParent(
  store: CanvasStore,
  shapeId: ShapeId,
  parentId: ShapeId | null
): void {
  const shape = store.getShape(shapeId);
  if (!shape) return;

  validateParenting(store, shapeId, parentId);

  store.updateShape(shapeId, {
    meta: {
      ...shape.meta,
      parent: parentId ?? undefined,
      parentId: undefined,
    },
  });
}

/**
 * Returns all direct children of a parent shape.
 */
export function findChildren(
  store: CanvasStore,
  parentId: ShapeId
): ShapeRecord[] {
  return store
    .listShapes()
    .filter(
      (s) => s.meta.parent === parentId || s.meta.parentId === parentId
    );
}

/**
 * Ungroups a group shape per ADR-003 amendment:
 * - Reparents all direct members to the group's own parent.
 * - Deletes the group shell.
 * - Committed in a single atomic transaction.
 */
export function ungroup(store: CanvasStore, groupId: ShapeId): void {
  const group = store.getShape(groupId);
  if (!group || group.type !== 'group') return;

  const groupParentId = (group.meta.parent ?? group.meta.parentId) as ShapeId | undefined ?? null;
  const members = findChildren(store, groupId);

  store.transact(() => {
    for (const member of members) {
      setShapeParent(store, member.id, groupParentId);
    }
    store.deleteShape(groupId);
  });
}

/**
 * Deletes a shape, cascading to all members if the shape is a group.
 */
export function deleteShapeWithCascade(
  store: CanvasStore,
  shapeId: ShapeId
): boolean {
  const shape = store.getShape(shapeId);
  if (!shape) return false;

  const children = findChildren(store, shapeId);
  if (children.length > 0) {
    let result = false;
    store.transact(() => {
      const descendants: ShapeId[] = [];
      const queue: ShapeId[] = [...children.map((c) => c.id)];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        descendants.push(curr);
        const subChildren = findChildren(store, curr);
        for (const child of subChildren) {
          queue.push(child.id);
        }
      }

      for (const descId of descendants) {
        store.deleteShape(descId);
      }
      result = store.deleteShape(shapeId);
    });
    return result;
  }

  return store.deleteShape(shapeId);
}
