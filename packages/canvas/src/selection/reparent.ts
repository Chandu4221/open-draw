import type { Bounds, ShapeId, ShapeRecord } from '@open-draw/schema';
import type { ShapeRegistry } from '../registry.js';
import type { CanvasStore } from '../store/index.js';
import type { CameraController } from '../camera.js';
import { findSuggestedParent } from '../capabilities/clipping/index.js';

function doBoundsIntersect(b1: Bounds, b2: Bounds): boolean {
  return !(
    b1.x + b1.width <= b2.x ||
    b2.x + b2.width <= b1.x ||
    b1.y + b1.height <= b2.y ||
    b2.y + b2.height <= b1.y
  );
}

/**
 * Grows a parent frame to encompass targetBounds, cascading up the ancestor tree.
 * Only applies to frame containers; groups and root never grow (ADR-003).
 */
export function growFrameToFit(
  store: CanvasStore,
  registry: ShapeRegistry,
  frameId: ShapeId,
  targetBounds: Bounds
): void {
  const frame = store.getShape(frameId);
  if (!frame) return;

  const frameDef = registry.get(frame.type);
  if (!frameDef?.capabilities?.clipping?.isMask(frame)) return;

  const currentBounds = frameDef.geometry.bounds(frame);

  const minX = Math.min(currentBounds.x, targetBounds.x);
  const minY = Math.min(currentBounds.y, targetBounds.y);
  const maxX = Math.max(currentBounds.x + currentBounds.width, targetBounds.x + targetBounds.width);
  const maxY = Math.max(currentBounds.y + currentBounds.height, targetBounds.y + targetBounds.height);

  const unionBounds: Bounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  if (
    unionBounds.x !== currentBounds.x ||
    unionBounds.y !== currentBounds.y ||
    unionBounds.width !== currentBounds.width ||
    unionBounds.height !== currentBounds.height
  ) {
    store.updateShape(frame.id, {
      x: unionBounds.x,
      y: unionBounds.y,
      props: {
        ...frame.props,
        width: unionBounds.width,
        height: unionBounds.height,
      },
    });

    const parentId = (frame.meta['parent'] ?? frame.meta['parentId']) as ShapeId | undefined;
    if (parentId) {
      growFrameToFit(store, registry, parentId, unionBounds);
    }
  }
}

/**
 * Handles gesture-based re-parenting and detaching when dragging shapes (§5 & Phase 5 §7.5).
 * - Dragging a shape OUT of its frame past bounds + threshold (12px screen) detaches it.
 * - Dropping a shape inside or near a frame edge auto-grows the frame and parents it.
 * - Single atomic transaction guarantees undo reverts both growth and reparenting.
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
  let candidate = findSuggestedParent(bounds, store.listShapes(), registry, shape.id);

  // 1b. If not fully contained, check for edge overlap / partial containment
  if (!candidate) {
    let smallestArea = Infinity;
    for (const s of store.listShapes()) {
      if (s.id === shape.id) continue;
      const sDef = registry.get(s.type);
      if (!sDef?.capabilities?.clipping?.isMask(s)) continue;
      const sBounds = sDef.geometry.bounds(s);
      if (doBoundsIntersect(bounds, sBounds)) {
        const area = sBounds.width * sBounds.height;
        if (area < smallestArea) {
          smallestArea = area;
          candidate = s;
        }
      }
    }
  }

  if (candidate) {
    if (candidate.id !== currentParentId) {
      store.transact(() => {
        growFrameToFit(store, registry, candidate!.id, bounds);
        store.updateShape(shape.id, {
          meta: { ...shape.meta, parent: candidate!.id, parentId: undefined },
        });
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
