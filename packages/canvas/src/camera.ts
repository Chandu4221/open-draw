// Camera as a transform, never geometry (R-017): pan/zoom never rewrites
// shape coordinates. All functions pure (R-008).
import type { Point } from "@open-draw/contracts";

export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;

export function panBy(camera: Camera, screenDelta: Point): Camera {
  return {
    ...camera,
    x: camera.x - screenDelta.x / camera.zoom,
    y: camera.y - screenDelta.y / camera.zoom,
  };
}

export function zoomAt(camera: Camera, screenPoint: Point, factor: number): Camera {
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * factor));
  const world = screenToWorld(camera, screenPoint);
  return { zoom, x: world.x - screenPoint.x / zoom, y: world.y - screenPoint.y / zoom };
}

export function screenToWorld(camera: Camera, screenPoint: Point): Point {
  return {
    x: camera.x + screenPoint.x / camera.zoom,
    y: camera.y + screenPoint.y / camera.zoom,
  };
}

export function worldToScreen(camera: Camera, worldPoint: Point): Point {
  return {
    x: (worldPoint.x - camera.x) * camera.zoom,
    y: (worldPoint.y - camera.y) * camera.zoom,
  };
}
