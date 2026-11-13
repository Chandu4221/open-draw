import { describe, expect, it } from "vitest";
import { ROOT_ID, SHAPE_KINDS, type ShapeId } from "@open-draw/canvas";
import { PLATFORMS } from "@open-draw/profiles";
import {
  PLUGIN_DESIGN_STYLE,
  PLUGIN_ROOT_PLATFORM,
  PLUGIN_ROOT_ROLE,
  ROOT_ROLES,
  getShapeSemantic,
} from "@open-draw/semantics";
import { createDefaultSampleDocument } from "./default-sample-document.js";

describe("createDefaultSampleDocument", () => {
  it("creates a valid document containing the 34 sample landing page wireframe shapes", () => {
    const doc = createDefaultSampleDocument();
    expect(doc.schema.version).toBe(1);
    expect(Object.keys(doc.shapes)).toHaveLength(34);
  });

  it("configures the root landing page shape with screen role, web platform, and glassmorphism style", () => {
    const doc = createDefaultSampleDocument();
    const root = doc.shapes["s-7a07" as ShapeId];
    expect(root).toBeDefined();
    expect(root?.kind).toBe(SHAPE_KINDS.rect);
    expect(root?.parentId).toBe(ROOT_ID);
    expect(root?.label).toBe("OpenDraw Studio Landing Page");
    expect(root?.meta.role).toBe(ROOT_ROLES.screen);
    expect(root?.meta.platform).toBe(PLATFORMS.web);
    expect(root?.meta.isContainer).toBe(true);
    expect(root?.meta.pluginData?.[PLUGIN_ROOT_PLATFORM]).toBe("web");
    expect(root?.meta.pluginData?.[PLUGIN_ROOT_ROLE]).toBe("screen");
    expect(root?.meta.pluginData?.[PLUGIN_DESIGN_STYLE]).toBe("glassmorphism");
  });

  it("nests top-level sections (navbar, hero, styles, pillars, closing cta) under the root", () => {
    const doc = createDefaultSampleDocument();
    const sectionIds: ShapeId[] = [
      "s-7a09" as ShapeId, // navbar
      "s-7a11" as ShapeId, // hero
      "s-7a15" as ShapeId, // styles section
      "s-7a29" as ShapeId, // pillars section
      "s-7a37" as ShapeId, // closing cta section
    ];

    for (const id of sectionIds) {
      const shape = doc.shapes[id];
      expect(shape).toBeDefined();
      expect(shape?.parentId).toBe("s-7a07" as ShapeId);
      expect(shape?.meta.isContainer).toBe(true);
    }

    expect(getShapeSemantic(doc.shapes["s-7a09" as ShapeId]!)?.id).toBe("navbar");
    expect(getShapeSemantic(doc.shapes["s-7a11" as ShapeId]!)?.id).toBe("hero");
    expect(getShapeSemantic(doc.shapes["s-7a15" as ShapeId]!)?.id).toBe("section");
    expect(getShapeSemantic(doc.shapes["s-7a29" as ShapeId]!)?.id).toBe("section");
    expect(getShapeSemantic(doc.shapes["s-7a37" as ShapeId]!)?.id).toBe("section");
  });

  it("supports N-level deep nesting across sections, cards, and content elements", () => {
    const doc = createDefaultSampleDocument();

    // Level 1: Root s-7a07
    // Level 2: Pillars Section s-7a29
    // Level 3: Card s-7a2b
    const card = doc.shapes["s-7a2b" as ShapeId];
    expect(card).toBeDefined();
    expect(card?.parentId).toBe("s-7a29" as ShapeId);
    expect(card?.meta.isContainer).toBe(true);
    expect(getShapeSemantic(card!)?.id).toBe("card");

    // Level 4: Header Text inside Card s-7a2c
    const headerText = doc.shapes["s-7a2c" as ShapeId];
    expect(headerText).toBeDefined();
    expect(headerText?.parentId).toBe("s-7a2b" as ShapeId);
    expect(headerText?.content).toBe("Draw on a real canvas");
    expect(getShapeSemantic(headerText!)?.id).toBe("header");

    // Level 4: Body Text inside Card s-7a2d
    const bodyText = doc.shapes["s-7a2d" as ShapeId];
    expect(bodyText).toBeDefined();
    expect(bodyText?.parentId).toBe("s-7a2b" as ShapeId);
    expect(bodyText?.content).toBe("Build layouts with shapes, hierarchy, and structure.");
  });

  it("contains the 5 design style cards in the styles showcase section", () => {
    const doc = createDefaultSampleDocument();
    const styleCardIds: ShapeId[] = [
      "s-7a17" as ShapeId, // Minimal
      "s-7a18" as ShapeId, // Glass
      "s-7a26" as ShapeId, // Editorial
      "s-7a27" as ShapeId, // Brutalist
      "s-7a28" as ShapeId, // Soft
    ];

    const expectedLabels = ["Minimal", "Glass", "Editorial", "Brutalist", "Soft"];
    styleCardIds.forEach((id, index) => {
      const card = doc.shapes[id];
      expect(card).toBeDefined();
      expect(card?.parentId).toBe("s-7a15" as ShapeId);
      expect(card?.content).toBe(expectedLabels[index]);
      expect(getShapeSemantic(card!)?.id).toBe("card");
    });
  });
});
