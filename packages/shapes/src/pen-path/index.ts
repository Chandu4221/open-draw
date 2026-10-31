// Pen-path shape module (ADR-0003 D1, D5, D7, R-012).
import type { BoundingBox, CapabilityId, Point } from "@open-draw/contracts";
import { CAPABILITIES, SHAPE_KINDS } from "@open-draw/contracts";
import { distanceToSegment } from "../line";

export const KIND = SHAPE_KINDS.penPath;
export const PEN_PATH_KIND = SHAPE_KINDS.penPath;

export const PEN_PATH_CAPABILITIES: readonly CapabilityId[] = Object.freeze([
  CAPABILITIES.resizable,
  CAPABILITIES.movable,
  CAPABILITIES.freehandPath,
]);

export function derivePenPathBoundingBox(rawPoints: readonly Point[]): {
  boundingBox: BoundingBox;
  points: Point[];
} {
  if (rawPoints.length === 0) {
    return {
      boundingBox: { x: 0, y: 0, width: 1, height: 1 },
      points: [],
    };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of rawPoints) {
    if (point.x < minX) minX = point.x;
    if (point.x > maxX) maxX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.y > maxY) maxY = point.y;
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const points = rawPoints.map((point) => ({
    x: point.x - minX,
    y: point.y - minY,
  }));
  return {
    boundingBox: { x: minX, y: minY, width, height },
    points,
  };
}

export function scalePenPathPointsForBox(
  prevBox: BoundingBox,
  nextBox: BoundingBox,
  points: readonly Point[],
): Point[] {
  const scaleX = prevBox.width === 0 ? 1 : nextBox.width / prevBox.width;
  const scaleY = prevBox.height === 0 ? 1 : nextBox.height / prevBox.height;
  return points.map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));
}

export function hitTestPenPath(
  box: BoundingBox,
  points: readonly Point[],
  worldPoint: Point,
  tolerance = 8,
): boolean {
  if (points.length === 0) {
    return false;
  }
  if (points.length === 1) {
    const pt = points[0]!;
    const dx = worldPoint.x - (box.x + pt.x);
    const dy = worldPoint.y - (box.y + pt.y);
    return Math.sqrt(dx * dx + dy * dy) <= tolerance;
  }
  for (let i = 0; i < points.length - 1; i += 1) {
    const a: Point = { x: box.x + points[i]!.x, y: box.y + points[i]!.y };
    const b: Point = { x: box.x + points[i + 1]!.x, y: box.y + points[i + 1]!.y };
    if (distanceToSegment(worldPoint, a, b) <= tolerance) {
      return true;
    }
  }
  return false;
}
