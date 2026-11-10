// Hit-testing behavior (R-015/R-016: picks are computed from the canonical
// document, never cached).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect, type Shape } from "@open-draw/document";
import { DEFAULT_CAMERA } from "./camera";
import { HANDLES } from "./handles";
import {
  boxIntersectsBox,
  pickHandle,
  pickShape,
  pickShapesInBox,
  pointInBox,
  resolveSelectionDrillDown,
} from "./hit-test";
import { buildSpatialIndexFromDocument } from "./spatial/spatial-index";

const pageId = parseShapeId("page-1");
const firstId = parseShapeId("rect-first");
const secondId = parseShapeId("rect-second");
const grandchildId = parseShapeId("rect-grandchild");

const document = createDocument([
  createPage(pageId, { x: 0, y: 0, width: 640, height: 480 }),
  createRect(firstId, { x: 10, y: 10, width: 50, height: 50 }, { parent: pageId }),
  createRect(secondId, { x: 30, y: 30, width: 50, height: 50 }, { parent: pageId }),
  createRect(grandchildId, { x: 25, y: 25, width: 20, height: 20 }, { parent: firstId }),
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

describe("resolveSelectionDrillDown (Idea 5, Milestone 09)", () => {
  it("selects top-level root container on single-click when nothing is selected", () => {
    // Clicking on grandchild or child selects page-1 (root container)
    expect(resolveSelectionDrillDown(document, grandchildId, null, false)).toBe(pageId);
    expect(resolveSelectionDrillDown(document, firstId, null, false)).toBe(pageId);
  });

  it("selects root shape directly on single-click", () => {
    expect(resolveSelectionDrillDown(document, pageId, null, false)).toBe(pageId);
  });

  it("retains root container on single-click when root is already selected", () => {
    expect(resolveSelectionDrillDown(document, grandchildId, pageId, false)).toBe(pageId);
  });

  it("drills into direct child on double-click from unselected or root-selected state", () => {
    expect(resolveSelectionDrillDown(document, grandchildId, null, true)).toBe(firstId);
    expect(resolveSelectionDrillDown(document, grandchildId, pageId, true)).toBe(firstId);
  });

  it("drills into grandchild on second double-click when child is selected", () => {
    expect(resolveSelectionDrillDown(document, grandchildId, firstId, true)).toBe(grandchildId);
  });

  it("selects sibling shape on single-click when already drilled to child depth", () => {
    expect(resolveSelectionDrillDown(document, secondId, firstId, false)).toBe(secondId);
  });

  it("does not skip intermediate containers when drilling down across different branches (B3)", () => {
    const secA = parseShapeId("sec-a");
    const cardA = parseShapeId("card-a");
    const btnA = parseShapeId("btn-a");
    const secB = parseShapeId("sec-b");
    const cardB = parseShapeId("card-b");
    const btnB = parseShapeId("btn-b");

    const multiBranchDoc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createRect(secA, { x: 10, y: 10, width: 400, height: 400 }, { parent: pageId }),
      createRect(cardA, { x: 20, y: 20, width: 200, height: 200 }, { parent: secA }),
      createRect(btnA, { x: 30, y: 30, width: 100, height: 50 }, { parent: cardA }),
      createRect(secB, { x: 500, y: 10, width: 400, height: 400 }, { parent: pageId }),
      createRect(cardB, { x: 520, y: 20, width: 200, height: 200 }, { parent: secB }),
      createRect(btnB, { x: 530, y: 30, width: 100, height: 50 }, { parent: cardB }),
    ]);

    expect(resolveSelectionDrillDown(multiBranchDoc, btnB, btnA, true)).toBe(secB);
  });
});

describe("Differential Fuzz: Spatial Index vs Brute Force Equivalence (ADR-0011)", () => {
  it("yields 100% equivalent results across 100+ randomized shapes for pickShape and pickShapesInBox", () => {
    const parentPage = parseShapeId("fuzz-page");
    const shapes: Shape[] = [createPage(parentPage, { x: 0, y: 0, width: 4000, height: 4000 })];

    // Seed 120 deterministic shapes with varying positions and overlaps
    for (let i = 1; i <= 120; i += 1) {
      const x = ((i * 73) % 2000) + 20;
      const y = ((i * 109) % 2000) + 20;
      const width = ((i * 37) % 150) + 30;
      const height = ((i * 53) % 150) + 30;
      shapes.push(
        createRect(parseShapeId(`fuzz-rect-${i}`), { x, y, width, height }, { parent: parentPage }),
      );
    }

    const doc = createDocument(shapes);
    const spatialIndex = buildSpatialIndexFromDocument(doc);

    // 1. Point hit-test equivalence across 60 probe points
    for (let p = 1; p <= 60; p += 1) {
      const probePoint = {
        x: (p * 97) % 2200,
        y: (p * 131) % 2200,
      };
      const bruteHit = pickShape(doc, probePoint);
      const indexHit = pickShape(doc, probePoint, undefined, spatialIndex);
      expect(indexHit).toBe(bruteHit);
    }

    // 2. Box query equivalence across 20 probe boxes
    for (let b = 1; b <= 20; b += 1) {
      const probeBox = {
        x: (b * 127) % 1800,
        y: (b * 163) % 1800,
        width: ((b * 41) % 300) + 50,
        height: ((b * 59) % 300) + 50,
      };
      const bruteHits = pickShapesInBox(doc, probeBox);
      const indexHits = pickShapesInBox(doc, probeBox, spatialIndex);

      expect(new Set(indexHits)).toEqual(new Set(bruteHits));
    }
  });
});
