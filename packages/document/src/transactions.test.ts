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
});
