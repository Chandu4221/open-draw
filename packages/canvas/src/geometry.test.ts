// Gesture geometry behavior (R-015). These exist specifically because the
// adversarial review caught inverted anchor math that no test would have
// caught otherwise (R-043).
import { describe, expect, it } from "vitest";
import { HANDLES } from "./handles";
import { MIN_SHAPE_SIZE, normalizeBox, resizeBox } from "./geometry";

describe("normalizeBox", () => {
  it("produces a positive box from an up-left drag", () => {
    expect(normalizeBox({ x: 100, y: 100 }, { x: 40, y: 60 })).toEqual({
      x: 40,
      y: 60,
      width: 60,
      height: 40,
    });
  });

  it("never produces a box smaller than the minimum size", () => {
    expect(normalizeBox({ x: 10, y: 10 }, { x: 10, y: 10 })).toEqual({
      x: 10,
      y: 10,
      width: MIN_SHAPE_SIZE,
      height: MIN_SHAPE_SIZE,
    });
  });
});

describe("resizeBox", () => {
  const original = { x: 10, y: 10, width: 100, height: 50 };

  it("grows from the south-east handle", () => {
    expect(resizeBox(original, HANDLES.se, { x: 150, y: 100 })).toEqual({
      x: 10,
      y: 10,
      width: 140,
      height: 90,
    });
  });

  it("keeps the bottom anchored when dragging the north-east handle down", () => {
    expect(resizeBox(original, HANDLES.ne, { x: 150, y: 40 })).toEqual({
      x: 10,
      y: 40,
      width: 140,
      height: 20,
    });
  });

  it("keeps the right edge anchored when dragging the south-west handle", () => {
    expect(resizeBox(original, HANDLES.sw, { x: 60, y: 100 })).toEqual({
      x: 60,
      y: 10,
      width: 50,
      height: 90,
    });
  });

  it("anchors both opposite edges from the north-west handle", () => {
    expect(resizeBox(original, HANDLES.nw, { x: 0, y: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 110,
      height: 60,
    });
  });

  it("clamps at the minimum size without flipping past the anchored edge", () => {
    const resized = resizeBox(original, HANDLES.ne, { x: 150, y: 200 });
    expect(resized.y + resized.height).toBe(60); // bottom stays anchored
    expect(resized.height).toBe(MIN_SHAPE_SIZE);
  });

  it("grows/shrinks height from the north handle while keeping bottom and x anchored", () => {
    // original: { x: 10, y: 10, width: 100, height: 50 }, bottom = 60
    expect(resizeBox(original, HANDLES.n, { x: 50, y: 30 })).toEqual({
      x: 10,
      y: 30,
      width: 100,
      height: 30,
    });
  });

  it("grows/shrinks height from the south handle while keeping top and x anchored", () => {
    expect(resizeBox(original, HANDLES.s, { x: 50, y: 90 })).toEqual({
      x: 10,
      y: 10,
      width: 100,
      height: 80,
    });
  });

  it("grows/shrinks width from the west handle while keeping right and y anchored", () => {
    // original: { x: 10, y: 10, width: 100, height: 50 }, right = 110
    expect(resizeBox(original, HANDLES.w, { x: 40, y: 30 })).toEqual({
      x: 40,
      y: 10,
      width: 70,
      height: 50,
    });
  });

  it("grows/shrinks width from the east handle while keeping left and y anchored", () => {
    expect(resizeBox(original, HANDLES.e, { x: 160, y: 30 })).toEqual({
      x: 10,
      y: 10,
      width: 150,
      height: 50,
    });
  });
});
