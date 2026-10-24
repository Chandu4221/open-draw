import type { CanvasEditor } from '@open-draw/canvas';
import type { Bounds, ShapeId, ShapeRecord } from '@open-draw/schema';

function getShapeBounds(editor: CanvasEditor, shape: ShapeRecord): Bounds {
  const def = editor.registry.get(shape.type);
  if (def?.geometry?.bounds) {
    return def.geometry.bounds(shape);
  }
  const width = Math.max(10, Number(shape.props['width']) || 100);
  const height = Math.max(10, Number(shape.props['height']) || 100);
  return { x: shape.x, y: shape.y, width, height };
}

function growFrameChain(
  editor: CanvasEditor,
  frameId: ShapeId,
  targetBounds: Bounds
): void {
  const frame = editor.store.getShape(frameId);
  if (!frame) return;

  const def = editor.registry.get(frame.type);
  if (!def?.capabilities?.clipping?.isMask(frame)) return;

  const currentBounds = getShapeBounds(editor, frame);

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
    editor.store.updateShape(frame.id, {
      x: unionBounds.x,
      y: unionBounds.y,
      props: {
        ...frame.props,
        width: unionBounds.width,
        height: unionBounds.height,
      },
    });

    const ancestorId = (frame.meta['parent'] ?? frame.meta['parentId']) as ShapeId | undefined;
    if (ancestorId) {
      growFrameChain(editor, ancestorId, unionBounds);
    }
  }
}

/**
 * Assigns a shape to a parent frame with atomic auto-growth (Phase 5 §7.5).
 * - If target is a frame and does not contain child bounds, frame auto-grows to union bounds.
 * - Growth cascades up ancestor frames.
 * - Group targets never clip and never auto-grow (ADR-003).
 * - Resize + reparent commits in a SINGLE store transaction (atomic undo).
 */
export function assignParentWithGrowth(
  editor: CanvasEditor,
  childId: ShapeId,
  targetParentId: ShapeId | null
): void {
  const child = editor.store.getShape(childId);
  if (!child) return;

  const currentParentId = (child.meta['parent'] ?? child.meta['parentId']) as string | null | undefined;
  if (targetParentId === (currentParentId || null)) return;

  editor.store.transact(() => {
    if (targetParentId) {
      const parent = editor.store.getShape(targetParentId);
      if (parent && editor.registry.get(parent.type)?.capabilities?.clipping?.isMask(parent)) {
        const childBounds = getShapeBounds(editor, child);
        growFrameChain(editor, parent.id, childBounds);
      }
    }

    editor.store.updateShape(child.id, {
      meta: {
        ...child.meta,
        parent: targetParentId ?? undefined,
        parentId: undefined,
      },
    });
  });
}
