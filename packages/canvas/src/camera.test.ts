// Camera behavior (R-015: describe = subject, it = behavior).
import { describe, expect, it } from "vitest";
import {
  DEFAULT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  cameraToViewportBox,
  panBy,
  screenToWorld,
  zoomAt,
} from "./camera";
import { createCanvas } from "./create-canvas";

describe("camera", () => {
  it("maps screen points to world points at zoom 1", () => {
    expect(screenToWorld(DEFAULT_CAMERA, { x: 10, y: 20 })).toEqual({ x: 10, y: 20 });
  });

  it("maps screen points through pan and zoom", () => {
    const camera = { x: 100, y: 50, zoom: 2 };
    expect(screenToWorld(camera, { x: 40, y: 30 })).toEqual({ x: 120, y: 65 });
  });

  it("keeps the world point under the cursor when zooming", () => {
    const screenPoint = { x: 30, y: 40 };
    const before = screenToWorld(DEFAULT_CAMERA, screenPoint);
    const after = zoomAt(DEFAULT_CAMERA, screenPoint, 2);
    expect(screenToWorld(after, screenPoint)).toEqual(before);
  });

  it("clamps zoom to the configured range", () => {
    expect(zoomAt(DEFAULT_CAMERA, { x: 0, y: 0 }, 100).zoom).toBe(MAX_ZOOM);
    expect(zoomAt(DEFAULT_CAMERA, { x: 0, y: 0 }, 0.001).zoom).toBe(MIN_ZOOM);
  });

  it("pans in the opposite direction of the screen drag", () => {
    const panned = panBy(DEFAULT_CAMERA, { x: 100, y: 50 });
    expect(panned.x).toBe(-100);
    expect(panned.y).toBe(-50);
  });

  it("guards zoomAt against NaN, non-positive, or non-finite factor", () => {
    expect(zoomAt(DEFAULT_CAMERA, { x: 10, y: 10 }, NaN)).toEqual(DEFAULT_CAMERA);
    expect(zoomAt(DEFAULT_CAMERA, { x: 10, y: 10 }, Infinity)).toEqual(DEFAULT_CAMERA);
    expect(zoomAt(DEFAULT_CAMERA, { x: 10, y: 10 }, 0)).toEqual(DEFAULT_CAMERA);
    expect(zoomAt(DEFAULT_CAMERA, { x: 10, y: 10 }, -2)).toEqual(DEFAULT_CAMERA);
  });

  it("guards panBy against NaN or non-finite coordinates", () => {
    expect(panBy(DEFAULT_CAMERA, { x: NaN, y: 0 })).toEqual(DEFAULT_CAMERA);
    expect(panBy(DEFAULT_CAMERA, { x: 0, y: Infinity })).toEqual(DEFAULT_CAMERA);
  });

  it("clamps camera on initial options in createCanvas", () => {
    const canvas = createCanvas({ camera: { x: NaN, y: NaN, zoom: -1 } });
    expect(canvas.getCamera()).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it("computes the world-space viewport bounding box accurately (Pillar 1, ADR-0011)", () => {
    // Zoom 1, at (0, 0)
    const box1 = cameraToViewportBox(DEFAULT_CAMERA, 800, 600);
    expect(box1).toEqual({ x: 0, y: 0, width: 800, height: 600 });

    // Zoom 2, panned to (100, 50)
    const cam2 = { x: 100, y: 50, zoom: 2 };
    const box2 = cameraToViewportBox(cam2, 800, 600);
    expect(box2).toEqual({ x: 100, y: 50, width: 400, height: 300 });

    // With 64px padding
    const boxWithPadding = cameraToViewportBox(cam2, 800, 600, 64);
    // Pad in world space is 64 / 2 = 32
    expect(boxWithPadding).toEqual({ x: 68, y: 18, width: 464, height: 364 });
  });
});
