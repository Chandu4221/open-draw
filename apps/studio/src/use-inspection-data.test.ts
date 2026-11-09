import { describe, expect, it } from "vitest";
import {
  PLATFORMS,
  ROOT_ID,
  ROOT_ROLES,
  SEMANTIC_CONFLICTS,
  SHAPE_KINDS,
  STYLE_PROFILES,
  type ShapeId,
} from "@open-draw/contracts";
import { createDocument, type Document, type Shape } from "@open-draw/document";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { useInspectionData } from "./use-inspection-data";

function createMockShape(
  id: string,
  parentId = ROOT_ID,
  meta: Shape["meta"] = { order: {} },
): Shape {
  return {
    id: id as ShapeId,
    parentId,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 200, height: 100 },
    meta,
  };
}

describe("useInspectionData", () => {
  it("resolves default inspection data when no shape is selected and document is empty", () => {
    const doc: Document = createDocument();
    const result = useInspectionData(doc, null, undefined);

    expect(result.selectedShape).toBeUndefined();
    expect(result.rootShape).toBeUndefined();
    expect(result.rootPlatform).toBeUndefined();
    expect(result.rootStyle).toBe(STYLE_PROFILES.minimal);
    expect(result.rootRole).toBe(ROOT_ROLES.screen);
    expect(result.activeProfile).toBeUndefined();
    expect(result.conflict).toBeUndefined();
    expect(result.semanticDef).toBeUndefined();
    expect(result.semanticProps).toEqual({});
    expect(result.treeNodes).toEqual([]);
  });

  it("extracts root properties and active platform profile when root shape is selected", () => {
    const rootShape = createMockShape("root-1", ROOT_ID, {
      order: {},
      platform: PLATFORMS.web,
      style: STYLE_PROFILES.crayon,
      role: ROOT_ROLES.component,
    });
    const doc: Document = {
      ...createDocument(),
      shapes: { [rootShape.id]: rootShape },
    };

    const result = useInspectionData(doc, "root-1" as ShapeId, undefined);

    expect(result.selectedShape).toBe(rootShape);
    expect(result.rootShape).toBe(rootShape);
    expect(result.rootPlatform).toBe(PLATFORMS.web);
    expect(result.rootStyle).toBe(STYLE_PROFILES.crayon);
    expect(result.rootRole).toBe(ROOT_ROLES.component);
    expect(result.activeProfile).toBe(PLATFORM_PROFILES[PLATFORMS.web]);
    expect(result.conflict).toBeUndefined();
  });

  it("resolves parent root for nested child shape and detects foreign semantic conflict", () => {
    const rootShape = createMockShape("root-1", ROOT_ID, {
      order: {},
      platform: PLATFORMS.web,
    });
    // Child shape tagged with an iOS-only semantic tag while root is web
    const childShape = createMockShape("child-1", "root-1" as ShapeId, {
      order: {},
      semantic: {
        id: "segmented-control",
        platform: PLATFORMS.ios,
        properties: { selectedIndex: 0 },
      },
    });
    const doc: Document = {
      ...createDocument(),
      shapes: {
        [rootShape.id]: rootShape,
        [childShape.id]: childShape,
      },
    };

    const result = useInspectionData(doc, "child-1" as ShapeId, undefined);

    expect(result.selectedShape).toBe(childShape);
    expect(result.rootShape).toBe(rootShape);
    expect(result.rootPlatform).toBe(PLATFORMS.web);
    expect(result.semanticProps).toEqual({ selectedIndex: 0 });
    // Conflict should be detected because child platform (ios) !== rootPlatform (web)
    expect(result.conflict).toBeDefined();
    expect(result.conflict?.status).toBe(SEMANTIC_CONFLICTS.conflicted);
    expect(result.conflict?.actualPlatform).toBe(PLATFORMS.ios);
    expect(result.conflict?.expectedPlatform).toBe(PLATFORMS.web);
  });

  it("walks semantic tree and returns hierarchical preorder nodes", () => {
    const rootShape = createMockShape("root-1", ROOT_ID, {
      order: {},
      platform: PLATFORMS.web,
    });
    const childShape = createMockShape("child-1", "root-1" as ShapeId, {
      order: {},
      semantic: {
        id: "button",
        platform: PLATFORMS.web,
      },
    });
    const doc: Document = {
      ...createDocument(),
      shapes: {
        [rootShape.id]: rootShape,
        [childShape.id]: childShape,
      },
    };

    const result = useInspectionData(doc, null, undefined);

    expect(result.treeNodes).toHaveLength(2);
    expect(result.treeNodes.map((n) => n.shape.id)).toEqual(["root-1", "child-1"]);
    expect(result.treeNodes[0]?.depth).toBe(0);
    expect(result.treeNodes[1]?.depth).toBe(1);
  });
});
