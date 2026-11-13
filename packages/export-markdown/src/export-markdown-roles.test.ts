import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID } from "@open-draw/canvas";
import { parseSemanticId, PLATFORMS, ROOT_ROLES, STYLE_PROFILES } from "@open-draw/semantics";
import { createDocument, createRect } from "@open-draw/canvas";
import { exportMarkdown } from "./export-markdown";

describe("exportMarkdown with root roles (R-024, R-026)", () => {
  it("exports standalone root component with role, semantic tag, and child elements", () => {
    const cardRoot = createRect(
      parseShapeId("card-root"),
      { x: 0, y: 0, width: 400, height: 300 },
      {
        parent: ROOT_ID,
        meta: {
          order: {},
          role: ROOT_ROLES.component,
          platform: PLATFORMS.web,
          style: STYLE_PROFILES.minimal,
          semantic: {
            id: parseSemanticId("card"),
            platform: PLATFORMS.web,
            properties: { elevated: true },
          },
        },
      },
    );
    const cardButton = createRect(
      parseShapeId("card-btn"),
      { x: 20, y: 220, width: 100, height: 40 },
      {
        parent: cardRoot.id,
        label: "Confirm Action",
        meta: {
          order: {},
          semantic: {
            id: parseSemanticId("button"),
            platform: PLATFORMS.web,
            properties: { variant: "primary" },
          },
        },
      },
    );

    const doc = createDocument([cardRoot, cardButton]);
    const md = exportMarkdown(doc, { includeHeader: false });

    expect(md).toContain(
      "- #card-root — Card (Card, elevated: true) — rect [x:0.00 y:0.00 w:400.00 h:300.00]\n",
    );
    expect(md).toContain(
      "  - #card-btn — Confirm Action (Button, variant: primary) — rect [x:20.00 y:220.00 w:100.00 h:40.00]\n",
    );
  });

  it("exports root screen shape without role tag when default", () => {
    const screenRoot = createRect(
      parseShapeId("screen-root"),
      { x: 0, y: 0, width: 1200, height: 800 },
      {
        parent: ROOT_ID,
        meta: {
          order: {},
          platform: PLATFORMS.web,
          style: STYLE_PROFILES.minimal,
        },
      },
    );
    const doc = createDocument([screenRoot]);
    const md = exportMarkdown(doc, { includeHeader: false });

    // When role is not explicitly set, renders as untagged rect with bounding box
    expect(md).toBe("- #screen-root — (untagged rect) [x:0.00 y:0.00 w:1200.00 h:800.00]\n");
    expect(md).not.toContain("Role:");
  });
});
