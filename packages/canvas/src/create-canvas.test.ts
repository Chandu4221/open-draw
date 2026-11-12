// Canvas controller behavior (R-004, R-015, ADR-0003).
import { describe, expect, it } from "vitest";
import {
  CAPABILITIES,
  type CapabilityId,
  DEVICE_TYPES,
  parseShapeId,
  SHAPE_KINDS,
} from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { createCanvas } from "./create-canvas";
import { CONTROLLER_EVENTS } from "./events";
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

  it("supports multi-selection with selectMany and toggleSelection (F3, ADR-0006 Option A)", () => {
    const canvas = createCanvas();
    const id1 = parseShapeId("shape-1");
    const id2 = parseShapeId("shape-2");
    const id3 = parseShapeId("shape-3");

    canvas.selectMany([id1, id2]);
    expect(canvas.getSelectedIds()).toEqual([id1, id2]);
    expect(canvas.getSelectedId()).toBeNull();
    expect(canvas.isSelected(id1)).toBe(true);
    expect(canvas.isSelected(id2)).toBe(true);
    expect(canvas.isSelected(id3)).toBe(false);

    // Toggle on
    canvas.toggleSelection(id3);
    expect(canvas.isSelected(id3)).toBe(true);
    expect(canvas.getSelectedIds()).toContain(id3);

    // Toggle off
    canvas.toggleSelection(id1);
    expect(canvas.isSelected(id1)).toBe(false);
    expect(canvas.getSelectedIds()).not.toContain(id1);
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

  it("exposes drawLine, drawPenPath, and drawText in TOOLS registry", () => {
    expect(TOOLS.drawLine).toBe("draw-line");
    expect(TOOLS.drawPenPath).toBe("draw-pen-path");
    expect(TOOLS.drawText).toBe("draw-text");
  });

  it("tracks activeDeviceType view state", () => {
    const canvas = createCanvas();
    expect(canvas.getActiveDeviceType()).toBeUndefined();

    canvas.setActiveDeviceType(DEVICE_TYPES.mobile);
    expect(canvas.getActiveDeviceType()).toBe(DEVICE_TYPES.mobile);

    canvas.setActiveDeviceType(undefined);
    expect(canvas.getActiveDeviceType()).toBeUndefined();

    const canvasWithInit = createCanvas({ activeDeviceType: DEVICE_TYPES.tablet });
    expect(canvasWithInit.getActiveDeviceType()).toBe(DEVICE_TYPES.tablet);
  });

  it("tracks scoped activeDeviceTypes per root shape (Issues C1, C2)", () => {
    const root1 = parseShapeId("root-1");
    const root2 = parseShapeId("root-2");

    const canvas = createCanvas({
      activeDeviceType: DEVICE_TYPES.desktop,
      activeDeviceTypes: { [root1]: DEVICE_TYPES.mobile },
    });

    // root1 returns scoped value
    expect(canvas.getActiveDeviceType(root1)).toBe(DEVICE_TYPES.mobile);
    // root2 falls back to global activeDeviceType
    expect(canvas.getActiveDeviceType(root2)).toBe(DEVICE_TYPES.desktop);
    // undefined root falls back to global
    expect(canvas.getActiveDeviceType()).toBe(DEVICE_TYPES.desktop);

    // Set scoped device type on root2
    canvas.setActiveDeviceType(DEVICE_TYPES.tablet, root2);
    expect(canvas.getActiveDeviceType(root2)).toBe(DEVICE_TYPES.tablet);
    expect(canvas.getActiveDeviceTypes()).toEqual({
      [root1]: DEVICE_TYPES.mobile,
      [root2]: DEVICE_TYPES.tablet,
    });

    // Clear scoped device type on root1
    canvas.setActiveDeviceType(undefined, root1);
    expect(canvas.getActiveDeviceType(root1)).toBe(DEVICE_TYPES.desktop);
  });

  it("manages visible root chip state as transient view state (R-016, R-031)", () => {
    const canvas = createCanvas();
    expect(canvas.getVisibleChipRootIds().size).toBe(0);

    const rootA = parseShapeId("root-a");
    const rootB = parseShapeId("root-b");

    expect(canvas.isRootChipsVisible(rootA)).toBe(false);

    canvas.toggleRootChipsVisible(rootA);
    expect(canvas.isRootChipsVisible(rootA)).toBe(true);
    expect(canvas.getVisibleChipRootIds().has(rootA)).toBe(true);

    canvas.toggleRootChipsVisible(rootA);
    expect(canvas.isRootChipsVisible(rootA)).toBe(false);

    canvas.setRootChipsVisible(rootB, true);
    expect(canvas.isRootChipsVisible(rootB)).toBe(true);

    canvas.setRootChipsVisible(rootB, false);
    expect(canvas.isRootChipsVisible(rootB)).toBe(false);

    const canvasWithInit = createCanvas({ visibleChipRootIds: [rootA] });
    expect(canvasWithInit.isRootChipsVisible(rootA)).toBe(true);
  });

  it("registers built-in shape kinds by default when options.shapeKinds is omitted (ADR-0008 D4)", () => {
    const canvas = createCanvas();
    expect(canvas.hasCapability(SHAPE_KINDS.rect, CAPABILITIES.movable)).toBe(true);
    expect(canvas.hasCapability(SHAPE_KINDS.rect, CAPABILITIES.resizable)).toBe(true);
    expect(canvas.hasCapability(SHAPE_KINDS.ellipse, CAPABILITIES.movable)).toBe(true);
    expect(canvas.hasCapability(SHAPE_KINDS.line, CAPABILITIES.movable)).toBe(true);
    expect(canvas.hasCapability(SHAPE_KINDS.penPath, CAPABILITIES.freehandPath)).toBe(true);
    expect(canvas.hasCapability(SHAPE_KINDS.text, CAPABILITIES.textLabel)).toBe(true);
  });

  it("hit-tests built-in shapes out of the box without manual registration (ADR-0008 D4)", () => {
    const canvas = createCanvas();
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(rectId, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
    ]);

    expect(canvas.pickShape(doc, { x: 50, y: 50 })).toBe(rectId);
    expect(canvas.pickShape(doc, { x: 200, y: 200 })).toBe(pageId);
    expect(canvas.pickShape(doc, { x: 600, y: 600 })).toBeNull();
  });

  it("emits selectionChanged on select, selectMany, and clearSelection (R-019)", () => {
    const canvas = createCanvas();
    let calls = 0;
    const unsubscribe = canvas.subscribe(CONTROLLER_EVENTS.selectionChanged, () => {
      calls += 1;
    });

    const id1 = parseShapeId("shape-1");
    canvas.select(id1);
    expect(calls).toBe(1);

    canvas.clearSelection();
    expect(calls).toBe(2);

    unsubscribe();
    canvas.select(id1);
    expect(calls).toBe(2);
  });

  it("supports documentChanged and historyChanged events (R-019)", () => {
    const canvas = createCanvas();
    let docCalls = 0;
    let historyCalls = 0;

    canvas.subscribe(CONTROLLER_EVENTS.documentChanged, () => {
      docCalls += 1;
    });
    canvas.subscribe(CONTROLLER_EVENTS.historyChanged, () => {
      historyCalls += 1;
    });

    canvas.emit(CONTROLLER_EVENTS.documentChanged);
    expect(docCalls).toBe(1);
    expect(historyCalls).toBe(0);

    canvas.emit(CONTROLLER_EVENTS.historyChanged);
    expect(docCalls).toBe(1);
    expect(historyCalls).toBe(1);
  });

  it("resolves selection drill-down through controller (Idea 5, Milestone 09)", () => {
    const canvas = createCanvas();
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(rectId, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
    ]);

    // Single click unselected: selects root
    expect(canvas.resolveSelectionDrillDown(doc, rectId, false)).toBe(pageId);
    expect(canvas.resolveSelectionDrillDown(doc, rectId, true)).toBe(rectId);
  });

  it("emits cameraChanged event when camera is modified (R-019)", () => {
    const canvas = createCanvas();
    let calls = 0;
    canvas.subscribe(CONTROLLER_EVENTS.cameraChanged, () => {
      calls += 1;
    });
    canvas.setCamera({ x: 50, y: 50, zoom: 2 });
    expect(calls).toBe(1);
    canvas.panBy({ x: 10, y: 10 });
    expect(calls).toBe(2);
    canvas.zoomAt({ x: 0, y: 0 }, 1.5);
    expect(calls).toBe(3);
  });

  it("caches spatial index for same document and re-indexes on new document (ADR-0011)", () => {
    const canvas = createCanvas();
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc1 = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(rectId, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
    ]);

    const index1 = canvas.getSpatialIndex(doc1);
    const index2 = canvas.getSpatialIndex(doc1);
    expect(index1).toBe(index2);
    expect(index1.count).toBe(2);

    const doc2 = createDocument([createPage(pageId, { x: 0, y: 0, width: 500, height: 500 })]);
    const index3 = canvas.getSpatialIndex(doc2);
    expect(index3).not.toBe(index1);
    expect(index3.count).toBe(1);
  });

  it("preserves cached spatial index when document changes only non-spatial properties (ADR-0011)", () => {
    const canvas = createCanvas();
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc1 = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(rectId, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
    ]);

    const index1 = canvas.getSpatialIndex(doc1);

    const doc2 = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      {
        ...createRect(rectId, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
        label: "Updated Label",
        fill: "#ff0000",
      },
    ]);

    const index2 = canvas.getSpatialIndex(doc2);
    expect(index2).toBe(index1);
  });

  it("performs marquee box picking through spatial index via canvas.pickShapesInBox (ADR-0011)", () => {
    const canvas = createCanvas();
    const pageId = parseShapeId("page-1");
    const rect1 = parseShapeId("rect-1");
    const rect2 = parseShapeId("rect-2");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(rect1, { x: 10, y: 10, width: 50, height: 50 }, { parent: pageId }),
      createRect(rect2, { x: 100, y: 100, width: 50, height: 50 }, { parent: pageId }),
    ]);

    const picked = canvas.pickShapesInBox(doc, { x: 5, y: 5, width: 40, height: 40 });
    expect(picked).toEqual([rect1]);
  });

  it("defers event emission during nested batch scopes until outermost scope exits (R-018)", () => {
    const canvas = createCanvas();
    let docEvents = 0;
    let selEvents = 0;
    canvas.subscribe(CONTROLLER_EVENTS.documentChanged, () => docEvents++);
    canvas.subscribe(CONTROLLER_EVENTS.selectionChanged, () => selEvents++);

    canvas.batch(() => {
      canvas.emit(CONTROLLER_EVENTS.documentChanged);
      expect(docEvents).toBe(0);

      // Nested batch scope
      canvas.batch(() => {
        canvas.emit(CONTROLLER_EVENTS.selectionChanged);
        canvas.emit(CONTROLLER_EVENTS.documentChanged);
        expect(docEvents).toBe(0);
        expect(selEvents).toBe(0);
      });

      // Still inside outer batch
      expect(docEvents).toBe(0);
      expect(selEvents).toBe(0);
    });

    // Both emitted once upon outer batch exit
    expect(docEvents).toBe(1);
    expect(selEvents).toBe(1);
  });

  it("supports explicit invalidateSpatialIndex on CanvasController (ADR-0011)", () => {
    const canvas = createCanvas();
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(rectId, { x: 10, y: 10, width: 100, height: 100 }, { parent: pageId }),
    ]);

    const index1 = canvas.getSpatialIndex(doc);
    expect(canvas.getSpatialIndex(doc)).toBe(index1);

    canvas.invalidateSpatialIndex();
    const index2 = canvas.getSpatialIndex(doc);
    expect(index2).not.toBe(index1);
    expect(index2.count).toBe(2);
  });
});
