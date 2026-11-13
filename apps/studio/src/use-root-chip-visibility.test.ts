import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/canvas";
import { createDocument, type Shape } from "@open-draw/canvas";
import { createCanvas } from "@open-draw/canvas";
import { syncVisibleChipRoots, toggleRootChip } from "./use-root-chip-visibility";

describe("use-root-chip-visibility pure operations (R-016, R-031)", () => {
  const root1: Shape = {
    id: parseShapeId("root-1"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 400, height: 300 },
    meta: { order: {} },
  };

  const child1: Shape = {
    id: parseShapeId("child-1"),
    parentId: parseShapeId("root-1"),
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 20, y: 20, width: 100, height: 40 },
    meta: { semantic: { id: "button", platform: "web" }, order: {} },
  };

  it("toggles root chip visibility off and records it in disabled set", () => {
    const canvas = createCanvas({ visibleChipRootIds: [parseShapeId("root-1")] });
    const disabledRoots = new Set([parseShapeId("dummy")]);
    disabledRoots.clear();

    const isNowVisible = toggleRootChip(parseShapeId("root-1"), canvas, disabledRoots);

    expect(isNowVisible).toBe(false);
    expect(canvas.isRootChipsVisible(parseShapeId("root-1"))).toBe(false);
    expect(disabledRoots.has(parseShapeId("root-1"))).toBe(true);

    // Toggle back on
    const isNowVisible2 = toggleRootChip(parseShapeId("root-1"), canvas, disabledRoots);
    expect(isNowVisible2).toBe(true);
    expect(canvas.isRootChipsVisible(parseShapeId("root-1"))).toBe(true);
    expect(disabledRoots.has(parseShapeId("root-1"))).toBe(false);
  });

  it("syncVisibleChipRoots automatically enables newly added root containers while respecting explicitly disabled ones", () => {
    const canvas = createCanvas({ visibleChipRootIds: [parseShapeId("root-1")] });
    const disabledRoots = new Set([parseShapeId("root-1")]);

    const root2: Shape = {
      id: parseShapeId("root-2"),
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 500, y: 0, width: 400, height: 300 },
      meta: { order: {} },
    };
    const nextDoc = createDocument([root1, child1, root2]);

    const visibleRoots = syncVisibleChipRoots(nextDoc, canvas, disabledRoots);

    expect(visibleRoots.has(parseShapeId("root-1"))).toBe(false);
    expect(visibleRoots.has(parseShapeId("root-2"))).toBe(true);
    expect(canvas.isRootChipsVisible(parseShapeId("root-2"))).toBe(true);
  });
});
