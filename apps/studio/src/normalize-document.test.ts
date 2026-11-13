import { describe, expect, it } from "vitest";
import {
  createDocument,
  createLine,
  createRect,
  createText,
  parseShapeId,
  ROOT_ID,
} from "@open-draw/canvas";
import { normalizeStudioDocument } from "./normalize-document";

describe("normalizeStudioDocument", () => {
  it("marks root rectangle container with isContainer: true", () => {
    const rootRect = createRect(
      parseShapeId("root-screen"),
      { x: 0, y: 0, width: 400, height: 300 },
      { parentId: ROOT_ID },
    );
    const doc = createDocument([rootRect]);
    expect(doc.shapes[rootRect.id]?.meta.isContainer).toBeUndefined();

    const normalized = normalizeStudioDocument(doc);
    expect(normalized).not.toBe(doc);
    expect(normalized.shapes[rootRect.id]?.meta.isContainer).toBe(true);
  });

  it("does not mutate already normalized root container", () => {
    const rootRect = createRect(
      parseShapeId("root-screen"),
      { x: 0, y: 0, width: 400, height: 300 },
      { parentId: ROOT_ID, meta: { order: {}, isContainer: true } },
    );
    const doc = createDocument([rootRect]);
    const normalized = normalizeStudioDocument(doc);
    expect(normalized).toBe(doc);
  });

  it("does not mark child shapes as isContainer", () => {
    const rootRect = createRect(
      parseShapeId("root-screen"),
      { x: 0, y: 0, width: 400, height: 300 },
      { parentId: ROOT_ID, meta: { order: {}, isContainer: true } },
    );
    const childRect = createRect(
      parseShapeId("child-btn"),
      { x: 10, y: 10, width: 80, height: 40 },
      { parentId: rootRect.id },
    );
    const childText = createText(
      parseShapeId("child-txt"),
      { x: 20, y: 20, width: 60, height: 20 },
      { parentId: rootRect.id },
    );
    const doc = createDocument([rootRect, childRect, childText]);
    const normalized = normalizeStudioDocument(doc);

    expect(normalized).toBe(doc);
    expect(normalized.shapes[childRect.id]?.meta.isContainer).toBeUndefined();
    expect(normalized.shapes[childText.id]?.meta.isContainer).toBeUndefined();
  });

  it("does not mark open strokes or text on root as containers", () => {
    const rootLine = createLine(
      parseShapeId("root-line"),
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { parent: ROOT_ID },
    );
    const rootText = createText(
      parseShapeId("root-text"),
      { x: 0, y: 0, width: 100, height: 30 },
      { parentId: ROOT_ID },
    );
    const doc = createDocument([rootLine, rootText]);
    const normalized = normalizeStudioDocument(doc);

    expect(normalized).toBe(doc);
    expect(normalized.shapes[rootLine.id]?.meta.isContainer).toBeUndefined();
    expect(normalized.shapes[rootText.id]?.meta.isContainer).toBeUndefined();
  });
});
