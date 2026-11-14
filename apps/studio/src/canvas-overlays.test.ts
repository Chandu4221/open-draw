import { describe, expect, it } from "vitest";
import { ROOT_ID, SHAPE_KINDS, type ShapeId } from "@open-draw/canvas";
import { createDocument, type Shape } from "@open-draw/canvas";
import {
  computeSemanticChipOverlays,
  getRootContainerIds,
  hoverOutlineOverlayToSvg,
  pickAnyRootChip,
} from "./canvas-overlays";

describe("computeSemanticChipOverlays", () => {
  it("renders chip for root container when no platform is set", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 100, y: 100, width: 400, height: 300 },
      meta: { order: {} },
    };
    const doc = createDocument([rootShape]);

    const overlays = computeSemanticChipOverlays({
      doc,
      selectedIds: [],
      zoom: 1,
    });

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toContain("Container");
  });

  it("renders platform chip for root frame with platform set", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 50, y: 50, width: 375, height: 812 },
      meta: { platform: "web", order: {} },
    };
    const doc = createDocument([rootShape]);

    const overlays = computeSemanticChipOverlays({
      doc,
      selectedIds: [],
      zoom: 1,
    });

    expect(overlays).toHaveLength(1);
    expect(overlays[0]).toContain("Web");
  });

  it("renders child semantic chip when child is selected", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 500, height: 500 },
      meta: { platform: "web", order: {} },
    };
    const childShape: Shape = {
      id: "child-1" as ShapeId,
      parentId: "root-1" as ShapeId,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 20, y: 20, width: 100, height: 40 },
      meta: { semantic: { id: "button", platform: "web" }, order: {} },
    };
    const doc = createDocument([rootShape, childShape]);

    const overlays = computeSemanticChipOverlays({
      doc,
      selectedIds: [childShape.id],
      zoom: 1,
    });

    expect(overlays).toHaveLength(2);
    expect(overlays.some((o) => o.includes("Button"))).toBe(true);
  });

  it("renders child semantic chips when root is in visibleChipRootIds (enabled by default)", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 500, height: 500 },
      meta: { platform: "web", order: {} },
    };
    const childShape: Shape = {
      id: "child-1" as ShapeId,
      parentId: "root-1" as ShapeId,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 20, y: 20, width: 100, height: 40 },
      meta: { semantic: { id: "button", platform: "web" }, order: {} },
    };
    const doc = createDocument([rootShape, childShape]);

    const overlays = computeSemanticChipOverlays({
      doc,
      selectedIds: [],
      zoom: 1,
      visibleChipRootIds: new Set([rootShape.id]),
    });

    expect(overlays).toHaveLength(2);
    expect(overlays.some((o) => o.includes("Button"))).toBe(true);
  });

  it("renders hover outline when hoveredShapeId is provided and shape is not selected", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 500, height: 500 },
      meta: { order: {} },
    };
    const doc = createDocument([rootShape]);

    const overlays = computeSemanticChipOverlays({
      doc,
      selectedIds: [],
      zoom: 1,
      hoveredShapeId: rootShape.id,
    });

    expect(overlays.some((o) => o.includes("od-canvas-hover-outline"))).toBe(true);
  });

  it("does not render hover outline when hovered shape is already selected", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 500, height: 500 },
      meta: { order: {} },
    };
    const doc = createDocument([rootShape]);

    const overlays = computeSemanticChipOverlays({
      doc,
      selectedIds: [rootShape.id],
      zoom: 1,
      hoveredShapeId: rootShape.id,
    });

    expect(overlays.some((o) => o.includes("od-canvas-hover-outline"))).toBe(false);
  });

  it("does not render hover outline when hoveredShapeId does not exist in document", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 500, height: 500 },
      meta: { order: {} },
    };
    const doc = createDocument([rootShape]);

    const overlays = computeSemanticChipOverlays({
      doc,
      selectedIds: [],
      zoom: 1,
      hoveredShapeId: "non-existent" as ShapeId,
    });

    expect(overlays.some((o) => o.includes("od-canvas-hover-outline"))).toBe(false);
  });
});

describe("hoverOutlineOverlayToSvg", () => {
  it("generates an SVG rect with sky blue stroke and counter-scales stroke and dashes with zoom", () => {
    const box = { x: 10, y: 20, width: 100, height: 50 };
    const svg1 = hoverOutlineOverlayToSvg(box, 1);
    expect(svg1).toContain('stroke="#0ea5e9"');
    expect(svg1).toContain('stroke-width="1.5"');
    expect(svg1).toContain('stroke-dasharray="4.0 2.0"');
    expect(svg1).toContain('pointer-events="none"');

    const svg2 = hoverOutlineOverlayToSvg(box, 2);
    expect(svg2).toContain('stroke-width="0.8"');
    expect(svg2).toContain('stroke-dasharray="2.0 1.0"');
  });
});

describe("getRootContainerIds", () => {
  it("returns all root container IDs from a document (R-016, R-031)", () => {
    const rootShape1: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 400, height: 300 },
      meta: { order: {} },
    };
    const rootShape2: Shape = {
      id: "root-2" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 500, y: 0, width: 400, height: 300 },
      meta: { order: {} },
    };
    const childShape: Shape = {
      id: "child-1" as ShapeId,
      parentId: "root-1" as ShapeId,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 20, y: 20, width: 100, height: 40 },
      meta: { semantic: { id: "button", platform: "web" }, order: {} },
    };
    const doc = createDocument([rootShape1, rootShape2, childShape]);

    const ids = getRootContainerIds(doc);
    expect(ids).toEqual(["root-1", "root-2"]);
  });
});

describe("pickAnyRootChip", () => {
  it("detects hit on root platform chip above top-left corner", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 100, y: 100, width: 400, height: 300 },
      meta: { platform: "web", order: {} },
    };
    const doc = createDocument([rootShape]);

    const hit = pickAnyRootChip(doc, { x: 120, y: 88 }, 1);
    expect(hit).toBe("root-1");
  });

  it("returns null when clicking away from chip", () => {
    const rootShape: Shape = {
      id: "root-1" as ShapeId,
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 100, y: 100, width: 400, height: 300 },
      meta: { platform: "web", order: {} },
    };
    const doc = createDocument([rootShape]);

    const hit = pickAnyRootChip(doc, { x: 250, y: 250 }, 1);
    expect(hit).toBeNull();
  });
});
