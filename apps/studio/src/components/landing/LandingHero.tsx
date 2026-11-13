import React from "react";
import type { LandingThemeTokens } from "./landing-styles.js";

export interface LandingHeroProps {
  readonly theme: LandingThemeTokens;
  readonly onLaunch: () => void;
}

export function LandingHero({ theme, onLaunch }: LandingHeroProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="hero-heading"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "80px 24px 64px 24px",
        maxWidth: "880px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        gap: "28px",
      }}
    >
      {/* Kicker / Banner Badge (s-7a03) */}
      <div style={theme.badge}>From ideas to interfaces. Without limits.</div>

      {/* Main Statement Headline (s-7a04) */}
      <h1
        id="hero-heading"
        style={{
          fontFamily: theme.headingFont,
          color: theme.textPrimary,
          fontSize: "clamp(32px, 5vw, 54px)",
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: theme.id === "brutalist" ? "-0.04em" : "-0.02em",
          margin: 0,
          maxWidth: "820px",
        }}
      >
        Design your ideas visually, give them meaning, and transform them into working interfaces.
      </h1>

      {/* Subhead / Bridge text (s-7a05) */}
      <p
        style={{
          fontFamily: theme.bodyFont,
          color: theme.textSecondary,
          fontSize: "clamp(16px, 2vw, 19px)",
          lineHeight: 1.6,
          maxWidth: "680px",
          margin: 0,
        }}
      >
        Open Draw bridges the gap between visual design and frontend development — helping you move
        from a blank canvas to real, usable code.
      </p>

      {/* Primary CTA (s-7a06) */}
      <div style={{ paddingTop: "12px" }}>
        <button
          type="button"
          onClick={onLaunch}
          style={{
            ...theme.primaryButton,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            padding: "16px 36px",
            minHeight: "48px",
            minWidth: "180px",
            lineHeight: 1.2,
            boxSizing: "border-box",
          }}
        >
          Try Open Draw
        </button>
      </div>
    </section>
  );
}
