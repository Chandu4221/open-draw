import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ROLES } from "@open-draw/contracts";
import {
  applyTransaction,
  COMMANDS,
  createDocument,
  createPage,
  createRect,
  createTransaction,
  DocumentError,
} from "../../index";

describe("SetRootRole (R-018, R-026)", () => {
  const rootId = parseShapeId("page-1");
  const childId = parseShapeId("rect-1");

  function createBaseDoc() {
    return createDocument([
      createPage(rootId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createRect(childId, { x: 10, y: 10, width: 100, height: 50 }, { parent: rootId }),
    ]);
  }

  it("applies SetRootRole on root page and inverts cleanly", () => {
    const doc = createBaseDoc();
    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.setRootRole,
          id: rootId,
          role: ROOT_ROLES.component,
        },
      ]),
    );

    expect(result.document.shapes[rootId]?.meta.role).toBe(ROOT_ROLES.component);

    // Inverse cleanly restores undefined
    const undone = applyTransaction(result.document, createTransaction(result.inverse));
    expect(undone.document.shapes[rootId]?.meta.role).toBeUndefined();
  });

  it("applies SetRootRole on root rectangle and inverts cleanly", () => {
    const rootRectId = parseShapeId("root-rect-1");
    const doc = createDocument([createRect(rootRectId, { x: 0, y: 0, width: 400, height: 300 })]);

    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.setRootRole,
          id: rootRectId,
          role: ROOT_ROLES.component,
        },
      ]),
    );

    expect(result.document.shapes[rootRectId]?.meta.role).toBe(ROOT_ROLES.component);

    const undone = applyTransaction(result.document, createTransaction(result.inverse));
    expect(undone.document.shapes[rootRectId]?.meta.role).toBeUndefined();
  });

  it("clears root role when set to null", () => {
    const doc = createDocument([
      createPage(
        rootId,
        { x: 0, y: 0, width: 1000, height: 1000 },
        { meta: { order: {}, role: ROOT_ROLES.component } },
      ),
    ]);

    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.setRootRole,
          id: rootId,
          role: null,
        },
      ]),
    );

    expect(result.document.shapes[rootId]?.meta.role).toBeUndefined();

    // Inverse restores component
    const undone = applyTransaction(result.document, createTransaction(result.inverse));
    expect(undone.document.shapes[rootId]?.meta.role).toBe(ROOT_ROLES.component);
  });

  it("rejects SetRootRole on non-root shapes (R-026)", () => {
    const doc = createBaseDoc();
    expect(() =>
      applyTransaction(
        doc,
        createTransaction([
          {
            type: COMMANDS.setRootRole,
            id: childId,
            role: ROOT_ROLES.component,
          },
        ]),
      ),
    ).toThrow(DocumentError);
  });
});
