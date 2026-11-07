import { describe, expect, it } from "vitest";
import { parseDocument } from "@open-draw/document";
import { exportMarkdown } from "./export-markdown";
import { formatBoundingBox } from "./format-tree";

const PROFIE_CARD_FIXTURE = JSON.stringify({
  schema: {
    version: 1,
  },
  shapes: {
    "s-7a01": {
      id: "s-7a01",
      kind: "rect",
      parentId: "canvas:root",
      boundingBox: {
        x: 386.03,
        y: 125.25,
        width: 605.62,
        height: 319.96,
      },
      label: "Profie Card",
      meta: {
        semantic: {
          id: "card",
          platform: "web",
          properties: {
            elevation: "low",
          },
        },
        platform: "web",
        role: "component",
      },
    },
    "s-7a02": {
      id: "s-7a02",
      kind: "ellipse",
      parentId: "s-7a01",
      boundingBox: {
        x: 44.21,
        y: 53.36,
        width: 198.15,
        height: 193.05,
      },
      meta: {},
    },
    "s-7a03": {
      id: "s-7a03",
      kind: "text",
      parentId: "s-7a01",
      content: "Alex Muller",
      meta: {
        semantic: {
          id: "heading",
          platform: "web",
        },
      },
      boundingBox: {
        x: 275.09,
        y: 79.93,
        width: 100,
        height: 32,
      },
    },
    "s-7a05": {
      id: "s-7a05",
      kind: "text",
      parentId: "s-7a01",
      content: "Software developer",
      meta: {
        semantic: {
          id: "heading",
          platform: "web",
          properties: {
            level: "5",
          },
        },
      },
      boundingBox: {
        x: 271.81,
        y: 114.59,
        width: 162.54,
        height: 32.39,
      },
    },
    "s-7a06": {
      id: "s-7a06",
      kind: "rect",
      parentId: "s-7a01",
      content: "Hire Me",
      label: "Hire Me",
      meta: {
        semantic: {
          id: "button",
          platform: "web",
        },
      },
      boundingBox: {
        x: 268.45,
        y: 161.66,
        width: 222.14,
        height: 60.3,
      },
    },
  },
});

describe("formatTree and exportMarkdown hierarchy parity (B1-B3, B5)", () => {
  it("exports reference fixture into indented tree with chip IDs and bounding boxes", () => {
    const doc = parseDocument(PROFIE_CARD_FIXTURE);
    const md = exportMarkdown(doc, { includeHeader: false });

    const expectedTree = [
      "- #s-7a01 — Profie Card (Card, elevation: low) — rect [x:386.03 y:125.25 w:605.62 h:319.96]",
      "  - #s-7a02 — (untagged ellipse) [x:44.21 y:53.36 w:198.15 h:193.05]",
      "  - #s-7a03 — Alex Muller (Heading) — text [x:275.09 y:79.93 w:100.00 h:32.00]",
      "  - #s-7a05 — Software developer (Heading, level: 5) — text [x:271.81 y:114.59 w:162.54 h:32.39]",
      "  - #s-7a06 — Hire Me (Button) — rect [x:268.45 y:161.66 w:222.14 h:60.30]",
    ].join("\n");

    expect(md.trim()).toBe(expectedTree);
  });

  it("omits legend by default (D4 guard)", () => {
    const doc = parseDocument(PROFIE_CARD_FIXTURE);
    const md = exportMarkdown(doc);

    expect(md).not.toContain("## Legend");
  });

  it("appends on-demand chip-keyed legend when includeLegend is true (B5)", () => {
    const doc = parseDocument(PROFIE_CARD_FIXTURE);
    const md = exportMarkdown(doc, { includeHeader: false, includeLegend: true });

    expect(md).toContain("## Legend\n");
    expect(md).toContain("- #s-7a01 — Profie Card (Card, elevation: low)\n");
    expect(md).toContain("- #s-7a02 — (untagged ellipse)\n");
    expect(md).toContain("- #s-7a03 — Alex Muller (Heading)\n");
    expect(md).toContain("- #s-7a05 — Software developer (Heading, level: 5)\n");
    expect(md).toContain("- #s-7a06 — Hire Me (Button)\n");
  });

  it("is 100% byte-stable across repeated exports of the reference fixture (R-041)", () => {
    const doc = parseDocument(PROFIE_CARD_FIXTURE);
    const run1 = exportMarkdown(doc, { includeLegend: true });
    const run2 = exportMarkdown(doc, { includeLegend: true });

    expect(run1).toBe(run2);
  });

  it("formats bounding boxes to pinned 2-decimal places with zero padding (D2)", () => {
    const box = { x: 1, y: 2.3, width: 4.567, height: 8 };
    const formatted = formatBoundingBox(box);

    expect(formatted).toBe("[x:1.00 y:2.30 w:4.57 h:8.00]");
  });

  it("throws a typed error when non-finite coordinates reach bounding box formatting (D2 boundary guard)", () => {
    expect(() => formatBoundingBox({ x: NaN, y: 0, width: 100, height: 100 })).toThrow(
      /Invalid non-finite number in boundingBox\.x: NaN/,
    );
    expect(() => formatBoundingBox({ x: 0, y: Infinity, width: 100, height: 100 })).toThrow(
      /Invalid non-finite number in boundingBox\.y: Infinity/,
    );
  });
});
