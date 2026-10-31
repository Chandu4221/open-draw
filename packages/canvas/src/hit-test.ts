// Pure hit-testing over the canonical document (R-016: no cached truth, ADR-0003 D1/D5).
// Topmost = last in the pre-order walk. Handles are picked in screen space.
import type { BoundingBox, Point, ShapeId } from "@open-draw/contracts";
import { absoluteBoundingBox, shapeListInOrder, type Document } from "@open-draw/document";
import { worldToScreen, type Camera } from "./camera";
import { HANDLES, type HandleId } from "./handles";
import type { ShapeKindRegistry } from "./register-shape-kind";

export const HANDLE_PICK_RADIUS_PX = 8;

export function pointInBox(box: BoundingBox, point: Point): boolean {
  return (
    point.x >= box.x &&
    point.x < box.x + box.width &&
    point.y >= box.y &&
    point.y < box.y + box.height
  );
}

export function pickShape(
  document: Document,
  worldPoint: Point,
  registry?: ShapeKindRegistry,
): ShapeId | null {
  const ordered = shapeListInOrder(document);
  for (let index = ordered.length - 1; index >= 0; index -= 1) {
    const shape = ordered[index]!;
    const box = absoluteBoundingBox(document, shape);
    const customTester = registry?.get(shape.kind)?.hitTest;
    if (customTester !== undefined) {
      if (customTester(box, shape, worldPoint)) {
        return shape.id;
      }
    } else if (pointInBox(box, worldPoint)) {
      return shape.id;
    }
  }
  return null;
}

export function pickHandle(
  camera: Camera,
  worldBox: BoundingBox,
  screenPoint: Point,
): HandleId | null {
  const corners: ReadonlyArray<readonly [HandleId, Point]> = [
    [HANDLES.nw, { x: worldBox.x, y: worldBox.y }],
    [HANDLES.ne, { x: worldBox.x + worldBox.width, y: worldBox.y }],
    [HANDLES.se, { x: worldBox.x + worldBox.width, y: worldBox.y + worldBox.height }],
    [HANDLES.sw, { x: worldBox.x, y: worldBox.y + worldBox.height }],
  ];
  for (const [handle, corner] of corners) {
    const onScreen = worldToScreen(camera, corner);
    if (
      Math.abs(onScreen.x - screenPoint.x) <= HANDLE_PICK_RADIUS_PX &&
      Math.abs(onScreen.y - screenPoint.y) <= HANDLE_PICK_RADIUS_PX
    ) {
      return handle;
    }
  }
  return null;
}
