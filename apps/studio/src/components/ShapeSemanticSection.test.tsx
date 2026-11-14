import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { parseShapeId, ROOT_ID, SHAPE_KINDS, type Shape } from "@open-draw/canvas";
import { ANDROID_NATIVE_PROFILE, WEB_PROFILE } from "@open-draw/profiles";
import { PLUGIN_SEMANTICS } from "@open-draw/semantics";
import { ComponentSemanticSection } from "./ComponentSemanticSection";
import { ShapeSemanticSection } from "./ShapeSemanticSection";

describe("ShapeSemanticSection heading level segmented buttons (ADR-0007, R-015)", () => {
  const shape: Shape = {
    id: parseShapeId("shape-heading"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.text,
    content: "My Heading",
    boundingBox: { x: 10, y: 10, width: 200, height: 40 },
    meta: {
      order: {},
      pluginData: {
        [PLUGIN_SEMANTICS]: { id: "heading", platform: "web" },
      },
    },
  };

  it("renders heading level options as segmented control chips with one active item", () => {
    const webHeadingDef = WEB_PROFILE.semantics["heading"];
    expect(webHeadingDef).toBeDefined();

    const html = renderToString(
      <ShapeSemanticSection
        selectedShape={shape}
        activeProfile={WEB_PROFILE}
        conflict={undefined}
        semanticDef={webHeadingDef}
        semanticProps={{ level: "2" }}
        handleSetSemantic={vi.fn()}
        handlePropertyChange={vi.fn()}
      />,
    );

    // Must render segmented control with joined pill buttons
    expect(html).toContain("od-segmented");
    expect(html).toContain("od-segmented--full");
    expect(html).toContain("H1");
    expect(html).toContain("H2");
    expect(html).toContain("H3");
    expect(html).toContain("H4");
    expect(html).toContain("H5");
    expect(html).toContain("H6");

    // Level 2 should be active (aria-pressed=true and active class)
    expect(html).toMatch(/aria-pressed="true"[^>]*><span>H2<\/span>/);
  });

  it("renders compact labels and preserves full platform descriptions in titles for mobile profiles", () => {
    const androidHeadingDef = ANDROID_NATIVE_PROFILE.semantics["heading"];
    expect(androidHeadingDef).toBeDefined();

    const html = renderToString(
      <ShapeSemanticSection
        selectedShape={shape}
        activeProfile={ANDROID_NATIVE_PROFILE}
        conflict={undefined}
        semanticDef={androidHeadingDef}
        semanticProps={{ level: "1" }}
        handleSetSemantic={vi.fn()}
        handlePropertyChange={vi.fn()}
      />,
    );

    // Segmented control with compact H1..H6 button labels
    expect(html).toContain("od-segmented");
    expect(html).toContain("<span>H1</span>");
    expect(html).toContain("<span>H2</span>");

    // Title / tooltip includes full platform descriptor
    expect(html).toContain('title="H1 / Display"');
    expect(html).toContain('title="H2 / Headline Large"');

    // H1 active
    expect(html).toMatch(/aria-pressed="true"[^>]*><span>H1<\/span>/);
  });

  it("renders heading level as segmented control in ComponentSemanticSection", () => {
    const webHeadingDef = WEB_PROFILE.semantics["heading"];
    expect(webHeadingDef).toBeDefined();

    const html = renderToString(
      <ComponentSemanticSection
        selectedShape={shape}
        activeProfile={WEB_PROFILE}
        conflict={undefined}
        semanticDef={webHeadingDef}
        semanticProps={{ level: "3" }}
        handleSetContent={vi.fn()}
        handleSetSemantic={vi.fn()}
        handlePropertyChange={vi.fn()}
        handleStyleChange={vi.fn()}
        handleStylePreview={vi.fn()}
        handleStyleCommit={vi.fn()}
      />,
    );

    expect(html).toContain("od-segmented");
    expect(html).toContain("od-segmented--full");
    expect(html).toMatch(/aria-pressed="true"[^>]*><span>H3<\/span>/);
  });
});
