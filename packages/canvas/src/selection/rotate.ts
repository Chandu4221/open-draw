import type { Point } from '@open-draw/schema';

export interface RotateOptions {
  readonly snap?: boolean;
  readonly snapIntervalDeg?: number;
  readonly thresholdDeg?: number;
}

/**
 * Computes clockwise rotation angle in degrees from center to currentPoint.
 * 0 degrees points straight UP (12 o'clock, matching the rotate handle position).
 * By default, snaps to 45-degree intervals (0, 45, 90, 135, ...) within 5 degrees,
 * unless options.snap is false (e.g. when Shift is held for free rotation).
 */
export function computeRotationAngle(
  center: Point,
  currentPoint: Point,
  options: RotateOptions = {}
): number {
  const dx = currentPoint.x - center.x;
  const dy = currentPoint.y - center.y;

  // In SVG coords, straight up is dx=0, dy<0 (atan2 is -PI/2)
  // Adding 90 degrees maps 12 o'clock to 0 deg clockwise
  let deg = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;

  const snap = options.snap ?? true;
  if (!snap) {
    return Math.round(deg * 10) / 10;
  }

  const interval = options.snapIntervalDeg ?? 45;
  const threshold = options.thresholdDeg ?? 5;

  const nearest = Math.round(deg / interval) * interval;
  if (Math.abs(deg - nearest) <= threshold) {
    deg = (nearest + 360) % 360;
  }

  return Math.round(deg * 10) / 10;
}

/**
 * Rotates a point around a center by angleDeg clockwise.
 */
export function rotatePoint(point: Point, center: Point, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}
