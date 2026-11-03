// Tests for documentToSvgWithLegend (F4, ADR-0006 Option A).
import { describe, expect, it } from "vitest";
import { parseShapeId } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { documentToSvgWithLegend } from "./export-image";

describe("documentToSvgWithLegend (F4, ADR-0006 Option A)", () => {
  const pageId = parseShapeId("page-1");
  const rectId = parseShapeId("rect-1");
  const doc = createDocument([
    createPage(pageId, { x: 0, y: 0, width: 400, height: 300 }),
    createRect(rectId, { x: 50, y: 50, width: 100, height: 80 }, { parent: pageId }),
  ]);

  it("exports a standalone SVG with root svg tag, viewBox, and background", () => {
    const svg = documentToSvgWithLegend(doc);
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('viewBox="');
    expect(svg).toContain("<rect");
    expect(svg).toContain("</svg>");
    expect(svg).not.toContain("Legend");
  });

  it("appends an expanded legend box below the scene when legendItems are provided", () => {
    const svg = documentToSvgWithLegend(doc, {
      legendItems: [
        { tag: "section", label: "Hero Section" },
        { tag: "button", label: "Primary Action" },
      ],
    });

    expect(svg).toContain("Legend");
    expect(svg).toContain("Hero Section");
    expect(svg).toContain("Primary Action");
    expect(svg).toContain("section");
    expect(svg).toContain("button");
  });

  it("escapes hostile XML in legend tags and labels", () => {
    const svg = documentToSvgWithLegend(doc, {
      legendItems: [
        {
          tag: '<script>alert("tag")</script>',
          label: 'Hostile & "Label" <script>',
        },
      ],
    });

    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;alert(&quot;tag&quot;)&lt;/script&gt;");
    expect(svg).toContain("Hostile &amp; &quot;Label&quot; &lt;script&gt;");
  });

  it("handles an empty document safely", () => {
    const emptyDoc = createDocument([]);
    const svg = documentToSvgWithLegend(emptyDoc);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });
});
