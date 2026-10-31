// Ellipse shape module (ADR-0003 D1, R-012).
import type { BoundingBox, CapabilityId, Point } from "@open-draw/contracts";
import { CAPABILITIES, SHAPE_KINDS } from "@open-draw/contracts";

export const KIND = SHAPE_KINDS.ellipse;
export const ELLIPSE_KIND = SHAPE_KINDS.ellipse;

export const ELLIPSE_CAPABILITIES: readonly CapabilityId[] = Object.freeze([
  CAPABILITIES.resizable,
  CAPABILITIES.movable,
  CAPABILITIES.textLabel,
]);

export function hitTestEllipse(box: BoundingBox, point: Point): boolean {
  if (box.width <= 0 || box.height <= 0) {
    return false;
  }
  const rx = box.width / 2;
  const ry = box.height / 2;
  const cx = box.x + rx;
  const cy = box.y + ry;
  const dx = point.x - cx;
  const dy = point.y - cy;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}
