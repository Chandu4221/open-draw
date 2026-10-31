// Rect shape module (ADR-0003 D1, R-012).
import type { BoundingBox, CapabilityId, Point } from "@open-draw/contracts";
import { CAPABILITIES, SHAPE_KINDS } from "@open-draw/contracts";

export const KIND = SHAPE_KINDS.rect;
export const RECT_KIND = SHAPE_KINDS.rect;

export const RECT_CAPABILITIES: readonly CapabilityId[] = Object.freeze([
  CAPABILITIES.resizable,
  CAPABILITIES.movable,
  CAPABILITIES.textLabel,
]);

export function hitTestRect(box: BoundingBox, point: Point): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
}
