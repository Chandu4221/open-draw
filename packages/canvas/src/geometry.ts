// Pure gesture geometry (R-008): the draw and resize math, free functions
// over plain data. All boxes are in world space; the shell converts to
// parent-local before committing commands.
import type { BoundingBox, Point } from "@open-draw/contracts";
import { HANDLES, type HandleId } from "./handles";

export const MIN_SHAPE_SIZE = 1;

// A draw gesture anchored at `start`, wherever the pointer is now.
export function normalizeBox(start: Point, end: Point): BoundingBox {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.max(MIN_SHAPE_SIZE, Math.abs(end.x - start.x)),
    height: Math.max(MIN_SHAPE_SIZE, Math.abs(end.y - start.y)),
  };
}

// Resizes from a corner handle. The anchored edges NEVER move — only the
// dragged edge does (review Bug 3 fix). Never below MIN_SHAPE_SIZE; no flip
// this milestone.
export function resizeBox(original: BoundingBox, handle: HandleId, worldPoint: Point): BoundingBox {
  const right = original.x + original.width;
  const bottom = original.y + original.height;
  switch (handle) {
    case HANDLES.se:
      return {
        x: original.x,
        y: original.y,
        width: Math.max(MIN_SHAPE_SIZE, worldPoint.x - original.x),
        height: Math.max(MIN_SHAPE_SIZE, worldPoint.y - original.y),
      };
    case HANDLES.ne: {
      const y = Math.min(worldPoint.y, bottom - MIN_SHAPE_SIZE);
      return {
        x: original.x,
        y,
        width: Math.max(MIN_SHAPE_SIZE, worldPoint.x - original.x),
        height: bottom - y,
      };
    }
    case HANDLES.sw: {
      const x = Math.min(worldPoint.x, right - MIN_SHAPE_SIZE);
      return {
        x,
        y: original.y,
        width: right - x,
        height: Math.max(MIN_SHAPE_SIZE, worldPoint.y - original.y),
      };
    }
    case HANDLES.nw: {
      const x = Math.min(worldPoint.x, right - MIN_SHAPE_SIZE);
      const y = Math.min(worldPoint.y, bottom - MIN_SHAPE_SIZE);
      return { x, y, width: right - x, height: bottom - y };
    }
  }
}
