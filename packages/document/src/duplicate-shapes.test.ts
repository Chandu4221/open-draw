import { describe, expect, it } from "vitest";
import { parseShapeId, PLATFORMS, STYLE_PROFILES } from "@open-draw/contracts";
import {
  applyTransaction,
  COMMANDS,
  createDocument,
  createPage,
  createRect,
  createSection,
  createTransaction,
  DocumentError,
  parseDocument,
  serializeDocument,
} from "./index";

describe("DuplicateShapes command (F5, ADR-0006 Option A)", () => {
  const pageId = parseShapeId("page-1");
  const sectionId = parseShapeId("section-1");
  const rectId = parseShapeId("rect-1");

  function createTestDoc() {
    return createDocument([
      createPage(
        pageId,
        { x: 0, y: 0, width: 800, height: 600 },
        {
          meta: {
            order: {},
            style: STYLE_PROFILES.crayon,
            platform: PLATFORMS.web,
          },
        },
      ),
      createSection(sectionId, { x: 50, y: 50, width: 300, height: 200 }, "column", {
        parent: pageId,
      }),
      createRect(
        rectId,
        { x: 10, y: 10, width: 100, height: 50 },
        {
          parent: sectionId,
          label: "MyButton",
          fill: "#ff0000",
          stroke: "#000000",
          strokeWidth: 2,
          content: "Click me",
        },
      ),
    ]);
  }

  it("duplicates a single leaf shape with offset dx/dy", () => {
    const doc = createTestDoc();
    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.duplicateShapes,
          ids: [rectId],
          dx: 20,
          dy: 30,
        },
      ]),
    );

    const shapes = Object.values(result.document.shapes);
    expect(shapes.length).toBe(4);

    const dup = shapes.find((s) => s.id !== pageId && s.id !== sectionId && s.id !== rectId);
    expect(dup).toBeDefined();
    expect(dup?.parentId).toBe(sectionId);
    expect(dup?.kind).toBe("rect");
    expect(dup?.boundingBox).toEqual({ x: 30, y: 40, width: 100, height: 50 });
    expect(dup?.label).toBe("MyButton");
    expect(dup?.fill).toBe("#ff0000");
    expect(dup?.stroke).toBe("#000000");
    expect(dup?.strokeWidth).toBe(2);
    expect(dup?.content).toBe("Click me");

    // Must pass full document validation (no cycles, valid ids, etc.)
    expect(() => parseDocument(serializeDocument(result.document))).not.toThrow();
  });

  it("duplicates a root page with nested children, preserving subtree structure and root platform/style (R-026)", () => {
    const doc = createTestDoc();
    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.duplicateShapes,
          ids: [pageId],
          dx: 50,
          dy: 50,
        },
      ]),
    );

    // Original had 3 shapes (page, section, rect). Duplicating page duplicates all 3 -> 6 shapes.
    const shapes = Object.values(result.document.shapes);
    expect(shapes.length).toBe(6);

    const newPages = shapes.filter((s) => s.kind === "page" && s.id !== pageId);
    expect(newPages.length).toBe(1);
    const newPage = newPages[0]!;
    expect(newPage.boundingBox).toEqual({ x: 50, y: 50, width: 800, height: 600 });
    expect(newPage.meta.style).toBe(STYLE_PROFILES.crayon);
    expect(newPage.meta.platform).toBe(PLATFORMS.web);

    const newSections = shapes.filter((s) => s.kind === "section" && s.id !== sectionId);
    expect(newSections.length).toBe(1);
    const newSection = newSections[0]!;
    expect(newSection.parentId).toBe(newPage.id);
    expect(newSection.boundingBox).toEqual({ x: 50, y: 50, width: 300, height: 200 });

    const newRects = shapes.filter((s) => s.kind === "rect" && s.id !== rectId);
    expect(newRects.length).toBe(1);
    const newRect = newRects[0]!;
    expect(newRect.parentId).toBe(newSection.id);
    expect(newRect.boundingBox).toEqual({ x: 10, y: 10, width: 100, height: 50 });

    expect(() => parseDocument(serializeDocument(result.document))).not.toThrow();
  });

  it("prunes selected descendants so children are not duplicated twice if both parent and child are selected", () => {
    const doc = createTestDoc();
    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.duplicateShapes,
          ids: [pageId, sectionId, rectId],
          dx: 20,
          dy: 20,
        },
      ]),
    );

    // Exactly 3 new shapes created (1 page + 1 section + 1 rect), total 6
    expect(Object.keys(result.document.shapes).length).toBe(6);
    expect(() => parseDocument(serializeDocument(result.document))).not.toThrow();
  });

  it("supports user-provided newShapeIds map", () => {
    const doc = createTestDoc();
    const customId = parseShapeId("custom-dup-1");
    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.duplicateShapes,
          ids: [rectId],
          newShapeIds: { [rectId]: customId },
        },
      ]),
    );

    expect(result.document.shapes[customId]).toBeDefined();
    expect(result.document.shapes[customId]?.label).toBe("MyButton");
  });

  it("undo cleanly removes all duplicated shapes in one step, redo restores them", () => {
    const doc = createTestDoc();
    const result = applyTransaction(
      doc,
      createTransaction([
        {
          type: COMMANDS.duplicateShapes,
          ids: [pageId],
          dx: 30,
          dy: 30,
        },
      ]),
    );

    expect(Object.keys(result.document.shapes).length).toBe(6);

    // Undo removes all 3 duplicated shapes
    const undone = applyTransaction(result.document, createTransaction(result.inverse));
    expect(Object.keys(undone.document.shapes).length).toBe(3);
    expect(undone.document.shapes[pageId]).toBeDefined();
    expect(undone.document.shapes[sectionId]).toBeDefined();
    expect(undone.document.shapes[rectId]).toBeDefined();
    expect(() => parseDocument(serializeDocument(undone.document))).not.toThrow();

    // Redo restores all 3 duplicated shapes
    const redone = applyTransaction(undone.document, createTransaction(undone.inverse));
    expect(Object.keys(redone.document.shapes).length).toBe(6);
    expect(() => parseDocument(serializeDocument(redone.document))).not.toThrow();
  });

  it("throws DocumentError when shape id does not exist", () => {
    const doc = createTestDoc();
    expect(() =>
      applyTransaction(
        doc,
        createTransaction([
          {
            type: COMMANDS.duplicateShapes,
            ids: [parseShapeId("non-existent")],
          },
        ]),
      ),
    ).toThrow(DocumentError);
  });
});
