import { describe, expect, it } from "vitest";
import { CAPABILITIES } from "@open-draw/contracts";
import {
  BUILTIN_SHAPE_CAPABILITIES,
  deriveLineBoundingBox,
  derivePenPathBoundingBox,
  ELLIPSE_CAPABILITIES,
  hitTestEllipse,
  hitTestLine,
  hitTestPenPath,
  hitTestRect,
  LINE_CAPABILITIES,
  PEN_PATH_CAPABILITIES,
  RECT_CAPABILITIES,
  scaleLineEndpointsForBox,
  scalePenPathPointsForBox,
} from "./index";

describe("rect shape module", () => {
  it("declares resizable and movable capabilities", () => {
    expect(RECT_CAPABILITIES).toContain(CAPABILITIES.resizable);
    expect(RECT_CAPABILITIES).toContain(CAPABILITIES.movable);
    expect(RECT_CAPABILITIES).toContain(CAPABILITIES.textLabel);
  });

  it("hit-tests points inside and outside box", () => {
    const box = { x: 10, y: 20, width: 100, height: 50 };
    expect(hitTestRect(box, { x: 50, y: 40 })).toBe(true);
    expect(hitTestRect(box, { x: 5, y: 40 })).toBe(false);
    expect(hitTestRect(box, { x: 50, y: 100 })).toBe(false);
  });
});

describe("ellipse shape module", () => {
  it("declares resizable and movable capabilities", () => {
    expect(ELLIPSE_CAPABILITIES).toContain(CAPABILITIES.resizable);
    expect(ELLIPSE_CAPABILITIES).toContain(CAPABILITIES.movable);
  });

  it("hit-tests points inside and outside ellipse geometry", () => {
    const box = { x: 0, y: 0, width: 100, height: 100 };
    // Center is inside
    expect(hitTestEllipse(box, { x: 50, y: 50 })).toBe(true);
    // Corner is outside rect inscribed ellipse
    expect(hitTestEllipse(box, { x: 5, y: 5 })).toBe(false);
    // Top-center edge is inside
    expect(hitTestEllipse(box, { x: 50, y: 0 })).toBe(true);
  });
});

describe("line shape module", () => {
  it("declares resizable and movable capabilities", () => {
    expect(LINE_CAPABILITIES).toContain(CAPABILITIES.resizable);
    expect(LINE_CAPABILITIES).toContain(CAPABILITIES.movable);
    expect(LINE_CAPABILITIES).not.toContain(CAPABILITIES.freehandPath);
  });

  it("derives bounding box and box-relative endpoints from raw world coordinates", () => {
    const rawStart = { x: 100, y: 250 };
    const rawEnd = { x: 300, y: 150 };
    const { boundingBox, start, end } = deriveLineBoundingBox(rawStart, rawEnd);

    expect(boundingBox).toEqual({ x: 100, y: 150, width: 200, height: 100 });
    expect(start).toEqual({ x: 0, y: 100 });
    expect(end).toEqual({ x: 200, y: 0 });
  });

  it("scales endpoints proportionally when bounding box resizes", () => {
    const prevBox = { x: 0, y: 0, width: 100, height: 50 };
    const nextBox = { x: 0, y: 0, width: 200, height: 100 };
    const start = { x: 10, y: 10 };
    const end = { x: 90, y: 40 };

    const scaled = scaleLineEndpointsForBox(prevBox, nextBox, start, end);
    expect(scaled.start).toEqual({ x: 20, y: 20 });
    expect(scaled.end).toEqual({ x: 180, y: 80 });
  });

  it("hit-tests proximity to the line segment", () => {
    const box = { x: 100, y: 100, width: 100, height: 100 };
    const start = { x: 0, y: 0 };
    const end = { x: 100, y: 100 };

    // Point exactly on line
    expect(hitTestLine(box, start, end, { x: 150, y: 150 })).toBe(true);
    // Point 4px away (within default 8px tolerance)
    expect(hitTestLine(box, start, end, { x: 150, y: 154 })).toBe(true);
    // Point 20px away (outside tolerance)
    expect(hitTestLine(box, start, end, { x: 150, y: 170 })).toBe(false);
  });
});

describe("pen-path shape module", () => {
  it("declares freehandPath capability", () => {
    expect(PEN_PATH_CAPABILITIES).toContain(CAPABILITIES.freehandPath);
    expect(PEN_PATH_CAPABILITIES).toContain(CAPABILITIES.movable);
  });

  it("derives bounding box and box-relative points from raw coordinates", () => {
    const rawPoints = [
      { x: 50, y: 60 },
      { x: 80, y: 30 },
      { x: 120, y: 90 },
    ];
    const { boundingBox, points } = derivePenPathBoundingBox(rawPoints);

    expect(boundingBox).toEqual({ x: 50, y: 30, width: 70, height: 60 });
    expect(points).toEqual([
      { x: 0, y: 30 },
      { x: 30, y: 0 },
      { x: 70, y: 60 },
    ]);
  });

  it("scales points proportionally on box resize", () => {
    const prevBox = { x: 0, y: 0, width: 100, height: 100 };
    const nextBox = { x: 0, y: 0, width: 200, height: 300 };
    const points = [
      { x: 10, y: 20 },
      { x: 50, y: 60 },
    ];

    const scaled = scalePenPathPointsForBox(prevBox, nextBox, points);
    expect(scaled).toEqual([
      { x: 20, y: 60 },
      { x: 100, y: 180 },
    ]);
  });

  it("hit-tests proximity to polyline segments", () => {
    const box = { x: 0, y: 0, width: 100, height: 100 };
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 0 },
    ];

    // Near first segment
    expect(hitTestPenPath(box, points, { x: 25, y: 25 })).toBe(true);
    // Near second segment
    expect(hitTestPenPath(box, points, { x: 75, y: 25 })).toBe(true);
    // Far from both segments
    expect(hitTestPenPath(box, points, { x: 50, y: 0 })).toBe(false);
  });

  it("provides builtin capabilities mapping", () => {
    expect(BUILTIN_SHAPE_CAPABILITIES.rect).toBe(RECT_CAPABILITIES);
    expect(BUILTIN_SHAPE_CAPABILITIES["pen-path"]).toBe(PEN_PATH_CAPABILITIES);
  });
});
