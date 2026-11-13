import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { LANDING_DESIGN_STYLES } from "./landing-styles.js";
import { LandingPage } from "./LandingPage.js";
import { LandingHero } from "./LandingHero.js";
import { LandingFeatures } from "./LandingFeatures.js";
import { LandingPillars } from "./LandingPillars.js";
import { LandingClosingCta } from "./LandingClosingCta.js";
import { LandingFooter } from "./LandingFooter.js";
import { LandingStyleSwitcher } from "./LandingStyleSwitcher.js";
import { LANDING_THEMES } from "./landing-themes.js";

describe("LandingPage", () => {
  it("renders the landing page with minimal style active by default", () => {
    const onLaunch = vi.fn();
    const html = renderToString(<LandingPage onLaunch={onLaunch} />);

    expect(html).toContain('data-landing-style="minimal"');
    expect(html).toContain("Design interfaces visually. Add meaning. Ship code");
    expect(html).toContain(
      "Open Draw turns canvas wireframes into semantic structure and frontend markup.",
    );
    expect(html).toContain("Try OpenDraw");
    expect(html).toContain("Same structure. Different design languages.");
    expect(html).toContain("More than shapes on a canvas.");
    expect(html).toContain("Draw on a real canvas");
    expect(html).toContain("Start drawing. Add meaning. Ship the interface.");
  });

  it("renders with a custom initial design style when specified", () => {
    const onLaunch = vi.fn();
    const html = renderToString(
      <LandingPage onLaunch={onLaunch} initialStyle={LANDING_DESIGN_STYLES.brutalist} />,
    );

    expect(html).toContain('data-landing-style="brutalist"');
  });

  it("renders all 5 design styles distinctly", () => {
    const styles = [
      LANDING_DESIGN_STYLES.minimal,
      LANDING_DESIGN_STYLES.glass,
      LANDING_DESIGN_STYLES.editorial,
      LANDING_DESIGN_STYLES.brutalist,
      LANDING_DESIGN_STYLES.soft,
    ];

    for (const style of styles) {
      const html = renderToString(<LandingPage onLaunch={vi.fn()} initialStyle={style} />);
      expect(html).toContain(`data-landing-style="${style}"`);
    }
  });
});

describe("LandingHero", () => {
  it("renders the hero headline, kicker, and try open draw action", () => {
    const onLaunch = vi.fn();
    const theme = LANDING_THEMES.minimal;
    const html = renderToString(<LandingHero theme={theme} onLaunch={onLaunch} />);

    expect(html).toContain("Design interfaces visually. Add meaning. Ship code");
    expect(html).toContain(
      "Open Draw turns canvas wireframes into semantic structure and frontend markup.",
    );
    expect(html).toContain("Try OpenDraw");
  });
});

describe("LandingFeatures", () => {
  it("renders all five personality descriptions and the reimagining prompt", () => {
    const theme = LANDING_THEMES.minimal;
    const onStyleChange = vi.fn();
    const html = renderToString(
      <LandingFeatures
        theme={theme}
        activeStyle={LANDING_DESIGN_STYLES.minimal}
        onStyleChange={onStyleChange}
      />,
    );

    expect(html).toContain("Same structure. Different design languages.");
    expect(html).toContain("Minimal");
    expect(html).toContain("Clean, elegant and distraction-free.");
    expect(html).toContain("Glass");
    expect(html).toContain("Modern, translucent and layered.");
    expect(html).toContain("Editorial");
    expect(html).toContain("Typography-driven and expressive.");
    expect(html).toContain("Brutalist");
    expect(html).toContain("Bold, expressive and unconventional.");
    expect(html).toContain("Soft");
    expect(html).toContain("Warm, tactile and approachable.");
  });
});

describe("LandingPillars", () => {
  it("renders the combined philosophy manifesto and four numbered capabilities", () => {
    const theme = LANDING_THEMES.minimal;
    const html = renderToString(<LandingPillars theme={theme} />);

    expect(html).toContain("More than shapes on a canvas.");
    expect(html).toContain("Philosophy");
    expect(html).toContain("Design should not stop at pixels.");
    expect(html).toContain("When design understands meaning, it becomes more powerful.");
    expect(html).toContain(
      "Open Draw explores what happens when visual creativity meets semantic structure and code generation.",
    );
    expect(html).toContain("01 —");
    expect(html).toContain("Draw on a real canvas");
    expect(html).toContain("Build layouts with shapes, hierarchy, and structure.");
    expect(html).toContain("02 —");
    expect(html).toContain("Tag components with meaning");
    expect(html).toContain("Mark what each element is—button, nav, form, screen.");
    expect(html).toContain("03 —");
    expect(html).toContain("Export structured markup");
    expect(html).toContain("Turn the document into specs and frontend-ready output.");
    expect(html).toContain("04 —");
    expect(html).toContain("Swap styles without redrawing");
    expect(html).toContain("Explore visual languages on the same underlying structure.");
  });
});

describe("LandingClosingCta", () => {
  it("renders the final call to action with launch app button", () => {
    const theme = LANDING_THEMES.minimal;
    const onLaunch = vi.fn();
    const html = renderToString(<LandingClosingCta theme={theme} onLaunch={onLaunch} />);

    expect(html).toContain("Start drawing. Add meaning. Ship the interface.");
    expect(html).toContain("Open Draw is the canvas between visual design and working markup.");
    expect(html).toContain("Try OpenDraw");
  });
});

describe("LandingFooter", () => {
  it("renders centered made with love with a11y label and without opendraw or npm link", () => {
    const theme = LANDING_THEMES.minimal;
    const html = renderToString(<LandingFooter theme={theme} />);

    expect(html).toContain("MADE WITH LOVE");
    expect(html).toContain('role="img" aria-label="love"');
    expect(html).not.toContain("OpenDraw");
    expect(html).not.toContain("npm");
    expect(html).not.toContain("GitHub");
    expect(html).not.toContain("MIT License");
  });
});

describe("LandingStyleSwitcher", () => {
  it("marks the active style with aria-pressed attribute", () => {
    const theme = LANDING_THEMES.glass;
    const onStyleChange = vi.fn();
    const html = renderToString(
      <LandingStyleSwitcher
        theme={theme}
        activeStyle={LANDING_DESIGN_STYLES.glass}
        onStyleChange={onStyleChange}
      />,
    );

    expect(html).toContain('aria-label="Design Style Switcher"');
    // Button for Glass should be aria-pressed="true"
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>\s*Glass\s*<\/button>/);
  });
});
