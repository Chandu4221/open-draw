// Pure gesture geometry (R-008): the draw and resize math, free functions
// over plain data. All boxes are in world space; the shell converts to
// parent-local before committing commands.
import type { BoundingBox, Point } from "@open-draw/contracts";
import { HANDLES, type HandleId } from "./handles";

export const MIN_SHAPE_SIZE = 1;

// A draw gesture anchored at `start`, wherever the pointer is now.
export function normalizeBox(start: Point, end: Point): BoundingBox {
  const sx = Number.isFinite(start.x) ? start.x : Number.isFinite(end.x) ? end.x : 0;
  const ex = Number.isFinite(end.x) ? end.x : Number.isFinite(start.x) ? start.x : 0;
  const sy = Number.isFinite(start.y) ? start.y : Number.isFinite(end.y) ? end.y : 0;
  const ey = Number.isFinite(end.y) ? end.y : Number.isFinite(start.y) ? start.y : 0;
  return {
    x: Math.min(sx, ex),
    y: Math.min(sy, ey),
    width: Math.max(MIN_SHAPE_SIZE, Math.abs(ex - sx)),
    height: Math.max(MIN_SHAPE_SIZE, Math.abs(ey - sy)),
  };
}

function normalizeSpan(anchor: number, dragged: number): { min: number; size: number } {
  if (dragged >= anchor) {
    return {
      min: anchor,
      size: Math.max(MIN_SHAPE_SIZE, dragged - anchor),
    };
  }
  const size = Math.max(MIN_SHAPE_SIZE, anchor - dragged);
  return {
    min: anchor - size,
    size,
  };
}

// Resizes from a corner or edge handle (ADR-0006 Option A, Milestone 09).
// Bidirectional resize: dragging past the anchored edge flips the box
// while preserving the anchor point as the opposite edge.
export function resizeBox(original: BoundingBox, handle: HandleId, worldPoint: Point): BoundingBox {
  const right = original.x + original.width;
  const bottom = original.y + original.height;
  const safeX = Number.isFinite(worldPoint.x)
    ? worldPoint.x
    : handle === HANDLES.w || handle === HANDLES.nw || handle === HANDLES.sw
      ? original.x
      : right;
  const safeY = Number.isFinite(worldPoint.y)
    ? worldPoint.y
    : handle === HANDLES.n || handle === HANDLES.ne || handle === HANDLES.nw
      ? original.y
      : bottom;
  switch (handle) {
    case HANDLES.se: {
      const spanX = normalizeSpan(original.x, safeX);
      const spanY = normalizeSpan(original.y, safeY);
      return { x: spanX.min, y: spanY.min, width: spanX.size, height: spanY.size };
    }
    case HANDLES.ne: {
      const spanX = normalizeSpan(original.x, safeX);
      const spanY = normalizeSpan(bottom, safeY);
      return { x: spanX.min, y: spanY.min, width: spanX.size, height: spanY.size };
    }
    case HANDLES.sw: {
      const spanX = normalizeSpan(right, safeX);
      const spanY = normalizeSpan(original.y, safeY);
      return { x: spanX.min, y: spanY.min, width: spanX.size, height: spanY.size };
    }
    case HANDLES.nw: {
      const spanX = normalizeSpan(right, safeX);
      const spanY = normalizeSpan(bottom, safeY);
      return { x: spanX.min, y: spanY.min, width: spanX.size, height: spanY.size };
    }
    case HANDLES.n: {
      const spanY = normalizeSpan(bottom, safeY);
      return { x: original.x, y: spanY.min, width: original.width, height: spanY.size };
    }
    case HANDLES.s: {
      const spanY = normalizeSpan(original.y, safeY);
      return { x: original.x, y: spanY.min, width: original.width, height: spanY.size };
    }
    case HANDLES.w: {
      const spanX = normalizeSpan(right, safeX);
      return { x: spanX.min, y: original.y, width: spanX.size, height: original.height };
    }
    case HANDLES.e: {
      const spanX = normalizeSpan(original.x, safeX);
      return { x: spanX.min, y: original.y, width: spanX.size, height: original.height };
    }
  }
}

export function flipHandle(handle: HandleId, flippedX: boolean, flippedY: boolean): HandleId {
  let result = handle;
  if (flippedX) {
    switch (result) {
      case HANDLES.nw:
        result = HANDLES.ne;
        break;
      case HANDLES.ne:
        result = HANDLES.nw;
        break;
      case HANDLES.se:
        result = HANDLES.sw;
        break;
      case HANDLES.sw:
        result = HANDLES.se;
        break;
      case HANDLES.w:
        result = HANDLES.e;
        break;
      case HANDLES.e:
        result = HANDLES.w;
        break;
      default:
        break;
    }
  }
  if (flippedY) {
    switch (result) {
      case HANDLES.nw:
        result = HANDLES.sw;
        break;
      case HANDLES.ne:
        result = HANDLES.se;
        break;
      case HANDLES.se:
        result = HANDLES.ne;
        break;
      case HANDLES.sw:
        result = HANDLES.nw;
        break;
      case HANDLES.n:
        result = HANDLES.s;
        break;
      case HANDLES.s:
        result = HANDLES.n;
        break;
      default:
        break;
    }
  }
  return result;
}

export function resizeBoxWithHandle(
  original: BoundingBox,
  handle: HandleId,
  worldPoint: Point,
): { boundingBox: BoundingBox; handle: HandleId } {
  const boundingBox = resizeBox(original, handle, worldPoint);
  const right = original.x + original.width;
  const bottom = original.y + original.height;

  const isWest = handle === HANDLES.nw || handle === HANDLES.w || handle === HANDLES.sw;
  const isEast = handle === HANDLES.ne || handle === HANDLES.e || handle === HANDLES.se;
  const isNorth = handle === HANDLES.nw || handle === HANDLES.n || handle === HANDLES.ne;
  const isSouth = handle === HANDLES.sw || handle === HANDLES.s || handle === HANDLES.se;

  const flippedX = (isWest && worldPoint.x > right) || (isEast && worldPoint.x < original.x);
  const flippedY = (isNorth && worldPoint.y > bottom) || (isSouth && worldPoint.y < original.y);

  return {
    boundingBox,
    handle: flipHandle(handle, flippedX, flippedY),
  };
}
