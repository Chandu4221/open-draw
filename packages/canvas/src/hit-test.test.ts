// Hit-testing behavior (R-015/R-016: picks are computed from the canonical
// document, never cached).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { DEFAULT_CAMERA } from "./camera";
import { HANDLES } from "./handles";
import { pickHandle, pickShape, pointInBox } from "./hit-test";

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

  it("returns null outside the radius", () => {
    const box = { x: 10, y: 10, width: 50, height: 50 };
    expect(pickHandle(DEFAULT_CAMERA, box, { x: 40, y: 40 })).toBe(null);
  });
});
