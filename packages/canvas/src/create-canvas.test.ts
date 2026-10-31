// Canvas controller behavior (R-004, R-015, ADR-0003).
import { describe, expect, it } from "vitest";
import { CAPABILITIES, type CapabilityId, parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { createCanvas } from "./create-canvas";
import { TOOLS } from "./tools";

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

  it("manages shape kind registrations and capability queries (ADR-0003 D1)", () => {
    const canvas = createCanvas();
    expect(canvas.hasCapability("custom:star", CAPABILITIES.movable)).toBe(false);

    canvas.registerShapeKind({
      kind: "custom:star",
      capabilities: [CAPABILITIES.movable, CAPABILITIES.resizable],
    });

    expect(canvas.hasCapability("custom:star", CAPABILITIES.movable)).toBe(true);
    expect(canvas.hasCapability("custom:star", CAPABILITIES.resizable)).toBe(true);
    expect(canvas.hasCapability("custom:star", CAPABILITIES.freehandPath)).toBe(false);
  });

  it("rejects duplicate shape kind registration with loud error", () => {
    const canvas = createCanvas({
      shapeKinds: [
        {
          kind: "custom:star",
          capabilities: [CAPABILITIES.movable],
        },
      ],
    });

    expect(() =>
      canvas.registerShapeKind({
        kind: "custom:star",
        capabilities: [CAPABILITIES.resizable],
      }),
    ).toThrow(/duplicate shape kind registration/);
  });

  it("rejects unknown capabilities in registration with loud error", () => {
    const canvas = createCanvas();
    expect(() =>
      canvas.registerShapeKind({
        kind: "custom:invalid",
        capabilities: ["bogus-capability" as unknown as CapabilityId],
      }),
    ).toThrow(/unknown capability/);
  });

  it("supports custom hit testing via registered shape kind", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(rectId, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
    ]);

    // Custom hit tester that rejects points in the upper half
    const canvas = createCanvas({
      shapeKinds: [
        {
          kind: "rect",
          capabilities: [CAPABILITIES.movable],
          hitTest: (box, _shape, point) =>
            point.x >= box.x &&
            point.x <= box.x + box.width &&
            point.y >= box.y + 50 &&
            point.y <= box.y + box.height,
        },
      ],
    });

    // Upper half (y = 20) is missed due to custom hit tester
    expect(canvas.pickShape(doc, { x: 50, y: 20 })).toBe(pageId);
    // Lower half (y = 70) is hit
    expect(canvas.pickShape(doc, { x: 50, y: 70 })).toBe(rectId);
  });

  it("exposes drawLine and drawPenPath in TOOLS registry", () => {
    expect(TOOLS.drawLine).toBe("draw-line");
    expect(TOOLS.drawPenPath).toBe("draw-pen-path");
  });
});
