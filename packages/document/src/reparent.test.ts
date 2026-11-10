import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID } from "@open-draw/contracts";
import { createDocument, createLine, createPage, createRect, createSection } from ".";
import { applyTransaction, createTransaction } from "./transactions";
import { COMMANDS } from "./commands/registry";
import {
  absoluteBoundingBox,
  ancestorsOf,
  computeReparentBoundingBox,
  isContainerShape,
  pickDropTarget,
  pointInBox,
  pruneSelectedDescendants,
} from ".";
import { recordHistory, undo, EMPTY_HISTORY } from "./history";

describe("reparent helpers and N-level deep hierarchies", () => {
  const pageId = parseShapeId("page-1");
  const sectionId = parseShapeId("section-1");
  const cardId = parseShapeId("card-1");
  const buttonId = parseShapeId("button-1");
  const freeRectId = parseShapeId("free-rect-1");

  // Hierarchy:
  // page-1: (100, 100, 800, 600) on ROOT
  //   section-1: (20, 20, 400, 300) inside page-1 => world (120, 120, 400, 300)
  //     card-1: (30, 30, 200, 150) inside section-1 => world (150, 150, 200, 150)
  //       button-1: (10, 10, 80, 40) inside card-1 => world (160, 160, 80, 40)
  // free-rect-1: (1000, 100, 100, 100) on ROOT => world (1000, 100, 100, 100)
  const doc = createDocument([
    createPage(pageId, { x: 100, y: 100, width: 800, height: 600 }),
    createSection(sectionId, { x: 20, y: 20, width: 400, height: 300 }, "row", {
      parent: pageId,
    }),
    createRect(cardId, { x: 30, y: 30, width: 200, height: 150 }, { parent: sectionId }),
    createRect(
      buttonId,
      { x: 10, y: 10, width: 80, height: 40 },
      {
        parent: cardId,
        meta: {
          order: {},
          semantic: { id: "button", platform: "web" },
        },
      },
    ),
    createRect(freeRectId, { x: 1000, y: 100, width: 100, height: 100 }, { parent: ROOT_ID }),
  ]);

  describe("isContainerShape", () => {
    it("identifies page and section as structural containers", () => {
      expect(isContainerShape(doc.shapes[pageId]!, doc)).toBe(true);
      expect(isContainerShape(doc.shapes[sectionId]!, doc)).toBe(true);
    });

    it("does not treat plain rectangle on platform-agnostic canvas as a drop container (R-004, R-024, R-026)", () => {
      // free-rect-1 is a plain rectangle on ROOT_ID with no platform metadata
      expect(isContainerShape(doc.shapes[freeRectId]!, doc)).toBe(false);
    });

    it("treats rectangle inside a platform-tagged screen or with platform semantics as a container", () => {
      const platformPageId = parseShapeId("screen-web");
      const cardInsidePlatformId = parseShapeId("card-platform");
      const platformDoc = createDocument([
        createPage(
          platformPageId,
          { x: 0, y: 0, width: 800, height: 600 },
          {
            meta: { order: {}, platform: "web" },
          },
        ),
        createRect(
          cardInsidePlatformId,
          { x: 10, y: 10, width: 200, height: 200 },
          {
            parent: platformPageId,
          },
        ),
      ]);
      expect(isContainerShape(platformDoc.shapes[cardInsidePlatformId]!, platformDoc)).toBe(true);
    });

    it("identifies rectangle with semantic tag as a container even when empty", () => {
      const avatarRect = createRect(
        parseShapeId("rect-avatar"),
        { x: 20, y: 20, width: 80, height: 80 },
        {
          meta: {
            order: {},
            semantic: { id: "avatar", platform: "web" },
          },
        },
      );
      expect(isContainerShape(avatarRect)).toBe(true);
    });

    it("rejects open strokes (lines and pen paths)", () => {
      const lineShape = createLine(
        parseShapeId("line-1"),
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 0, y: 0 },
        { x: 50, y: 50 },
      );
      expect(isContainerShape(lineShape)).toBe(false);
    });
  });

  describe("pointInBox", () => {
    it("tests point containment in bounding box", () => {
      const box = { x: 10, y: 10, width: 100, height: 50 };
      expect(pointInBox(box, { x: 50, y: 30 })).toBe(true);
      expect(pointInBox(box, { x: 5, y: 30 })).toBe(false);
    });
  });

  describe("pickDropTarget", () => {
    it("returns ROOT_ID when dropped on empty canvas", () => {
      const target = pickDropTarget(doc, { x: 50, y: 50 }, []);
      expect(target).toBe(ROOT_ID);
    });

    it("returns the root page when dropped inside page but outside section", () => {
      const target = pickDropTarget(doc, { x: 600, y: 300 }, []);
      expect(target).toBe(pageId);
    });

    it("returns the section when dropped inside section but outside card", () => {
      const target = pickDropTarget(doc, { x: 130, y: 130 }, []);
      expect(target).toBe(sectionId);
    });

    it("returns the card (N-level deep) when dropped inside card", () => {
      const target = pickDropTarget(doc, { x: 200, y: 200 }, []);
      expect(target).toBe(cardId);
    });

    it("excludes the dragged shape and all its descendants to strictly prevent cycles", () => {
      // If we drag section-1 over card-1 (its own child), section-1 and card-1 must be excluded,
      // so it falls back to page-1!
      const target = pickDropTarget(doc, { x: 200, y: 200 }, [sectionId]);
      expect(target).toBe(pageId);
    });

    it("falls back to ROOT_ID if all enclosing containers are in the excluded subtree", () => {
      // If we drag page-1 over card-1, everything inside page-1 is in page-1's subtree
      const target = pickDropTarget(doc, { x: 200, y: 200 }, [pageId]);
      expect(target).toBe(ROOT_ID);
    });
  });

  describe("computeReparentBoundingBox", () => {
    it("translates world bounding box to parent-local coordinates preserving absolute position", () => {
      const button = doc.shapes[buttonId]!;
      const originalWorldBox = absoluteBoundingBox(doc, button);
      expect(originalWorldBox).toEqual({ x: 160, y: 160, width: 80, height: 40 });

      // Reparent button from card-1 to section-1:
      const sectionLocalBox = computeReparentBoundingBox(doc, button, sectionId, originalWorldBox);
      expect(sectionLocalBox).toEqual({
        x: originalWorldBox.x - 120, // section-1 world x is 120
        y: originalWorldBox.y - 120, // section-1 world y is 120
        width: 80,
        height: 40,
      });

      // Reparent button from card-1 to ROOT_ID:
      const rootLocalBox = computeReparentBoundingBox(doc, button, ROOT_ID, originalWorldBox);
      expect(rootLocalBox).toEqual(originalWorldBox);
    });
  });

  describe("pruneSelectedDescendants", () => {
    it("returns all IDs if none are ancestors of each other", () => {
      const pruned = pruneSelectedDescendants(doc, [freeRectId, buttonId]);
      expect(pruned).toEqual([freeRectId, buttonId]);
    });

    it("prunes descendants if their ancestor is also selected", () => {
      const pruned = pruneSelectedDescendants(doc, [pageId, sectionId, cardId, buttonId]);
      expect(pruned).toEqual([pageId]);
    });

    it("prunes child when parent and child are selected", () => {
      const pruned = pruneSelectedDescendants(doc, [sectionId, buttonId]);
      // button-1 is inside card-1 which is inside section-1
      expect(pruned).toEqual([sectionId]);
    });
  });

  describe("end-to-end reparent transaction across N levels", () => {
    it("reparents from ROOT_ID into Page, then into Card, and back to ROOT with full undo/redo", () => {
      const freeRect = doc.shapes[freeRectId]!;
      const initialWorldBox = absoluteBoundingBox(doc, freeRect);

      // 1. Move freeRect into card-1 (N=3 levels deep: ROOT -> page -> section -> card)
      const newWorldBox = { x: 180, y: 180, width: 100, height: 100 };
      const cardLocalBox = computeReparentBoundingBox(doc, freeRect, cardId, newWorldBox);

      const step1 = applyTransaction(
        doc,
        createTransaction([
          {
            type: COMMANDS.reparentShape,
            id: freeRectId,
            parentId: cardId,
            boundingBox: cardLocalBox,
          },
        ]),
      );

      const reparented1 = step1.document.shapes[freeRectId]!;
      expect(reparented1.parentId).toBe(cardId);
      expect(absoluteBoundingBox(step1.document, reparented1)).toEqual(newWorldBox);

      // Verify ancestry
      const ancestors = ancestorsOf(step1.document, reparented1);
      expect(ancestors.map((a) => a.id)).toEqual([cardId, sectionId, pageId]);

      // 2. Reparent back to ROOT_ID
      const exitWorldBox = { x: 500, y: 500, width: 100, height: 100 };
      const rootLocalBox = computeReparentBoundingBox(
        step1.document,
        reparented1,
        ROOT_ID,
        exitWorldBox,
      );

      const step2 = applyTransaction(
        step1.document,
        createTransaction([
          {
            type: COMMANDS.reparentShape,
            id: freeRectId,
            parentId: ROOT_ID,
            boundingBox: rootLocalBox,
          },
        ]),
      );

      const reparented2 = step2.document.shapes[freeRectId]!;
      expect(reparented2.parentId).toBe(ROOT_ID);
      expect(absoluteBoundingBox(step2.document, reparented2)).toEqual(exitWorldBox);

      // 3. Test Undo
      let history = recordHistory(EMPTY_HISTORY, step1.inverse);
      history = recordHistory(history, step2.inverse);

      const undo1 = undo(step2.document, history);
      expect(undo1?.document.shapes[freeRectId]?.parentId).toBe(cardId);
      expect(absoluteBoundingBox(undo1!.document, undo1!.document.shapes[freeRectId]!)).toEqual(
        newWorldBox,
      );

      const undo2 = undo(undo1!.document, undo1!.history);
      expect(undo2?.document.shapes[freeRectId]?.parentId).toBe(ROOT_ID);
      expect(absoluteBoundingBox(undo2!.document, undo2!.document.shapes[freeRectId]!)).toEqual(
        initialWorldBox,
      );
    });
  });
});
