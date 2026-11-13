import { describe, expect, it } from "vitest";
import { ROOT_ID, SHAPE_KINDS, type ShapeId } from "@open-draw/canvas";
import { PLATFORMS } from "@open-draw/profiles";
import { ROOT_ROLES } from "@open-draw/semantics";
import { createDefaultSampleDocument } from "./default-sample-document.js";

describe("createDefaultSampleDocument", () => {
  it("creates a valid document containing the 6 sample profile card shapes", () => {
    const doc = createDefaultSampleDocument();
    expect(doc.schema.version).toBe(1);
    expect(Object.keys(doc.shapes)).toHaveLength(6);
  });

  it("configures the root card shape with component role and web platform", () => {
    const doc = createDefaultSampleDocument();
    const root = doc.shapes["s-7a01" as ShapeId];
    expect(root).toBeDefined();
    expect(root?.kind).toBe(SHAPE_KINDS.rect);
    expect(root?.parentId).toBe(ROOT_ID);
    expect(root?.label).toBe("Profile Card");
    expect(root?.meta.role).toBe(ROOT_ROLES.component);
    expect(root?.meta.platform).toBe(PLATFORMS.web);
    expect(root?.meta.semantic?.id).toBe("card");
    expect(root?.meta.semantic?.platform).toBe(PLATFORMS.web);
  });

  it("nests all child shapes under the root card container", () => {
    const doc = createDefaultSampleDocument();
    const childIds: ShapeId[] = [
      "s-7a02" as ShapeId,
      "s-7a03" as ShapeId,
      "s-7a04" as ShapeId,
      "s-7a05" as ShapeId,
      "s-7a06" as ShapeId,
    ];

    for (const id of childIds) {
      const shape = doc.shapes[id];
      expect(shape).toBeDefined();
      expect(shape?.parentId).toBe("s-7a01" as ShapeId);
    }

    // Verify avatar
    expect(doc.shapes["s-7a02" as ShapeId]?.kind).toBe(SHAPE_KINDS.ellipse);
    expect(doc.shapes["s-7a02" as ShapeId]?.meta.semantic?.id).toBe("image");

    // Verify username
    expect(doc.shapes["s-7a03" as ShapeId]?.content).toBe("John Doe");
    expect(doc.shapes["s-7a03" as ShapeId]?.meta.semantic?.id).toBe("heading");

    // Verify profession
    expect(doc.shapes["s-7a04" as ShapeId]?.content).toBe("Developer");

    // Verify buttons
    expect(doc.shapes["s-7a05" as ShapeId]?.content).toBe("Hire Me");
    expect(doc.shapes["s-7a06" as ShapeId]?.content).toBe("Visit Profile");
  });
});
