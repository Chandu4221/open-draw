// Canvas controller behavior (R-004, R-015).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createCanvas } from "./create-canvas";

describe("createCanvas", () => {
  it("initializes with default camera and empty selection", () => {
    const canvas = createCanvas();
    expect(canvas.getCamera().zoom).toBe(1);
    expect(canvas.getSelectedId()).toBeNull();
  });

  it("updates selection", () => {
    const canvas = createCanvas();
    const id = parseShapeId("shape-1");
    canvas.select(id);
    expect(canvas.getSelectedId()).toBe(id);
    expect(canvas.isSelected(id)).toBe(true);

    canvas.clearSelection();
    expect(canvas.getSelectedId()).toBeNull();
  });

  it("delegates action resolution to @open-draw/input", () => {
    const canvas = createCanvas();
    expect(canvas.resolveAction({ code: "Escape" })).toBe("cancel");
    expect(canvas.resolveAction({ code: "KeyZ", ctrlKey: true })).toBe("undo");
  });
});
