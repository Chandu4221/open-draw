// Hit-testing behavior (R-015/R-016: picks are computed from the canonical
// document, never cached).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { DEFAULT_CAMERA } from "./camera";
import { HANDLES } from "./handles";
import { boxIntersectsBox, pickHandle, pickShape, pickShapesInBox, pointInBox } from "./hit-test";

const pageId = parseShapeId("page-1");
const firstId = parseShapeId("rect-first");
const secondId = parseShapeId("rect-second");

const document = createDocument([
  createPage(pageId, { x: 0, y: 0, width: 640, height: 480 }),
  createRect(firstId, { x: 10, y: 10, width: 50, height: 50 }, { parent: pageId }),
  createRect(secondId, { x: 30, y: 30, width: 50, height: 50 }, { parent: pageId }),
]);

describe("pointInBox", () => {
  it("detects a point inside a box", () => {
    expect(pointInBox({ x: 10, y: 10, width: 50, height: 50 }, { x: 20, y: 20 })).toBe(true);
  });

  it("treats the right and bottom edges as outside", () => {
    expect(pointInBox({ x: 10, y: 10, width: 50, height: 50 }, { x: 60, y: 10 })).toBe(false);
  });
});

describe("pickShape", () => {
  it("picks the topmost shape in walk order", () => {
    expect(pickShape(document, { x: 40, y: 40 })).toBe(secondId);
  });

  it("picks the only shape at an exclusive point", () => {
    expect(pickShape(document, { x: 15, y: 15 })).toBe(firstId);
  });

  it("returns null over empty canvas", () => {
    expect(pickShape(document, { x: 700, y: 10 })).toBe(null);
  });
});

describe("pickHandle", () => {
  it("picks a corner handle within the screen radius", () => {
    const box = { x: 10, y: 10, width: 50, height: 50 };
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 12, y: 8 })).toBe(HANDLES.nw);
  });

  it("picks an edge handle within the screen radius", () => {
    const box = { x: 10, y: 10, width: 50, height: 50 };
    // midX = 35, minY = 10 -> north handle
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 35, y: 10 })).toBe(HANDLES.n);
    // midX = 35, maxY = 60 -> south handle
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 35, y: 60 })).toBe(HANDLES.s);
    // minX = 10, midY = 35 -> west handle
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 10, y: 35 })).toBe(HANDLES.w);
    // maxX = 60, midY = 35 -> east handle
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 60, y: 35 })).toBe(HANDLES.e);
  });

  it("returns null outside the radius", () => {
    const box = { x: 10, y: 10, width: 50, height: 50 };
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 40, y: 40 })).toBe(null);
  });
});

describe("boxIntersectsBox (F3, ADR-0006 Option A)", () => {
  it("detects overlapping boxes", () => {
    const a = { x: 10, y: 10, width: 50, height: 50 };
    const b = { x: 40, y: 40, width: 50, height: 50 };
    expect(boxIntersectsBox(a, b)).toBe(true);
  });

  it("detects completely contained boxes", () => {
    const outer = { x: 0, y: 0, width: 100, height: 100 };
    const inner = { x: 20, y: 20, width: 30, height: 30 };
    expect(boxIntersectsBox(outer, inner)).toBe(true);
  });

  it("returns false for non-overlapping boxes", () => {
    const a = { x: 0, y: 0, width: 20, height: 20 };
    const b = { x: 50, y: 50, width: 20, height: 20 };
    expect(boxIntersectsBox(a, b)).toBe(false);
  });
});

describe("pickShapesInBox (F3, ADR-0006 Option A)", () => {
  it("picks shapes whose bounding boxes intersect the marquee box", () => {
    // Marquee intersects both rects inside page-1, but is enclosed by page-1
    const marquee = { x: 5, y: 5, width: 40, height: 40 };
    const picked = pickShapesInBox(document, marquee);
    expect(picked).toContain(firstId);
    expect(picked).toContain(secondId);
    expect(picked).not.toContain(pageId); // Enclosing page is not selected
  });

  it("returns empty array when marquee intersects no shapes", () => {
    const marquee = { x: 500, y: 500, width: 10, height: 10 };
    const picked = pickShapesInBox(document, marquee);
    expect(picked).toEqual([]);
  });
});
