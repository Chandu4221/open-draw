// Gesture geometry behavior (R-015). These exist specifically because the
// adversarial review caught inverted anchor math that no test would have
// caught otherwise (R-043).
import { describe, expect, it } from "vitest";
import { HANDLES } from "./handles";
import {
  MIN_SHAPE_SIZE,
  flipHandle,
  normalizeBox,
  resizeBox,
  resizeBoxWithHandle,
} from "./geometry";

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

  it("flips the box horizontally and vertically when dragging south-east past the top-left origin", () => {
    // original: { x: 10, y: 10, width: 100, height: 50 }, anchor is (10, 10)
    // dragging se to (-20, -15) flips past (10, 10):
    // x flips left: x = -20, width = 10 - (-20) = 30
    // y flips up: y = -15, height = 10 - (-15) = 25
    expect(resizeBox(original, HANDLES.se, { x: -20, y: -15 })).toEqual({
      x: -20,
      y: -15,
      width: 30,
      height: 25,
    });
  });

  it("flips the box horizontally and vertically when dragging north-west past the bottom-right origin", () => {
    // original: { x: 10, y: 10, width: 100, height: 50 }, anchor is (110, 60)
    // dragging nw to (140, 90) flips past (110, 60):
    // x flips right: x = 110, width = 140 - 110 = 30
    // y flips down: y = 60, height = 90 - 60 = 30
    expect(resizeBox(original, HANDLES.nw, { x: 140, y: 90 })).toEqual({
      x: 110,
      y: 60,
      width: 30,
      height: 30,
    });
  });

  it("flips the box vertically when dragging north past the bottom edge", () => {
    // original: { x: 10, y: 10, width: 100, height: 50 }, bottom = 60
    // dragging n to (50, 90) flips past bottom: y = 60, height = 30
    expect(resizeBox(original, HANDLES.n, { x: 50, y: 90 })).toEqual({
      x: 10,
      y: 60,
      width: 100,
      height: 30,
    });
  });

  it("flips the box horizontally when dragging west past the right edge", () => {
    // original: { x: 10, y: 10, width: 100, height: 50 }, right = 110
    // dragging w to (140, 30) flips past right: x = 110, width = 30
    expect(resizeBox(original, HANDLES.w, { x: 140, y: 30 })).toEqual({
      x: 110,
      y: 10,
      width: 30,
      height: 50,
    });
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

describe("flipHandle", () => {
  it("swaps corner handles horizontally and vertically", () => {
    expect(flipHandle(HANDLES.nw, true, false)).toBe(HANDLES.ne);
    expect(flipHandle(HANDLES.nw, false, true)).toBe(HANDLES.sw);
    expect(flipHandle(HANDLES.nw, true, true)).toBe(HANDLES.se);
    expect(flipHandle(HANDLES.se, true, true)).toBe(HANDLES.nw);
  });

  it("swaps edge handles along their active axis", () => {
    expect(flipHandle(HANDLES.n, false, true)).toBe(HANDLES.s);
    expect(flipHandle(HANDLES.s, false, true)).toBe(HANDLES.n);
    expect(flipHandle(HANDLES.w, true, false)).toBe(HANDLES.e);
    expect(flipHandle(HANDLES.e, true, false)).toBe(HANDLES.w);
  });

  it("preserves handles when no flip occurs", () => {
    expect(flipHandle(HANDLES.se, false, false)).toBe(HANDLES.se);
    expect(flipHandle(HANDLES.n, true, false)).toBe(HANDLES.n);
  });
});

describe("resizeBoxWithHandle", () => {
  const original = { x: 10, y: 10, width: 100, height: 50 };

  it("returns flipped box and swapped handle when dragging nw past se anchor", () => {
    const result = resizeBoxWithHandle(original, HANDLES.nw, { x: 140, y: 90 });
    expect(result.boundingBox).toEqual({
      x: 110,
      y: 60,
      width: 30,
      height: 30,
    });
    expect(result.handle).toBe(HANDLES.se);
  });

  it("returns flipped box and swapped handle when dragging n past bottom anchor", () => {
    const result = resizeBoxWithHandle(original, HANDLES.n, { x: 50, y: 90 });
    expect(result.boundingBox).toEqual({
      x: 10,
      y: 60,
      width: 100,
      height: 30,
    });
    expect(result.handle).toBe(HANDLES.s);
  });
});
