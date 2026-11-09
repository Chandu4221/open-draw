import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { parseSemanticId, parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import type { SemanticTreeNode } from "@open-draw/semantics";
import { TreeOutline } from "./components/TreeOutline";

describe("TreeOutline", () => {
  it("renders custom user-defined name from label falling back to default shape name, with semantic chip as badge", () => {
    const textShapeWithLabel: Shape = {
      id: parseShapeId("s-text-1"),
      parentId: parseShapeId("s-root-1"),
      kind: SHAPE_KINDS.text,
      boundingBox: { x: 10, y: 10, width: 100, height: 32 },
      label: "User Defined Name",
      content: "TEXT",
      meta: {
        order: {},
        semantic: { id: "heading", platform: "web" },
      },
    };

    const textShapeWithoutLabel: Shape = {
      id: parseShapeId("s-text-2"),
      parentId: parseShapeId("s-root-1"),
      kind: SHAPE_KINDS.text,
      boundingBox: { x: 10, y: 50, width: 100, height: 32 },
      content: "TEXT 2",
      meta: {
        order: {},
        semantic: { id: "button", platform: "web" },
      },
    };

    const untaggedRect: Shape = {
      id: parseShapeId("s-rect-1"),
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 200, height: 200 },
      meta: { order: {} },
    };

    const headingId = parseSemanticId("heading");
    const buttonId = parseSemanticId("button");

    const treeNodes: SemanticTreeNode[] = [
      {
        shape: textShapeWithLabel,
        depth: 1,
        displayName: "Heading",
        semantic: {
          id: headingId,
          displayName: "Heading",
          definition: { id: headingId, displayName: "Heading" },
        },
      },
      {
        shape: textShapeWithoutLabel,
        depth: 1,
        displayName: "Button",
        semantic: {
          id: buttonId,
          displayName: "Button",
          definition: { id: buttonId, displayName: "Button" },
        },
      },
      {
        shape: untaggedRect,
        depth: 0,
        displayName: "Rectangle",
      },
    ];

    const html = renderToString(
      <TreeOutline
        treeNodes={treeNodes}
        selectedShapeId={parseShapeId("s-text-1")}
        selectShape={vi.fn()}
      />,
    );

    // 1. First node has custom label: should display "User Defined Name" and semantic badge "Heading"
    expect(html).toContain("User Defined Name");
    expect(html).toMatch(/<span[^>]*class="[^"]*od-badge[^"]*"[^>]*>Heading<\/span>/);

    // 2. Second node has no custom label: should fall back to default shape name "Text" (not "Button")
    // and have a semantic badge for "Button"
    expect(html).toContain("Text");
    expect(html).toMatch(/<span[^>]*class="[^"]*od-badge[^"]*"[^>]*>Button<\/span>/);

    // 3. Untagged rectangle has no semantic tag: displays default shape name "Rectangle", no semantic chip badge
    expect(html).toContain("Rectangle");
  });
});
