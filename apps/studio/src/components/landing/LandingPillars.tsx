import React from "react";
import type { LandingThemeTokens } from "./landing-styles.js";

export interface LandingPillarsProps {
  readonly theme: LandingThemeTokens;
}

interface PillarItem {
  readonly number: string;
  readonly title: string;
  readonly description: string;
}

const PILLARS: readonly PillarItem[] = [
  {
    number: "01",
    title: "Draw on a real canvas",
    description: "Build layouts with shapes, hierarchy, and structure.",
  },
  {
    number: "02",
    title: "Tag components with meaning",
    description: "Mark what each element is—button, nav, form, screen.",
  },
  {
    number: "03",
    title: "Export structured markup",
    description: "Turn the document into specs and frontend-ready output.",
  },
  {
    number: "04",
    title: "Swap styles without redrawing",
    description: "Explore visual languages on the same underlying structure.",
  },
];

export function LandingPillars({ theme }: LandingPillarsProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="pillars-heading"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "64px 24px",
        maxWidth: "1120px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        gap: "36px",
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "10px",
          maxWidth: "760px",
        }}
      >
        <h2
          id="pillars-heading"
          style={{
            fontFamily: theme.headingFont,
            color: theme.textPrimary,
            fontSize: "clamp(26px, 4vw, 38px)",
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          More than shapes on a canvas.
        </h2>
      </div>

      {/* Clean 4-Card Pillars Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          width: "100%",
          alignItems: "stretch",
        }}
      >
        {PILLARS.map((pillar) => (
          <div
            key={pillar.number}
            style={{
              ...theme.card,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
              }}
            >
              <span
                style={{
                  fontFamily: theme.headingFont,
                  fontSize: "13px",
                  fontWeight: 900,
                  color: theme.accent,
                  letterSpacing: "0.08em",
                }}
              >
                {`${pillar.number} —`}
              </span>
              <h3
                style={{
                  fontFamily: theme.headingFont,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: theme.textPrimary,
                  margin: 0,
                }}
              >
                {pillar.title}
              </h3>
            </div>
            <p
              style={{
                fontFamily: theme.bodyFont,
                fontSize: "13px",
                lineHeight: 1.55,
                color: theme.textSecondary,
                margin: 0,
              }}
            >
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
