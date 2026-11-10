// Tests for 2D STR R-Tree spatial index (R-015, ADR-0011).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import {
  buildSpatialIndexFromDocument,
  computeEnclosingSpatialBox,
  createSpatialIndex,
  pointInSpatialBox,
  querySpatialIndexBox,
  querySpatialIndexPoint,
  spatialBoxesIntersect,
  toSpatialBox,
  type SpatialIndexItem,
} from "./spatial-index";

describe("toSpatialBox and bounding utilities", () => {
  it("converts BoundingBox to min/max format correctly", () => {
    const box = { x: 10, y: 20, width: 30, height: 40 };
    expect(toSpatialBox(box)).toEqual({ minX: 10, minY: 20, maxX: 40, maxY: 60 });
  });

  it("detects box intersection correctly", () => {
    const a = { minX: 0, minY: 0, maxX: 50, maxY: 50 };
    const b = { minX: 25, minY: 25, maxX: 75, maxY: 75 };
    const c = { minX: 60, minY: 60, maxX: 100, maxY: 100 };
    expect(spatialBoxesIntersect(a, b)).toBe(true);
    expect(spatialBoxesIntersect(a, c)).toBe(false);
  });

  it("detects point containment with and without tolerance", () => {
    const box = { minX: 10, minY: 10, maxX: 50, maxY: 50 };
    expect(pointInSpatialBox(box, { x: 20, y: 20 })).toBe(true);
    expect(pointInSpatialBox(box, { x: 55, y: 20 })).toBe(false);
    expect(pointInSpatialBox(box, { x: 55, y: 20 }, 8)).toBe(true);
  });

  it("computes enclosing bounding box across multiple boxes", () => {
    const boxes = [
      { minX: 10, minY: 20, maxX: 30, maxY: 40 },
      { minX: 5, minY: 15, maxX: 50, maxY: 60 },
    ];
    expect(computeEnclosingSpatialBox(boxes)).toEqual({
      minX: 5,
      minY: 15,
      maxX: 50,
      maxY: 60,
    });
  });
});

describe("createSpatialIndex", () => {
  it("returns empty index for empty items array", () => {
    const index = createSpatialIndex([]);
    expect(index.root).toBeNull();
    expect(index.count).toBe(0);
  });

  it("creates single leaf root when count is within capacity", () => {
    const items: SpatialIndexItem[] = [
      { id: parseShapeId("s1"), box: { x: 10, y: 10, width: 20, height: 20 }, zIndex: 0 },
      { id: parseShapeId("s2"), box: { x: 50, y: 50, width: 30, height: 30 }, zIndex: 1 },
    ];
    const index = createSpatialIndex(items, 4);
    expect(index.count).toBe(2);
    expect(index.root).not.toBeNull();
    expect(index.root?.isLeaf).toBe(true);
    if (index.root?.isLeaf) {
      expect(index.root.items).toHaveLength(2);
      expect(index.root.box).toEqual({ minX: 10, minY: 10, maxX: 80, maxY: 80 });
    }
  });

  it("partitions items into multi-level tree when count exceeds capacity", () => {
    const items: SpatialIndexItem[] = [];
    for (let i = 0; i < 25; i += 1) {
      items.push({
        id: parseShapeId(`shape-${i}`),
        box: { x: (i % 5) * 40, y: Math.floor(i / 5) * 40, width: 30, height: 30 },
        zIndex: i,
      });
    }

    const index = createSpatialIndex(items, 4);
    expect(index.count).toBe(25);
    expect(index.root?.isLeaf).toBe(false);
  });
});

describe("querySpatialIndexPoint", () => {
  it("returns empty array when index is empty", () => {
    const index = createSpatialIndex([]);
    expect(querySpatialIndexPoint(index, { x: 10, y: 10 })).toEqual([]);
  });

  it("finds all shapes covering a point and orders by zIndex descending", () => {
    const items: SpatialIndexItem[] = [
      { id: parseShapeId("bottom"), box: { x: 0, y: 0, width: 100, height: 100 }, zIndex: 0 },
      { id: parseShapeId("middle"), box: { x: 10, y: 10, width: 50, height: 50 }, zIndex: 1 },
      { id: parseShapeId("top"), box: { x: 20, y: 20, width: 30, height: 30 }, zIndex: 2 },
      { id: parseShapeId("other"), box: { x: 200, y: 200, width: 50, height: 50 }, zIndex: 3 },
    ];

    const index = createSpatialIndex(items, 2);
    const hits = querySpatialIndexPoint(index, { x: 25, y: 25 });
    expect(hits.map((h) => h.id)).toEqual([
      parseShapeId("top"),
      parseShapeId("middle"),
      parseShapeId("bottom"),
    ]);
  });

  it("returns empty array when query point is in empty space", () => {
    const items: SpatialIndexItem[] = [
      { id: parseShapeId("s1"), box: { x: 10, y: 10, width: 20, height: 20 }, zIndex: 0 },
    ];
    const index = createSpatialIndex(items, 4);
    expect(querySpatialIndexPoint(index, { x: 500, y: 500 })).toEqual([]);
  });
});

describe("querySpatialIndexBox", () => {
  it("returns intersecting items across multi-level tree", () => {
    const items: SpatialIndexItem[] = [
      { id: parseShapeId("s1"), box: { x: 0, y: 0, width: 50, height: 50 }, zIndex: 0 },
      { id: parseShapeId("s2"), box: { x: 40, y: 40, width: 50, height: 50 }, zIndex: 1 },
      { id: parseShapeId("s3"), box: { x: 200, y: 200, width: 50, height: 50 }, zIndex: 2 },
    ];
    const index = createSpatialIndex(items, 2);

    const hits = querySpatialIndexBox(index, { x: 30, y: 30, width: 20, height: 20 });
    const hitIds = hits.map((h) => h.id);
    expect(hitIds).toContain(parseShapeId("s1"));
    expect(hitIds).toContain(parseShapeId("s2"));
    expect(hitIds).not.toContain(parseShapeId("s3"));
  });
});

describe("buildSpatialIndexFromDocument", () => {
  it("builds index from canonical document with correct zIndex ordering", () => {
    const pageId = parseShapeId("page-1");
    const rectA = parseShapeId("rect-a");
    const rectB = parseShapeId("rect-b");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(rectA, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
      createRect(rectB, { x: 50, y: 50, width: 100, height: 100 }, { parent: pageId }),
    ]);

    const index = buildSpatialIndexFromDocument(doc);
    expect(index.count).toBe(3);

    const hits = querySpatialIndexPoint(index, { x: 60, y: 60 });
    expect(hits[0]?.id).toBe(rectB);
    expect(hits[1]?.id).toBe(rectA);
    expect(hits[2]?.id).toBe(pageId);
  });
});
