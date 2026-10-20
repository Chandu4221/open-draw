import { describe, expect, it, vi } from 'vitest';
import {
  CameraController,
  DEFAULT_CAMERA,
  InvalidCameraError,
  InvalidZoomError,
  cameraToTransform,
  createCamera,
  pageToScreen,
  panCamera,
  screenToPage,
  zoomAroundPoint,
} from './camera.js';

describe('camera module', () => {
  describe('createCamera', () => {
    it('returns default camera when called with no arguments', () => {
      const camera = createCamera();
      expect(camera).toEqual(DEFAULT_CAMERA);
      expect(camera.x).toBe(0);
      expect(camera.y).toBe(0);
      expect(camera.zoom).toBe(1);
    });

    it('creates camera with custom values', () => {
      const camera = createCamera({ x: 100, y: -50, zoom: 2.5 });
      expect(camera.x).toBe(100);
      expect(camera.y).toBe(-50);
      expect(camera.zoom).toBe(2.5);
    });

    it('throws InvalidCameraError for non-finite coordinates', () => {
      expect(() => createCamera({ x: NaN })).toThrow(InvalidCameraError);
      expect(() => createCamera({ y: Infinity })).toThrow(InvalidCameraError);
    });

    it('throws InvalidCameraError for non-positive or non-finite zoom', () => {
      expect(() => createCamera({ zoom: 0 })).toThrow(InvalidCameraError);
      expect(() => createCamera({ zoom: -1 })).toThrow(InvalidCameraError);
      expect(() => createCamera({ zoom: Infinity })).toThrow(InvalidCameraError);
      expect(() => createCamera({ zoom: NaN })).toThrow(InvalidCameraError);
    });
  });

  describe('coordinate transforms (pageToScreen & screenToPage)', () => {
    it('behaves as identity at origin with 1x zoom', () => {
      const camera = createCamera({ x: 0, y: 0, zoom: 1 });
      const point = { x: 120, y: 340 };

      const screen = pageToScreen(point, camera);
      expect(screen.x).toBe(120);
      expect(screen.y).toBe(340);

      const page = screenToPage(screen, camera);
      expect(page.x).toBe(120);
      expect(page.y).toBe(340);
    });

    it('transforms points with camera translation and zoom', () => {
      const camera = createCamera({ x: 50, y: 20, zoom: 2 });
      const pagePoint = { x: 100, y: 50 };

      // screen = page * zoom + offset = 100*2 + 50 = 250, 50*2 + 20 = 120
      const screenPoint = pageToScreen(pagePoint, camera);
      expect(screenPoint.x).toBe(250);
      expect(screenPoint.y).toBe(120);

      // inverse: page = (screen - offset) / zoom = (250 - 50)/2 = 100, (120 - 20)/2 = 50
      const backToPage = screenToPage(screenPoint, camera);
      expect(backToPage.x).toBe(100);
      expect(backToPage.y).toBe(50);
    });

    it('preserves exact roundtrip for arbitrary points and camera states', () => {
      const camera = createCamera({ x: -142.3, y: 899.7, zoom: 0.35 });
      const originalPage = { x: 543.21, y: -987.65 };

      const screen = pageToScreen(originalPage, camera);
      const restoredPage = screenToPage(screen, camera);

      expect(restoredPage.x).toBeCloseTo(originalPage.x, 10);
      expect(restoredPage.y).toBeCloseTo(originalPage.y, 10);
    });

    it('throws InvalidCameraError for invalid point coordinates', () => {
      const camera = createCamera();
      expect(() => pageToScreen({ x: NaN, y: 0 }, camera)).toThrow(InvalidCameraError);
      expect(() => screenToPage({ x: 0, y: Infinity }, camera)).toThrow(InvalidCameraError);
    });
  });

  describe('panCamera', () => {
    it('translates camera offsets while preserving zoom', () => {
      const camera = createCamera({ x: 10, y: 20, zoom: 2 });
      const panned = panCamera(camera, { x: 15, y: -5 });
      expect(panned.x).toBe(25);
      expect(panned.y).toBe(15);
      expect(panned.zoom).toBe(2);
    });

    it('throws InvalidCameraError on non-finite delta', () => {
      const camera = createCamera();
      expect(() => panCamera(camera, { x: NaN, y: 0 })).toThrow(InvalidCameraError);
    });
  });

  describe('zoomAroundPoint (cursor-anchored zoom)', () => {
    it('exact-number fixture 1: zoom around origin', () => {
      const camera = createCamera({ x: 0, y: 0, zoom: 1 });
      const screenPoint = { x: 400, y: 300 };

      // Zoom in 2x around (400, 300)
      const nextCamera = zoomAroundPoint(camera, screenPoint, 2);
      expect(nextCamera.zoom).toBe(2);
      expect(nextCamera.x).toBe(-400);
      expect(nextCamera.y).toBe(-300);

      // The page point at (400, 300) before zoom was (400, 300)
      // After zoom, pageToScreen of (400, 300) should be exactly (400, 300)
      const screenAfter = pageToScreen({ x: 400, y: 300 }, nextCamera);
      expect(screenAfter.x).toBe(400);
      expect(screenAfter.y).toBe(300);
    });

    it('exact-number fixture 2: anchor point invariant with offset and arbitrary zoom factor', () => {
      const initialCamera = createCamera({ x: -200, y: 150, zoom: 1.5 });
      const cursor = { x: 500, y: 250 };

      // Page point under cursor before zoom
      const pagePointUnderCursor = screenToPage(cursor, initialCamera);

      // Zoom out by factor 0.5 (zoom becomes 0.75)
      const zoomedCamera = zoomAroundPoint(initialCamera, cursor, 0.5);
      expect(zoomedCamera.zoom).toBe(0.75);

      // Page point under cursor after zoom must remain at cursor screen coordinates
      const cursorAfter = pageToScreen(pagePointUnderCursor, zoomedCamera);
      expect(cursorAfter.x).toBeCloseTo(cursor.x, 9);
      expect(cursorAfter.y).toBeCloseTo(cursor.y, 9);
    });

    it('exact-number fixture 3: Phase 2 zoom extremes (0.2x and 5x)', () => {
      const initialCamera = createCamera({ x: 50, y: -75, zoom: 1 });
      const cursor = { x: 320, y: 240 };
      const pageAnchor = screenToPage(cursor, initialCamera);

      // Zoom down to 0.2x
      const zoomedOut = zoomAroundPoint(initialCamera, cursor, 0.2);
      expect(zoomedOut.zoom).toBeCloseTo(0.2, 9);
      const screenAtLowZoom = pageToScreen(pageAnchor, zoomedOut);
      expect(screenAtLowZoom.x).toBeCloseTo(cursor.x, 9);
      expect(screenAtLowZoom.y).toBeCloseTo(cursor.y, 9);

      // Zoom up to 5x from zoomed out
      const zoomedIn = zoomAroundPoint(zoomedOut, cursor, 25); // 0.2 * 25 = 5.0
      expect(zoomedIn.zoom).toBeCloseTo(5.0, 9);
      const screenAtHighZoom = pageToScreen(pageAnchor, zoomedIn);
      expect(screenAtHighZoom.x).toBeCloseTo(cursor.x, 9);
      expect(screenAtHighZoom.y).toBeCloseTo(cursor.y, 9);
    });

    it('respects minZoom and maxZoom options while maintaining anchor invariant', () => {
      const camera = createCamera({ x: 0, y: 0, zoom: 1 });
      const cursor = { x: 100, y: 100 };
      const pageAnchor = screenToPage(cursor, camera);

      // Request factor 10, but clamp to maxZoom 3
      const clamped = zoomAroundPoint(camera, cursor, 10, { minZoom: 0.5, maxZoom: 3 });
      expect(clamped.zoom).toBe(3);

      const screenAfter = pageToScreen(pageAnchor, clamped);
      expect(screenAfter.x).toBeCloseTo(cursor.x, 9);
      expect(screenAfter.y).toBeCloseTo(cursor.y, 9);
    });

    it('throws InvalidZoomError on invalid zoom factors', () => {
      const camera = createCamera();
      const cursor = { x: 100, y: 100 };
      expect(() => zoomAroundPoint(camera, cursor, 0)).toThrow(InvalidZoomError);
      expect(() => zoomAroundPoint(camera, cursor, -2)).toThrow(InvalidZoomError);
      expect(() => zoomAroundPoint(camera, cursor, Infinity)).toThrow(InvalidZoomError);
      expect(() => zoomAroundPoint(camera, cursor, NaN)).toThrow(InvalidZoomError);
    });
  });

  describe('cameraToTransform', () => {
    it('formats valid SVG transform string for root group', () => {
      const camera = createCamera({ x: 150, y: -75, zoom: 1.25 });
      expect(cameraToTransform(camera)).toBe('translate(150, -75) scale(1.25)');
    });
  });

  describe('CameraController', () => {
    it('manages camera state and coordinate queries', () => {
      const controller = new CameraController({ x: 100, y: 50, zoom: 2 });
      expect(controller.x).toBe(100);
      expect(controller.y).toBe(50);
      expect(controller.zoom).toBe(2);
      expect(controller.toTransform()).toBe('translate(100, 50) scale(2)');

      const screen = controller.pageToScreen({ x: 10, y: 10 });
      expect(screen).toEqual({ x: 120, y: 70 });

      const page = controller.screenToPage({ x: 120, y: 70 });
      expect(page).toEqual({ x: 10, y: 10 });
    });

    it('notifies subscribers on pan, zoom, and setCamera', () => {
      const controller = new CameraController();
      const listener = vi.fn();
      const unsubscribe = controller.subscribe(listener);

      controller.pan(10, 20);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ x: 10, y: 20, zoom: 1 }));

      controller.zoomAroundPoint({ x: 100, y: 100 }, 2);
      expect(listener).toHaveBeenCalledTimes(2);

      controller.setCamera({ x: 0, y: 0, zoom: 1 });
      expect(listener).toHaveBeenCalledTimes(3);

      unsubscribe();
      controller.pan(5, 5);
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });
});
