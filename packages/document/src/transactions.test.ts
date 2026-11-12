import { describe, expect, it } from "vitest";
import { EMPTY_HISTORY, redo, recordHistory, undo } from "./history";
import { DocumentError } from "./errors";
import { createPage, createRect, createSection } from "./shape";
import { COMMANDS, type Command } from "./commands";
import { applyTransaction, createTransaction } from "./transactions";
import { createDocument } from "./document";
import type { Document } from "./document";
import type { Shape } from "./shape";
import {
  DEVICE_TYPES,
  DESIGN_STYLES,
  parseShapeId,
  PLATFORMS,
  ROOT_ROLES,
  STYLE_PROFILES,
} from "@open-draw/contracts";

const empty = createDocument();

const page = createPage(parseShapeId("page-1"), { x: 0, y: 0, width: 1440, height: 900 });
function withShapes(shapes: readonly Shape[]): Document {
  return createDocument(shapes);
}

describe("applyTransaction", () => {
  it("creates a shape and reports a delete as its inverse", () => {
    const create = createTransaction([{ type: COMMANDS.createShape, shape: page }]);
    const result = applyTransaction(empty, create);
    expect(result.document.shapes[parseShapeId("page-1")]?.kind).toBe("page");
    expect(result.inverse).toEqual([{ type: COMMANDS.deleteShape, id: "page-1" }]);
  });

  it("rejects an empty transaction", () => {
    expect(() => createTransaction([])).toThrow(DocumentError);
  });

  it("rejects creating a duplicate id", () => {
    const once = applyTransaction(
      empty,
      createTransaction([{ type: COMMANDS.createShape, shape: page }]),
    );
    expect(() =>
      applyTransaction(
        once.document,
        createTransaction([{ type: COMMANDS.createShape, shape: page }]),
      ),
    ).toThrow(DocumentError);
  });

  it("deletes a subtree and recreates it on undo, then removes it again on redo", () => {
    const section = createSection(
      parseShapeId("section-1"),
      { x: 0, y: 0, width: 1400, height: 120 },
      "column",
      {
        parent: parseShapeId("page-1"),
      },
    );
    const rect = createRect(
      parseShapeId("rect-1"),
      { x: 0, y: 0, width: 100, height: 50 },
      {
        parent: parseShapeId("section-1"),
        label: "Button",
      },
    );
    const built = withShapes([page, section, rect]);

    const removed = applyTransaction(
      built,
      createTransaction([{ type: COMMANDS.deleteShape, id: parseShapeId("section-1") }]),
    );
    expect(removed.document.shapes[parseShapeId("section-1")]).toBeUndefined();
    expect(removed.document.shapes[parseShapeId("rect-1")]).toBeUndefined();

    let history = recordHistory(EMPTY_HISTORY, removed.inverse);
    const undone = undo(removed.document, history);
    expect(undone?.document.shapes[parseShapeId("rect-1")]?.label).toBe("Button");
    expect(undone?.document.shapes[parseShapeId("rect-1")]?.parentId).toBe("section-1");

    history = undone!.history;
    const redone = redo(undone!.document, history);
    expect(redone?.document.shapes[parseShapeId("rect-1")]).toBeUndefined();
  });

  it("restores the previous label through set/undo", () => {
    const section = createSection(
      parseShapeId("section-1"),
      { x: 0, y: 0, width: 100, height: 100 },
      "row",
      { parent: parseShapeId("page-1") },
    );
    const labeled = createRect(
      parseShapeId("rect-1"),
      { x: 0, y: 0, width: 10, height: 10 },
      { parent: parseShapeId("section-1"), label: "Old" },
    );
    const built = withShapes([page, section, labeled]);

    const renamed = applyTransaction(
      built,
      createTransaction([
        { type: COMMANDS.setShapeLabel, id: parseShapeId("rect-1"), label: "New" },
      ]),
    );
    expect(renamed.document.shapes[parseShapeId("rect-1")]?.label).toBe("New");

    const undone = undo(renamed.document, recordHistory(EMPTY_HISTORY, renamed.inverse));
    expect(undone?.document.shapes[parseShapeId("rect-1")]?.label).toBe("Old");
  });

  it("rejects a reparent that would create a cycle", () => {
    const section = createSection(
      parseShapeId("section-1"),
      { x: 0, y: 0, width: 100, height: 100 },
      "row",
      { parent: parseShapeId("page-1") },
    );
    const built = withShapes([page, section]);
    expect(() =>
      applyTransaction(
        built,
        createTransaction([
          {
            type: COMMANDS.reparentShape,
            id: parseShapeId("page-1"),
            parentId: parseShapeId("section-1"),
            boundingBox: page.boundingBox,
          },
        ]),
      ),
    ).toThrow(DocumentError);
  });

  it("moves a shape as one batch and undoes without reordering siblings", () => {
    const pageId = parseShapeId("page-1");
    const firstId = parseShapeId("rect-first");
    const secondId = parseShapeId("rect-second");
    const built = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 640, height: 480 }),
      createRect(firstId, { x: 10, y: 10, width: 20, height: 20 }, { parent: pageId }),
      createRect(secondId, { x: 50, y: 10, width: 20, height: 20 }, { parent: pageId }),
    ]);

    const moved = applyTransaction(
      built,
      createTransaction([{ type: COMMANDS.moveShapes, ids: [firstId], dx: 5, dy: 5 }]),
    );
    expect(moved.document.shapes[firstId]?.boundingBox.x).toBe(15);

    const undone = undo(moved.document, recordHistory(EMPTY_HISTORY, moved.inverse));
    expect(undone?.document.shapes[firstId]?.boundingBox.x).toBe(10);
    // z-order preserved (review finding): moving must not pop the shape to the
    // top of the stack.
    const order = Object.keys(undone?.document.shapes ?? {});
    expect(order.indexOf("rect-first")).toBeLessThan(order.indexOf("rect-second"));
  });

  it("resizes a shape and restores the previous box on undo", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const built = createDocument([
      createPage(pageId, { x: 100, y: 100, width: 640, height: 480 }),
      createRect(rectId, { x: 10, y: 10, width: 50, height: 30 }, { parent: pageId }),
    ]);

    const resized = applyTransaction(
      built,
      createTransaction([
        {
          type: COMMANDS.setShapeBoundingBox,
          id: rectId,
          boundingBox: { x: 10, y: 10, width: 80, height: 60 },
        },
      ]),
    );
    expect(resized.document.shapes[rectId]?.boundingBox.width).toBe(80);

    const undone = undo(resized.document, recordHistory(EMPTY_HISTORY, resized.inverse));
    expect(undone?.document.shapes[rectId]?.boundingBox).toEqual({
      x: 10,
      y: 10,
      width: 50,
      height: 30,
    });
  });

  it("bounds undo history depth to prevent unbounded memory growth", () => {
    let history = EMPTY_HISTORY;
    for (let i = 0; i < 105; i++) {
      history = recordHistory(history, [
        { type: COMMANDS.moveShapes, ids: [parseShapeId("rect-1")], dx: 1, dy: 1 },
      ]);
    }
    expect(history.undoStack.length).toBe(100);
  });

  it("respects custom maxDepth when specified", () => {
    let history = EMPTY_HISTORY;
    for (let i = 0; i < 10; i++) {
      history = recordHistory(
        history,
        [{ type: COMMANDS.moveShapes, ids: [parseShapeId("rect-1")], dx: 1, dy: 1 }],
        3,
      );
    }
    expect(history.undoStack.length).toBe(3);
  });

  it("applies large command batch in linear time without quadratic re-validation", () => {
    const emptyDoc = createDocument([]);
    const pageId = parseShapeId("perf-page");
    const commands: Command[] = [
      {
        type: COMMANDS.createShape,
        shape: createPage(pageId, { x: 0, y: 0, width: 2000, height: 2000 }),
      },
    ];
    for (let i = 0; i < 1000; i++) {
      commands.push({
        type: COMMANDS.createShape,
        shape: createRect(
          parseShapeId(`r-${i}`),
          { x: 10, y: 10, width: 20, height: 20 },
          { parent: pageId },
        ),
      });
    }
    const tx = createTransaction(commands);
    const start = Date.now();
    const result = applyTransaction(emptyDoc, tx);
    const duration = Date.now() - start;
    expect(Object.keys(result.document.shapes)).toHaveLength(1001);
    expect(duration).toBeLessThan(250);
  });

  it("returns an empty inverse and preserves shape instances when applying no-op commands (R-018)", () => {
    const pageId = parseShapeId("page-1");
    const rectId = parseShapeId("rect-1");
    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 500, height: 500 }),
      createRect(
        rectId,
        { x: 10, y: 10, width: 100, height: 100 },
        { parent: pageId, label: "Title" },
      ),
    ]);

    const tx = createTransaction([
      { type: COMMANDS.setShapeLabel, id: rectId, label: "Title" },
      { type: COMMANDS.moveShapes, ids: [rectId], dx: 0, dy: 0 },
      { type: COMMANDS.setShapeStyle, id: rectId },
    ]);
    const result = applyTransaction(doc, tx);
    expect(result.inverse).toEqual([]);
    expect(result.document.shapes[rectId]).toBe(doc.shapes[rectId]);
  });

  it("short-circuits no-op mutations for semantic, order, hiddenOn, root meta, and reparent (R-018)", () => {
    const pageId = parseShapeId("page-meta");
    const rectId = parseShapeId("rect-meta");
    const pageShape = {
      ...createPage(pageId, { x: 0, y: 0, width: 600, height: 600 }),
      meta: {
        order: {},
        platform: PLATFORMS.web,
        style: STYLE_PROFILES.minimal,
        designStyle: DESIGN_STYLES.neoBrutalism,
        role: ROOT_ROLES.component,
        theme: { primary: "#0055ff", surface: "#ffffff" },
        darkMode: true,
      },
    };
    const rectShape = {
      ...createRect(rectId, { x: 20, y: 20, width: 80, height: 80 }, { parent: pageId }),
      meta: {
        order: { [DEVICE_TYPES.mobile]: 2 },
        hiddenOn: [DEVICE_TYPES.mobile],
        semantic: { id: "btn", platform: PLATFORMS.web, properties: { variant: "filled" } },
      },
    };
    const doc = createDocument([pageShape, rectShape]);

    const tx = createTransaction([
      {
        type: COMMANDS.setShapeSemantic,
        id: rectId,
        semantic: { id: "btn", platform: PLATFORMS.web, properties: { variant: "filled" } },
      },
      { type: COMMANDS.setShapeOrder, id: rectId, deviceType: DEVICE_TYPES.mobile, order: 2 },
      { type: COMMANDS.setShapeHiddenOn, id: rectId, hiddenOn: [DEVICE_TYPES.mobile] },
      { type: COMMANDS.setRootPlatform, id: pageId, platform: PLATFORMS.web },
      { type: COMMANDS.setRootStyle, id: pageId, style: STYLE_PROFILES.minimal },
      { type: COMMANDS.setRootDesignStyle, id: pageId, designStyle: DESIGN_STYLES.neoBrutalism },
      { type: COMMANDS.setRootRole, id: pageId, role: ROOT_ROLES.component },
      {
        type: COMMANDS.setRootTheme,
        id: pageId,
        theme: { primary: "#0055ff", surface: "#ffffff" },
      },
      { type: COMMANDS.setRootDarkMode, id: pageId, darkMode: true },
      {
        type: COMMANDS.reparentShape,
        id: rectId,
        parentId: pageId,
        boundingBox: { x: 20, y: 20, width: 80, height: 80 },
      },
    ]);

    const result = applyTransaction(doc, tx);
    expect(result.inverse).toEqual([]);
    expect(result.document.shapes[pageId]).toBe(doc.shapes[pageId]);
    expect(result.document.shapes[rectId]).toBe(doc.shapes[rectId]);
  });
});
