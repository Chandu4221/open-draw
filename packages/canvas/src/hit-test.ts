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

export function boxIntersectsBox(a: BoundingBox, b: BoundingBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function pickShapesInBox(document: Document, marqueeBox: BoundingBox): readonly ShapeId[] {
  const result: ShapeId[] = [];
  for (const shape of Object.values(document.shapes)) {
    const box = absoluteBoundingBox(document, shape);
    const enclosesMarquee =
      box.x <= marqueeBox.x &&
      box.y <= marqueeBox.y &&
      box.x + box.width >= marqueeBox.x + marqueeBox.width &&
      box.y + box.height >= marqueeBox.y + marqueeBox.height;

    if (!enclosesMarquee && boxIntersectsBox(box, marqueeBox)) {
      result.push(shape.id);
    }
  }
  return result;
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
  const midX = worldBox.x + worldBox.width / 2;
  const midY = worldBox.y + worldBox.height / 2;
  const right = worldBox.x + worldBox.width;
  const bottom = worldBox.y + worldBox.height;

  const handles: ReadonlyArray<readonly [HandleId, Point]> = [
    [HANDLES.nw, { x: worldBox.x, y: worldBox.y }],
    [HANDLES.ne, { x: right, y: worldBox.y }],
    [HANDLES.se, { x: right, y: bottom }],
    [HANDLES.sw, { x: worldBox.x, y: bottom }],
    [HANDLES.n, { x: midX, y: worldBox.y }],
    [HANDLES.s, { x: midX, y: bottom }],
    [HANDLES.w, { x: worldBox.x, y: midY }],
    [HANDLES.e, { x: right, y: midY }],
  ];
  for (const [handle, position] of handles) {
    const onScreen = worldToScreen(camera, position);
    if (
      Math.abs(onScreen.x - screenPoint.x) <= HANDLE_PICK_RADIUS_PX &&
      Math.abs(onScreen.y - screenPoint.y) <= HANDLE_PICK_RADIUS_PX
    ) {
      return handle;
    }
  }
  return null;
}
