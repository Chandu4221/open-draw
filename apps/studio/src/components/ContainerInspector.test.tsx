import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/canvas";
import { STYLE_PROFILES } from "@open-draw/profiles";
import type { Shape } from "@open-draw/canvas";
import { ContainerInspector } from "./ContainerInspector";

describe("ContainerInspector options and semantic chips (R-016, R-031)", () => {
  const rootShape: Shape = {
    id: parseShapeId("root-1"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 800, height: 600 },
    meta: { order: {} },
  };

  it("enables semantic chips switch by default (checked) when showChildChips is undefined", () => {
    const handleToggle = vi.fn();
    const html = renderToString(
      <ContainerInspector
        selectedShape={rootShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        handleSetLabel={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        handleToggleChildChips={handleToggle}
      />,
    );

    expect(html).toContain('id="container-show-chips"');
    expect(html).toContain('aria-checked="true"');
  });

  it("renders semantic chips switch checked when showChildChips is true", () => {
    const handleToggle = vi.fn();
    const html = renderToString(
      <ContainerInspector
        selectedShape={rootShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        handleSetLabel={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        showChildChips={true}
        handleToggleChildChips={handleToggle}
      />,
    );

    expect(html).toContain('id="container-show-chips"');
    expect(html).toContain('aria-checked="true"');
  });

  it("renders semantic chips switch unchecked when showChildChips is explicitly false", () => {
    const handleToggle = vi.fn();
    const html = renderToString(
      <ContainerInspector
        selectedShape={rootShape}
        rootPlatform={undefined}
        rootStyle={STYLE_PROFILES.minimal}
        activeProfile={undefined}
        handleSetLabel={vi.fn()}
        handleSetPlatform={vi.fn()}
        handleSetStyle={vi.fn()}
        showChildChips={false}
        handleToggleChildChips={handleToggle}
      />,
    );

    expect(html).toContain('id="container-show-chips"');
    expect(html).toContain('aria-checked="false"');
  });
});
