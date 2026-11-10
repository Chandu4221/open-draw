// Pure multi-touch gesture tracker for pinch-to-zoom and two-finger pan (R-008, R-010, ADR-0008).
import type { Point } from "@open-draw/contracts";

export interface PinchDelta {
  readonly center: Point;
  readonly panDelta: Point;
  readonly zoomFactor: number;
  readonly distance: number;
}

export interface TouchTracker {
  readonly pointers: ReadonlyMap<number, Point>;
  readonly lastCenter: Point | null;
  readonly lastDistance: number | null;
}

export function createTouchTracker(): TouchTracker {
  return {
    pointers: new Map(),
    lastCenter: null,
    lastDistance: null,
  };
}

export function addTouchPointer(
  tracker: TouchTracker,
  pointerId: number,
  screenPoint: Point,
): TouchTracker {
  const next = new Map(tracker.pointers);
  next.set(pointerId, screenPoint);
  let lastCenter = tracker.lastCenter;
  let lastDistance = tracker.lastDistance;

  if (next.size === 2) {
    const pts = Array.from(next.values());
    const p1 = pts[0]!;
    const p2 = pts[1]!;
    lastCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    lastDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  } else if (next.size !== 2) {
    lastCenter = null;
    lastDistance = null;
  }

  return {
    pointers: next,
    lastCenter,
    lastDistance,
  };
}

export function removeTouchPointer(tracker: TouchTracker, pointerId: number): TouchTracker {
  if (!tracker.pointers.has(pointerId)) {
    return tracker;
  }
  const next = new Map(tracker.pointers);
  next.delete(pointerId);
  let lastCenter: Point | null = null;
  let lastDistance: number | null = null;

  if (next.size === 2) {
    const pts = Array.from(next.values());
    const p1 = pts[0]!;
    const p2 = pts[1]!;
    lastCenter = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    lastDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  return {
    pointers: next,
    lastCenter,
    lastDistance,
  };
}

export function updateTouchPointer(
  tracker: TouchTracker,
  pointerId: number,
  screenPoint: Point,
): { readonly tracker: TouchTracker; readonly pinchDelta: PinchDelta | null } {
  if (!tracker.pointers.has(pointerId)) {
    return { tracker, pinchDelta: null };
  }
  const next = new Map(tracker.pointers);
  next.set(pointerId, screenPoint);

  if (next.size !== 2) {
    return {
      tracker: {
        pointers: next,
        lastCenter: null,
        lastDistance: null,
      },
      pinchDelta: null,
    };
  }

  const pts = Array.from(next.values());
  const p1 = pts[0]!;
  const p2 = pts[1]!;
  const center: Point = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);

  if (tracker.lastCenter === null || tracker.lastDistance === null || tracker.lastDistance <= 0) {
    return {
      tracker: {
        pointers: next,
        lastCenter: center,
        lastDistance: distance,
      },
      pinchDelta: null,
    };
  }

  const panDelta: Point = {
    x: center.x - tracker.lastCenter.x,
    y: center.y - tracker.lastCenter.y,
  };
  const zoomFactor = distance > 0 && tracker.lastDistance > 0 ? distance / tracker.lastDistance : 1;

  const pinchDelta: PinchDelta = {
    center,
    panDelta,
    zoomFactor,
    distance,
  };

  return {
    tracker: {
      pointers: next,
      lastCenter: center,
      lastDistance: distance,
    },
    pinchDelta,
  };
}
