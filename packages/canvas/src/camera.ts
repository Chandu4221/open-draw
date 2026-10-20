import type { Camera, Point } from '@open-draw/schema';

/**
 * Error thrown when camera parameters are invalid (e.g. non-finite or non-positive zoom).
 */
export class InvalidCameraError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCameraError';
  }
}

/**
 * Error thrown when an invalid zoom factor is supplied.
 */
export class InvalidZoomError extends Error {
  readonly factor: number;

  constructor(factor: number, message?: string) {
    super(message ?? `Invalid zoom factor: ${factor}. Zoom factor must be a finite positive number.`);
    this.name = 'InvalidZoomError';
    this.factor = factor;
  }
}

/**
 * Default camera state positioned at origin with 1x zoom.
 */
export const DEFAULT_CAMERA: Camera = Object.freeze({
  x: 0,
  y: 0,
  zoom: 1,
});

/**
 * Options for zoom operations.
 */
export interface ZoomOptions {
  readonly minZoom?: number;
  readonly maxZoom?: number;
}

/**
 * Validates and creates an immutable Camera state object.
 */
export function createCamera(initial?: Partial<Camera>): Camera {
  const x = initial?.x ?? DEFAULT_CAMERA.x;
  const y = initial?.y ?? DEFAULT_CAMERA.y;
  const zoom = initial?.zoom ?? DEFAULT_CAMERA.zoom;

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new InvalidCameraError(`Camera coordinates must be finite numbers: x=${x}, y=${y}`);
  }
  if (!Number.isFinite(zoom) || zoom <= 0) {
    throw new InvalidCameraError(`Camera zoom must be a finite positive number: zoom=${zoom}`);
  }

  return Object.freeze({ x, y, zoom });
}

/**
 * Converts a point from page (canvas world) coordinates to screen (viewport) coordinates.
 * Screen point = point * camera.zoom + camera.offset
 */
export function pageToScreen(point: Point, camera: Camera): Point {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new InvalidCameraError(`Point coordinates must be finite numbers: x=${point.x}, y=${point.y}`);
  }
  return {
    x: point.x * camera.zoom + camera.x,
    y: point.y * camera.zoom + camera.y,
  };
}

/**
 * Converts a point from screen (viewport) coordinates to page (canvas world) coordinates.
 * Page point = (screen point - camera.offset) / camera.zoom
 */
export function screenToPage(point: Point, camera: Camera): Point {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new InvalidCameraError(`Point coordinates must be finite numbers: x=${point.x}, y=${point.y}`);
  }
  if (!Number.isFinite(camera.zoom) || camera.zoom <= 0) {
    throw new InvalidCameraError(`Camera zoom must be a finite positive number: zoom=${camera.zoom}`);
  }
  return {
    x: (point.x - camera.x) / camera.zoom,
    y: (point.y - camera.y) / camera.zoom,
  };
}

/**
 * Pans the camera by a delta in screen space.
 */
export function panCamera(camera: Camera, delta: Point): Camera {
  if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
    throw new InvalidCameraError(`Pan delta coordinates must be finite numbers: dx=${delta.x}, dy=${delta.y}`);
  }
  return createCamera({
    x: camera.x + delta.x,
    y: camera.y + delta.y,
    zoom: camera.zoom,
  });
}

/**
 * Zooms the camera around a specific anchor point on the screen (cursor-anchored zoom).
 * The canvas page point currently under screenPoint remains under screenPoint after zooming.
 */
export function zoomAroundPoint(
  camera: Camera,
  screenPoint: Point,
  factor: number,
  options?: ZoomOptions,
): Camera {
  if (!Number.isFinite(factor) || factor <= 0) {
    throw new InvalidZoomError(factor);
  }
  if (!Number.isFinite(screenPoint.x) || !Number.isFinite(screenPoint.y)) {
    throw new InvalidCameraError(`Screen anchor coordinates must be finite: x=${screenPoint.x}, y=${screenPoint.y}`);
  }

  let targetZoom = camera.zoom * factor;
  if (options?.minZoom !== undefined && Number.isFinite(options.minZoom)) {
    targetZoom = Math.max(targetZoom, options.minZoom);
  }
  if (options?.maxZoom !== undefined && Number.isFinite(options.maxZoom)) {
    targetZoom = Math.min(targetZoom, options.maxZoom);
  }

  const effectiveFactor = targetZoom / camera.zoom;
  const newX = screenPoint.x - (screenPoint.x - camera.x) * effectiveFactor;
  const newY = screenPoint.y - (screenPoint.y - camera.y) * effectiveFactor;

  return createCamera({
    x: newX,
    y: newY,
    zoom: targetZoom,
  });
}

/**
 * Produces the SVG transform string for the root viewport group:
 * translate(x, y) scale(zoom)
 */
export function cameraToTransform(camera: Camera): string {
  return `translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`;
}

/**
 * Stateful controller for managing camera state, coordinate transforms, and change listeners.
 */
export class CameraController {
  private _camera: Camera;
  private readonly _listeners = new Set<(camera: Camera) => void>();

  constructor(initial?: Partial<Camera>) {
    this._camera = createCamera(initial);
  }

  get camera(): Camera {
    return this._camera;
  }

  get x(): number {
    return this._camera.x;
  }

  get y(): number {
    return this._camera.y;
  }

  get zoom(): number {
    return this._camera.zoom;
  }

  setCamera(camera: Camera): void {
    const next = createCamera(camera);
    if (next.x !== this._camera.x || next.y !== this._camera.y || next.zoom !== this._camera.zoom) {
      this._camera = next;
      this._notify();
    }
  }

  pageToScreen(point: Point): Point {
    return pageToScreen(point, this._camera);
  }

  screenToPage(point: Point): Point {
    return screenToPage(point, this._camera);
  }

  pan(dx: number, dy: number): Camera {
    const next = panCamera(this._camera, { x: dx, y: dy });
    this._camera = next;
    this._notify();
    return next;
  }

  zoomAroundPoint(screenPoint: Point, factor: number, options?: ZoomOptions): Camera {
    const next = zoomAroundPoint(this._camera, screenPoint, factor, options);
    this._camera = next;
    this._notify();
    return next;
  }

  toTransform(): string {
    return cameraToTransform(this._camera);
  }

  subscribe(listener: (camera: Camera) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notify(): void {
    for (const listener of this._listeners) {
      listener(this._camera);
    }
  }
}
