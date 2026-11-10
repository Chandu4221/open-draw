// Camera as a transform, never geometry (R-017): pan/zoom never rewrites
// shape coordinates. All functions pure (R-008).
import type { BoundingBox, Point } from "@open-draw/contracts";

export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 10;

export function clampCamera(camera: Camera): Camera {
  const x = Number.isFinite(camera.x) ? camera.x : 0;
  const y = Number.isFinite(camera.y) ? camera.y : 0;
  const zoomCandidate = Number.isFinite(camera.zoom) && camera.zoom > 0 ? camera.zoom : 1;
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomCandidate));
  return { x, y, zoom };
}

export function panBy(camera: Camera, screenDelta: Point): Camera {
  if (!Number.isFinite(screenDelta.x) || !Number.isFinite(screenDelta.y)) {
    return camera;
  }
  return {
    ...camera,
    x: camera.x - screenDelta.x / camera.zoom,
    y: camera.y - screenDelta.y / camera.zoom,
  };
}

export function zoomAt(camera: Camera, screenPoint: Point, factor: number): Camera {
  if (!Number.isFinite(factor) || factor <= 0) {
    return camera;
  }
  if (!Number.isFinite(screenPoint.x) || !Number.isFinite(screenPoint.y)) {
    return camera;
  }
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

/**
 * Computes the absolute world-space bounding box visible in the camera viewport,
 * with optional screen-space padding.
 */
export function cameraToViewportBox(
  camera: Camera,
  screenWidth: number,
  screenHeight: number,
  padding = 0,
): BoundingBox {
  const width = Math.max(0, screenWidth) / camera.zoom;
  const height = Math.max(0, screenHeight) / camera.zoom;
  const pad = padding / camera.zoom;
  return {
    x: camera.x - pad,
    y: camera.y - pad,
    width: width + pad * 2,
    height: height + pad * 2,
  };
}
