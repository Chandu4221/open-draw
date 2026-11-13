import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { CanvasBrand } from "./CanvasBrand.js";

describe("CanvasBrand", () => {
  it("renders the OpenDraw Studio logo brand with home link and accessibility label", () => {
    const onBackToLanding = vi.fn();
    const html = renderToString(<CanvasBrand onBackToLanding={onBackToLanding} />);

    expect(html).toContain("OpenDraw");
    expect(html).toContain("Studio");
    expect(html).toContain('aria-label="OpenDraw Studio - Back to home page"');
    expect(html).toContain('href="#home"');
  });

  it("renders without back link when onBackToLanding is not provided", () => {
    const html = renderToString(<CanvasBrand />);

    expect(html).toContain("OpenDraw");
    expect(html).toContain("Studio");
  });
});
