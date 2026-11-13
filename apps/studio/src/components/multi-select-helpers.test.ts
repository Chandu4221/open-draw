import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/canvas";
import type { Shape } from "@open-draw/canvas";
import { computeSharedStyles, toColorInputValue } from "./multi-select-helpers";

function createMockShape(
  id: string,
  style?: { fill?: string; stroke?: string; strokeWidth?: number },
): Shape {
  return {
    id: parseShapeId(id),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    meta: { order: {} },
    ...style,
  };
}

describe("multi-select-helpers", () => {
  it("returns undefined styles for empty selection", () => {
    const result = computeSharedStyles([]);
    expect(result.fill).toBeUndefined();
    expect(result.isFillMixed).toBe(false);
    expect(result.stroke).toBeUndefined();
    expect(result.isStrokeMixed).toBe(false);
    expect(result.strokeWidth).toBeUndefined();
    expect(result.isStrokeWidthMixed).toBe(false);
  });

  it("extracts common styles when all shapes share fill, stroke, and strokeWidth", () => {
    const s1 = createMockShape("s1", { fill: "#112233", stroke: "#445566", strokeWidth: 3 });
    const s2 = createMockShape("s2", { fill: "#112233", stroke: "#445566", strokeWidth: 3 });

    const result = computeSharedStyles([s1, s2]);
    expect(result.fill).toBe("#112233");
    expect(result.isFillMixed).toBe(false);
    expect(result.stroke).toBe("#445566");
    expect(result.isStrokeMixed).toBe(false);
    expect(result.strokeWidth).toBe(3);
    expect(result.isStrokeWidthMixed).toBe(false);
  });

  it("detects mixed styles when shapes have differing properties", () => {
    const s1 = createMockShape("s1", { fill: "#111111", stroke: "#000000", strokeWidth: 2 });
    const s2 = createMockShape("s2", { fill: "#222222", stroke: "#000000", strokeWidth: 4 });

    const result = computeSharedStyles([s1, s2]);
    expect(result.fill).toBeUndefined();
    expect(result.isFillMixed).toBe(true);
    expect(result.stroke).toBe("#000000");
    expect(result.isStrokeMixed).toBe(false);
    expect(result.strokeWidth).toBeUndefined();
    expect(result.isStrokeWidthMixed).toBe(true);
  });

  it("safely falls back for toColorInputValue", () => {
    expect(toColorInputValue("#abcdef", "#ffffff")).toBe("#abcdef");
    expect(toColorInputValue("invalid", "#ffffff")).toBe("#ffffff");
    expect(toColorInputValue(undefined, "#000000")).toBe("#000000");
  });
});
