import React from "react";
import type { LandingThemeTokens } from "./landing-styles.js";

export interface LandingFooterProps {
  readonly theme: LandingThemeTokens;
}

export function LandingFooter({ theme }: LandingFooterProps): React.JSX.Element {
  return (
    <footer
      style={{
        ...theme.sectionDivider,
        padding: "36px 24px",
        marginTop: "48px",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          fontFamily: theme.bodyFont,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: theme.id === "retro" ? "#ffffff" : theme.textSecondary,
          textAlign: "center",
        }}
      >
        MADE WITH LOVE{" "}
        <span role="img" aria-label="love">
          ❤️
        </span>
      </p>
    </footer>
  );
}
