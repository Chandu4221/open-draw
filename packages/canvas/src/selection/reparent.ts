import type { ShapeId, ShapeRecord } from '@open-draw/schema';
import type { ShapeRegistry } from '../registry.js';
import type { CanvasStore } from '../store/index.js';
import type { CameraController } from '../camera.js';
import { findSuggestedParent } from '../capabilities/clipping/index.js';

/**
 * Handles gesture-based re-parenting and detaching when dragging shapes (§5).
 * - Dragging a shape OUT of its frame past bounds + threshold (12px screen) detaches it.
 * - Dropping a shape fully inside another frame parents it (smallest-area wins on overlap).
 * - Dragging between frames (out of A, into B) executes as a single atomic transaction.
 */
export function handleGestureReparent(
  shapeId: ShapeId,
  store: CanvasStore,
  registry: ShapeRegistry,
  camera: CameraController
): void {
  const shape = store.getShape(shapeId);
  if (!shape) return;

  const def = registry.get(shape.type);
  if (!def) return;

  const bounds = def.geometry.bounds(shape);
  const currentParentId = (shape.meta['parent'] ?? shape.meta['parentId']) as string | undefined;

  // 1. Check if dropped fully inside any frame (smallest area candidate wins)
  const suggested = findSuggestedParent(bounds, store.listShapes(), registry, shape.id);

  if (suggested) {
    if (suggested.id !== currentParentId) {
      store.updateShape(shape.id, {
        meta: { ...shape.meta, parent: suggested.id, parentId: undefined },
      });
    }
    return;
  }

  // 2. If it was inside a parent, check if dragged past threshold to detach
  if (currentParentId) {
    const parent = store.getShape(currentParentId);
    if (!parent) {
      _detach(shape, store);
      return;
    }

    const parentDef = registry.get(parent.type);
    if (!parentDef) {
      _detach(shape, store);
      return;
    }

    const parentBounds = parentDef.geometry.bounds(parent);
    const p0 = camera.screenToPage({ x: 0, y: 0 });
    const p1 = camera.screenToPage({ x: 12, y: 0 });
    const threshold = Math.abs(p1.x - p0.x);

    const isPastThreshold =
      bounds.x < parentBounds.x - threshold ||
      bounds.y < parentBounds.y - threshold ||
      bounds.x + bounds.width > parentBounds.x + parentBounds.width + threshold ||
      bounds.y + bounds.height > parentBounds.y + parentBounds.height + threshold;

    if (isPastThreshold) {
      _detach(shape, store);
    }
  }
}

function _detach(shape: ShapeRecord, store: CanvasStore): void {
  store.updateShape(shape.id, {
    meta: { ...shape.meta, parent: undefined, parentId: undefined },
  });
}
