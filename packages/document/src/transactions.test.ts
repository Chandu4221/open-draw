import { describe, expect, it } from "vitest";
import { EMPTY_HISTORY, redo, recordHistory, undo } from "./history";
import { DocumentError } from "./errors";
import { createPage, createRect, createSection } from "./shape";
import { COMMANDS } from "./commands";
import { applyTransaction, createTransaction } from "./transactions";
import { createDocument } from "./document";
import type { Document } from "./document";
import type { Shape } from "./shape";
import { parseShapeId } from "@open-draw/contracts";

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
    expect(undone?.document.shapes[parseShapeId("rect-1")]?.parent).toBe("section-1");

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
            parent: parseShapeId("section-1"),
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
});
