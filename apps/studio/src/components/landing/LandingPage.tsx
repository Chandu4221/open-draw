import React, { useState } from "react";
import { CANVAS_VERSION } from "@open-draw/canvas";
import {
  LANDING_DESIGN_STYLES,
  LANDING_THEMES,
  type LandingDesignStyle,
} from "./landing-styles.js";
import { LandingStyleSwitcher } from "./LandingStyleSwitcher.js";
import { LandingHero } from "./LandingHero.js";
import { LandingFeatures } from "./LandingFeatures.js";
import { LandingPillars } from "./LandingPillars.js";
import { LandingClosingCta } from "./LandingClosingCta.js";
import { LandingFooter } from "./LandingFooter.js";

export interface LandingPageProps {
  readonly onLaunch: () => void;
  readonly initialStyle?: LandingDesignStyle;
}

export function LandingPage({
  onLaunch,
  initialStyle = LANDING_DESIGN_STYLES.minimal,
}: LandingPageProps): React.JSX.Element {
  const [activeStyle, setActiveStyle] = useState<LandingDesignStyle>(initialStyle);
  const theme = LANDING_THEMES[activeStyle];

  return (
    <div
      data-landing-style={activeStyle}
      style={{
        ...theme.pageContainer,
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* Top Header / Navigation Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxSizing: "border-box",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom:
            theme.id === "brutalist"
              ? "2px solid #000000"
              : theme.id === "retro"
                ? "2px solid #808080"
                : "1px solid rgba(0, 0, 0, 0.08)",
          backgroundColor:
            theme.id === "glass"
              ? "rgba(9, 13, 22, 0.75)"
              : theme.id === "brutalist"
                ? "#fef9c3"
                : theme.id === "retro"
                  ? "#008080"
                  : theme.id === "editorial"
                    ? "rgba(252, 249, 242, 0.9)"
                    : "rgba(250, 250, 250, 0.9)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: theme.headingFont,
              fontSize: "16px",
              fontWeight: 900,
              letterSpacing: "0.04em",
              color: theme.textPrimary,
            }}
          >
            OpenDraw
          </span>
          <span style={theme.badge}>v{CANVAS_VERSION}</span>
        </div>

        {/* Global Style Switcher in Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <LandingStyleSwitcher
            activeStyle={activeStyle}
            onStyleChange={setActiveStyle}
            theme={theme}
          />
          <button
            type="button"
            onClick={onLaunch}
            style={{
              ...theme.primaryButton,
              padding: "8px 18px",
              fontSize: "13px",
              minHeight: "36px",
            }}
          >
            Try OpenDraw
          </button>
        </div>
      </header>

      {/* Main Semantic Sections */}
      <main
        style={{
          flex: "1 0 auto",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          overflow: "visible",
        }}
      >
        <LandingHero theme={theme} onLaunch={onLaunch} />

        <div
          style={{ margin: "0 auto", maxWidth: "960px", width: "90%", ...theme.sectionDivider }}
        />

        <LandingFeatures theme={theme} activeStyle={activeStyle} onStyleChange={setActiveStyle} />

        <div
          style={{ margin: "0 auto", maxWidth: "960px", width: "90%", ...theme.sectionDivider }}
        />

        <LandingPillars theme={theme} />

        <div
          style={{ margin: "0 auto", maxWidth: "960px", width: "90%", ...theme.sectionDivider }}
        />

        <LandingClosingCta theme={theme} onLaunch={onLaunch} />
      </main>

      {/* Footer */}
      <LandingFooter theme={theme} />
    </div>
  );
}
