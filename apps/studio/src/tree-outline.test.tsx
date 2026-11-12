import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  parseSemanticId,
  parseShapeId,
  PLATFORMS,
  ROOT_ID,
  ROOT_ROLES,
  SHAPE_KINDS,
  STYLE_PROFILES,
} from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { WEB_PROFILE } from "@open-draw/profiles";
import type { SemanticTreeNode } from "@open-draw/semantics";
import { ContainerInspector } from "./components/ContainerInspector";
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
      meta: { order: {}, semantic: { id: "heading", platform: "web" } },
    };

    const textShapeWithoutLabel: Shape = {
      id: parseShapeId("s-text-2"),
      parentId: parseShapeId("s-root-1"),
      kind: SHAPE_KINDS.text,
      boundingBox: { x: 10, y: 50, width: 100, height: 32 },
      content: "TEXT 2",
      meta: { order: {}, semantic: { id: "button", platform: "web" } },
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

    // 3. Untagged rectangle has no custom label: displays default shape name "Rectangle"
    expect(html).toContain("Rectangle");
  });

  it("renders correct semantic type badges for root shapes based on platform and role", () => {
    const webRootShape: Shape = {
      id: parseShapeId("root-web"),
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 800, height: 600 },
      label: "Web Landing",
      meta: { order: {}, platform: "web" },
    };

    const androidRootShape: Shape = {
      id: parseShapeId("root-android"),
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 360, height: 800 },
      label: "Android Home",
      meta: { order: {}, platform: "androidNative" },
    };

    const agnosticRootShape: Shape = {
      id: parseShapeId("root-agnostic"),
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 400, height: 300 },
      label: "Free Container",
      meta: { order: {} },
    };

    const componentRootShape: Shape = {
      id: parseShapeId("root-comp"),
      parentId: ROOT_ID,
      kind: SHAPE_KINDS.rect,
      boundingBox: { x: 0, y: 0, width: 400, height: 300 },
      label: "Nav Header",
      meta: { order: {}, platform: "web", role: "component" },
    };

    const treeNodes: SemanticTreeNode[] = [
      {
        shape: webRootShape,
        depth: 0,
        displayName: "Web Landing",
        semanticType: "Page",
      },
      {
        shape: androidRootShape,
        depth: 0,
        displayName: "Android Home",
        semanticType: "Screen",
      },
      {
        shape: agnosticRootShape,
        depth: 0,
        displayName: "Free Container",
        semanticType: "Rectangle",
      },
      {
        shape: componentRootShape,
        depth: 0,
        displayName: "Nav Header",
        semanticType: "Component",
      },
    ];

    const html = renderToString(
      <TreeOutline treeNodes={treeNodes} selectedShapeId={null} selectShape={vi.fn()} />,
    );

    // Web root should have "Page" badge
    expect(html).toContain("Web Landing");
    expect(html).toMatch(/<span[^>]*class="[^"]*od-badge[^"]*"[^>]*>Page<\/span>/);

    // Android root should have "Screen" badge
    expect(html).toContain("Android Home");
    expect(html).toMatch(/<span[^>]*class="[^"]*od-badge[^"]*"[^>]*>Screen<\/span>/);

    // Agnostic root should have "Rectangle" badge
    expect(html).toContain("Free Container");
    expect(html).toMatch(/<span[^>]*class="[^"]*od-badge[^"]*"[^>]*>Rectangle<\/span>/);

    // Component root should have "Component" badge
    expect(html).toContain("Nav Header");
    expect(html).toMatch(/<span[^>]*class="[^"]*od-badge[^"]*"[^>]*>Component<\/span>/);
  });

  it("renders scoped header bar with active root title and reset action when scoped", () => {
    const html = renderToString(
      <TreeOutline
        treeNodes={[]}
        selectedShapeId={parseShapeId("child-1")}
        selectShape={vi.fn()}
        isScopedToRoot={true}
        activeRootTitle="Mobile Login Screen"
        onClearScope={vi.fn()}
      />,
    );

    expect(html).toContain("Scope:");
    expect(html).toContain("Mobile Login Screen");
    expect(html).toContain("All Screens");
  });
});

describe("ContainerInspector role synchronization (R-004, R-016, R-023, R-024)", () => {
  const rootShape: Shape = {
    id: parseShapeId("root-1"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 800, height: 600 },
    meta: { order: {} },
  };

  it("renders Page and Component role options when platform is Web", () => {
    const html = renderToString(
      <ContainerInspector
        selectedShape={rootShape}
        rootPlatform={PLATFORMS.web}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={WEB_PROFILE}
        handleSetLabel={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleSetRole={vi.fn()}
      />,
    );

    expect(html).toContain("Page");
    expect(html).toContain("Component");
    expect(html).not.toContain("Screen / Page");
  });

  it("renders Screen and Component role options when platform is Android Native", () => {
    const html = renderToString(
      <ContainerInspector
        selectedShape={rootShape}
        rootPlatform="androidNative"
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        handleSetLabel={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleSetRole={vi.fn()}
      />,
    );

    expect(html).toContain("Screen");
    expect(html).toContain("Component");
    expect(html).not.toContain("Screen / Page");
  });

  it("does not render Root Role segmented control when rootPlatform is undefined (Platform-Agnostic)", () => {
    const html = renderToString(
      <ContainerInspector
        selectedShape={rootShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        handleSetLabel={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleSetRole={vi.fn()}
      />,
    );

    expect(html).not.toContain("Root Role");
  });

  it("renders Component Semantics heading only once when rootRole is component", () => {
    const compRootShape: Shape = {
      ...rootShape,
      meta: { order: {}, platform: "web", role: "component" },
    };
    const noop = vi.fn();
    const html = renderToString(
      <ContainerInspector
        selectedShape={compRootShape}
        rootPlatform={PLATFORMS.web}
        rootStyle={STYLE_PROFILES.minimal}
        rootRole={ROOT_ROLES.component}
        activeProfile={WEB_PROFILE}
        handleSetLabel={noop}
        handleSetPlatform={noop}
        handleSetStyle={noop}
        handleSetRole={noop}
        handleSetSemantic={noop}
        handlePropertyChange={noop}
        handleSetContent={noop}
        handleStyleChange={noop}
        handleStylePreview={noop}
        handleStyleCommit={noop}
      />,
    );

    expect(html.match(/Component Semantics/g)).toHaveLength(1);
  });
});
