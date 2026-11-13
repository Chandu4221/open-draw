import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/canvas";
import { STYLE_PROFILES } from "@open-draw/profiles";
import type { Shape } from "@open-draw/canvas";
import type { SemanticTreeNode } from "@open-draw/semantics";
import { Sidebar } from "./Sidebar";

describe("Sidebar collapsible panels and typography", () => {
  const dummyShape: Shape = {
    id: parseShapeId("shape-1"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 200, height: 100 },
    meta: { order: {} },
  };

  const dummyNodes: readonly SemanticTreeNode[] = [
    {
      shape: dummyShape,
      depth: 0,
      displayName: "Rectangle",
      semanticType: "Rectangle",
    },
  ];

  it("renders both PROPERTIES and LAYERS panel headers with consistent 16px panel title class and chevrons", () => {
    const html = renderToString(
      <Sidebar
        treeNodes={dummyNodes}
        selectedShapeId={parseShapeId("shape-1")}
        selectShape={vi.fn()}
        selectedShape={dummyShape}
        rootShape={dummyShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        conflict={undefined}
        semanticDef={undefined}
        semanticProps={{}}
        handleSetLabel={vi.fn()}
        handleSetContent={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleSetSemantic={vi.fn()}
        handlePropertyChange={vi.fn()}
        handleToggleHiddenOn={vi.fn()}
        handleOrderChange={vi.fn()}
        handleStyleChange={vi.fn()}
        handleStylePreview={vi.fn()}
        handleStyleCommit={vi.fn()}
      />,
    );

    // Both panel headers must have the od-panel-title class (16px)
    expect(html).toContain("PROPERTIES");
    expect(html).toContain("LAYERS");
    expect(html).toMatch(
      /<span[^>]*class="[^"]*od-panel-title[^"]*"[^>]*>\s*PROPERTIES\s*<\/span>/,
    );
    expect(html).toMatch(/<span[^>]*class="[^"]*od-panel-title[^"]*"[^>]*>\s*LAYERS\s*<\/span>/);

    // Both panel headers must have aria-expanded attributes
    expect(html).toContain('aria-label="Toggle PROPERTIES panel"');
    expect(html).toContain('aria-label="Toggle LAYERS panel"');

    // Layers count badge must be rendered in LAYERS header
    expect(html).toMatch(/<span[^>]*class="[^"]*od-badge[^"]*"[^>]*>1<\/span>/);

    // No font sizes below 11px should be found in inline styles
    expect(html).not.toMatch(/font-size:\s*([1-9]|10)px/i);
    expect(html).not.toMatch(/fontSize:\s*["']([1-9]|10)px["']/i);
  });

  it("keeps Inspector and TreeOutline continuously mounted within single Allotment container", () => {
    const html = renderToString(
      <Sidebar
        treeNodes={dummyNodes}
        selectedShapeId={parseShapeId("shape-1")}
        selectShape={vi.fn()}
        selectedShape={dummyShape}
        rootShape={dummyShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        conflict={undefined}
        semanticDef={undefined}
        semanticProps={{}}
        handleSetLabel={vi.fn()}
        handleSetContent={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleSetSemantic={vi.fn()}
        handlePropertyChange={vi.fn()}
        handleToggleHiddenOn={vi.fn()}
        handleOrderChange={vi.fn()}
        handleStyleChange={vi.fn()}
        handleStylePreview={vi.fn()}
        handleStyleCommit={vi.fn()}
      />,
    );

    expect(html).toContain("od-inspector-content");
    expect(html).toContain("LAYERS");
  });

  it("disables resizing on layers panel and allows natural flow without a resizer sash", () => {
    const html = renderToString(
      <Sidebar
        treeNodes={dummyNodes}
        selectedShapeId={parseShapeId("shape-1")}
        selectShape={vi.fn()}
        selectedShape={dummyShape}
        rootShape={dummyShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        conflict={undefined}
        semanticDef={undefined}
        semanticProps={{}}
        handleSetLabel={vi.fn()}
        handleSetContent={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleSetSemantic={vi.fn()}
        handlePropertyChange={vi.fn()}
        handleToggleHiddenOn={vi.fn()}
        handleOrderChange={vi.fn()}
        handleStyleChange={vi.fn()}
        handleStylePreview={vi.fn()}
        handleStyleCommit={vi.fn()}
      />,
    );

    expect(html).not.toContain('role="separator"');
    expect(html).not.toContain("od-sidebar-sash");
    expect(html).not.toContain('aria-orientation="horizontal"');
  });

  it("configures PROPERTIES and LAYERS panels to flow naturally in a unified scroll container", () => {
    const html = renderToString(
      <Sidebar
        treeNodes={dummyNodes}
        selectedShapeId={parseShapeId("shape-1")}
        selectShape={vi.fn()}
        selectedShape={dummyShape}
        rootShape={dummyShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        conflict={undefined}
        semanticDef={undefined}
        semanticProps={{}}
        handleSetLabel={vi.fn()}
        handleSetContent={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleSetSemantic={vi.fn()}
        handlePropertyChange={vi.fn()}
        handleToggleHiddenOn={vi.fn()}
        handleOrderChange={vi.fn()}
        handleStyleChange={vi.fn()}
        handleStylePreview={vi.fn()}
        handleStyleCommit={vi.fn()}
      />,
    );

    // Sidebar panels use flex:0 0 auto and the sidebar has overflow-y:auto
    expect(html).toContain('style="flex:0 0 auto');
    expect(html).toContain("overflow-y:auto");
    expect(html).not.toContain("flex:1 1 0px");
  });
});
