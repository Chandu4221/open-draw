// Line shape module (ADR-0003 D1, D5, R-012).
import type { BoundingBox, CapabilityId, Point } from "@open-draw/contracts";
import { CAPABILITIES, SHAPE_KINDS } from "@open-draw/contracts";

export const KIND = SHAPE_KINDS.line;
export const LINE_KIND = SHAPE_KINDS.line;

export const LINE_CAPABILITIES: readonly CapabilityId[] = Object.freeze([
  CAPABILITIES.resizable,
  CAPABILITIES.movable,
]);

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const px = p.x - a.x;
    const py = p.y - a.y;
    return Math.sqrt(px * px + py * py);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const diffX = p.x - projX;
  const diffY = p.y - projY;
  return Math.sqrt(diffX * diffX + diffY * diffY);
}

export function deriveLineBoundingBox(
  rawStart: Point,
  rawEnd: Point,
): { boundingBox: BoundingBox; start: Point; end: Point } {
  const minX = Math.min(rawStart.x, rawEnd.x);
  const maxX = Math.max(rawStart.x, rawEnd.x);
  const minY = Math.min(rawStart.y, rawEnd.y);
  const maxY = Math.max(rawStart.y, rawEnd.y);
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return {
    boundingBox: { x: minX, y: minY, width, height },
    start: { x: rawStart.x - minX, y: rawStart.y - minY },
    end: { x: rawEnd.x - minX, y: rawEnd.y - minY },
  };
}

export function scaleLineEndpointsForBox(
  prevBox: BoundingBox,
  nextBox: BoundingBox,
  start: Point,
  end: Point,
): { start: Point; end: Point } {
  const scaleX = prevBox.width === 0 ? 1 : nextBox.width / prevBox.width;
  const scaleY = prevBox.height === 0 ? 1 : nextBox.height / prevBox.height;
  return {
    start: { x: start.x * scaleX, y: start.y * scaleY },
    end: { x: end.x * scaleX, y: end.y * scaleY },
  };
}

export function hitTestLine(
  box: BoundingBox,
  start: Point,
  end: Point,
  worldPoint: Point,
  tolerance = 8,
): boolean {
  const a: Point = { x: box.x + start.x, y: box.y + start.y };
  const b: Point = { x: box.x + end.x, y: box.y + end.y };
  return distanceToSegment(worldPoint, a, b) <= tolerance;
}
