import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { WEB_PROFILE, ANDROID_NATIVE_PROFILE } from "@open-draw/profiles";
import { SemanticSelect } from "./SemanticSelect";

describe("SemanticSelect", () => {
  it("renders trigger showing '(None / Baseline)' when no tag is selected", () => {
    const html = renderToString(
      <SemanticSelect activeProfile={WEB_PROFILE} selectedTag="" onSelect={vi.fn()} />,
    );

    expect(html).toContain("od-combobox");
    expect(html).toContain("(None / Baseline)");
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("renders trigger showing selected semantic display name and id badge", () => {
    const html = renderToString(
      <SemanticSelect activeProfile={WEB_PROFILE} selectedTag="button" onSelect={vi.fn()} />,
    );

    expect(html).toContain("Button");
    expect(html).toContain("(button)");
  });

  it("renders open popover with search box and grouped categories when initialOpen is true", () => {
    const html = renderToString(
      <SemanticSelect
        activeProfile={ANDROID_NATIVE_PROFILE}
        selectedTag=""
        onSelect={vi.fn()}
        initialOpen={true}
      />,
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("od-combobox-popover");
    expect(html).toContain('placeholder="Search semantic tags..."');
    expect(html).toContain("Navigation");
    expect(html).toContain("Top App Bar");
    expect(html).toContain("Material Card");
  });

  it("filters semantics in open popover when initialQuery is provided", () => {
    const html = renderToString(
      <SemanticSelect
        activeProfile={ANDROID_NATIVE_PROFILE}
        selectedTag=""
        onSelect={vi.fn()}
        initialOpen={true}
        initialQuery="card"
      />,
    );

    expect(html).toContain("Material Card");
    expect(html).not.toContain("Top App Bar");
  });
});
