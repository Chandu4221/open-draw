import { describe, expect, it } from "vitest";
import { parseShapeId, parseSemanticId, PLATFORMS, STYLE_PROFILES } from "@open-draw/contracts";
import { createDocument, createRect, createSection, createPage } from "@open-draw/document";
import { exportMarkdown } from "./export-markdown";

describe("exportMarkdown", () => {
  it("exports an empty document with header", () => {
    const doc = createDocument([]);
    const md = exportMarkdown(doc);
    expect(md).toBe("# OpenDraw Document\n\n*(Empty canvas)*\n");
  });

  it("exports an empty document without header", () => {
    const doc = createDocument([]);
    const md = exportMarkdown(doc, { includeHeader: false });
    expect(md).toBe("");
  });

  it("exports a single untagged shape on canvas as a root heading without coordinates", () => {
    const rect = createRect(
      parseShapeId("rect-1"),
      { x: 100, y: 150, width: 400, height: 300 },
      { label: "My Box" },
    );
    const doc = createDocument([rect]);
    const md = exportMarkdown(doc, { includeHeader: false });

    expect(md).toBe("## My Box\n");
    // Strictly zero geometry
    expect(md).not.toContain("100");
    expect(md).not.toContain("150");
    expect(md).not.toContain("400");
    expect(md).not.toContain("300");
  });

  it("exports a root page with platform and style annotations", () => {
    const page = createPage(
      parseShapeId("page-1"),
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        label: "Home Screen",
        meta: {
          platform: PLATFORMS.web,
          style: STYLE_PROFILES.crayon,
          order: {},
        },
      },
    );
    const doc = createDocument([page]);
    const md = exportMarkdown(doc, { includeHeader: false });

    expect(md).toBe("## Home Screen (Platform: web, Style: crayon)\n");
  });

  it("exports hierarchical sections and leaves with display names, semantics, and properties", () => {
    const root = createRect(
      parseShapeId("root-1"),
      { x: 0, y: 0, width: 1200, height: 800 },
      {
        label: "Web App",
        meta: {
          platform: PLATFORMS.web,
          style: STYLE_PROFILES.minimal,
          order: {},
        },
      },
    );
    const section = createSection(
      parseShapeId("sec-1"),
      { x: 20, y: 20, width: 1160, height: 200 },
      "row",
      {
        parent: root.id,
        label: "Header Section",
      },
    );
    const nav = createRect(
      parseShapeId("nav-1"),
      { x: 40, y: 40, width: 500, height: 60 },
      {
        parent: section.id,
        meta: {
          order: {},
          semantic: {
            id: parseSemanticId("navbar"),
            platform: PLATFORMS.web,
          },
        },
      },
    );
    const btn = createRect(
      parseShapeId("btn-1"),
      { x: 560, y: 40, width: 120, height: 40 },
      {
        parent: section.id,
        label: "Sign In",
        meta: {
          order: {},
          semantic: {
            id: parseSemanticId("button"),
            platform: PLATFORMS.web,
            properties: {
              variant: "primary",
              disabled: false,
            },
          },
          hiddenOn: ["mobile", "tablet"],
        },
      },
    );

    const doc = createDocument([root, section, nav, btn]);
    const md = exportMarkdown(doc, { includeHeader: true });

    expect(md).toContain("# OpenDraw Document\n\n");
    expect(md).toContain("## Web App (Platform: web, Style: minimal)\n\n");
    expect(md).toContain("### Header Section\n\n");
    expect(md).toContain("- **Navigation Bar** — `navbar`\n");
    expect(md).toContain(
      "- **Sign In** — `button` (disabled: false, variant: primary) _(hidden on mobile, tablet)_\n",
    );
  });

  it("exports conflict annotation for foreign platform tags without modifying document", () => {
    const root = createRect(
      parseShapeId("root-1"),
      { x: 0, y: 0, width: 800, height: 600 },
      {
        label: "Android Page",
        meta: {
          order: {},
          platform: "androidNative",
        },
      },
    );
    const foreignNav = createRect(
      parseShapeId("item-1"),
      { x: 10, y: 10, width: 200, height: 50 },
      {
        parent: root.id,
        meta: {
          order: {},
          semantic: {
            id: parseSemanticId("navbar"), // Web tag under Android Native root
            platform: PLATFORMS.web,
          },
        },
      },
    );

    const doc = createDocument([root, foreignNav]);
    const md = exportMarkdown(doc, { includeHeader: false });

    expect(md).toContain("## Android Page (Platform: androidNative, Style: minimal)\n\n");
    expect(md).toContain("- **Rectangle** — `navbar` ⚠️ _[CONFLICT:");
    // Verify document was not mutated
    expect(doc.shapes[foreignNav.id]?.meta.semantic?.id).toBe("navbar");
  });

  it("is 100% byte-stable across repeated invocations (R-041)", () => {
    const page = createPage(
      parseShapeId("page-1"),
      { x: 0, y: 0, width: 1000, height: 1000 },
      {
        label: "Stable Canvas",
        meta: {
          order: {},
          platform: PLATFORMS.web,
        },
      },
    );
    const btn = createRect(
      parseShapeId("btn-1"),
      { x: 10, y: 10, width: 100, height: 40 },
      {
        parent: page.id,
        meta: {
          order: {},
          semantic: {
            id: parseSemanticId("button"),
            platform: PLATFORMS.web,
            properties: { b: 2, a: 1, z: 99 },
          },
          hiddenOn: ["largeScreen", "desktop"],
        },
      },
    );

    const doc = createDocument([page, btn]);
    const run1 = exportMarkdown(doc);
    const run2 = exportMarkdown(doc);

    expect(run1).toBe(run2);
    expect(run1).toMatchInlineSnapshot(`
      "# OpenDraw Document

      ## Stable Canvas (Platform: web, Style: minimal)

      - **Button** — \`button\` (a: 1, b: 2, z: 99) _(hidden on desktop, large-screen)_
      "
    `);
  });
});
