import React from "react";
import type { LandingThemeTokens } from "./landing-styles.js";

export interface LandingClosingCtaProps {
  readonly theme: LandingThemeTokens;
  readonly onLaunch: () => void;
}

export function LandingClosingCta({ theme, onLaunch }: LandingClosingCtaProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="closing-cta-heading"
      style={{
        padding: "80px 24px 64px 24px",
        maxWidth: "880px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
      }}
    >
      {/* Statement Heading (s-7a22) */}
      <h2
        id="closing-cta-heading"
        style={{
          fontFamily: theme.headingFont,
          color: theme.textPrimary,
          fontSize: "clamp(28px, 4.5vw, 46px)",
          fontWeight: 900,
          lineHeight: 1.2,
          letterSpacing: theme.id === "brutalist" ? "-0.03em" : "-0.01em",
          margin: 0,
          maxWidth: "760px",
        }}
      >
        Your ideas deserve more than a mockup. Start drawing. Give your ideas meaning. Bring them to
        life.
      </h2>

      {/* Launch Action Button (s-7a23) */}
      <div>
        <button
          type="button"
          onClick={onLaunch}
          style={{
            ...theme.primaryButton,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            padding: "16px 40px",
            minHeight: "48px",
            minWidth: "200px",
            lineHeight: 1.2,
            boxSizing: "border-box",
          }}
        >
          Launch App
        </button>
      </div>
    </section>
  );
}
