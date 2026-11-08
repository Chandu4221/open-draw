// Camera behavior (R-015: describe = subject, it = behavior).
import { describe, expect, it } from "vitest";
import { DEFAULT_CAMERA, MAX_ZOOM, MIN_ZOOM, panBy, screenToWorld, zoomAt } from "./camera";

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
});
