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
    title: "Visual Design",
    description: "Create interfaces intuitively using a flexible visual canvas.",
  },
  {
    number: "02",
    title: "Semantic Intelligence",
    description: "Go beyond rectangles and lines. Give your components meaning and structure.",
  },
  {
    number: "03",
    title: "Code Generation",
    description: "Turn your visual compositions into actual frontend markup.",
  },
  {
    number: "04",
    title: "Design Exploration",
    description:
      "Experiment with different visual styles without rebuilding the underlying interface.",
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

      {/* Combined Philosophy & Pillars Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          width: "100%",
          alignItems: "stretch",
        }}
      >
        {/* Left Column: Philosophy Manifesto Card */}
        <div
          style={{
            ...theme.card,
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "20px",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                ...theme.badge,
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Philosophy
            </span>
          </div>

          <blockquote
            style={{
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <p
              style={{
                fontFamily: theme.headingFont,
                color: theme.textPrimary,
                fontSize: "clamp(18px, 2.2vw, 22px)",
                lineHeight: 1.45,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Design should not stop at pixels. A button is more than a rectangle. A navigation bar
              is more than a collection of shapes. A screen is more than a collection of visual
              elements.
            </p>

            <p
              style={{
                fontFamily: theme.bodyFont,
                color: theme.accent,
                fontSize: "clamp(16px, 1.8vw, 20px)",
                lineHeight: 1.4,
                fontWeight: 600,
                fontStyle: theme.id === "editorial" ? "italic" : "normal",
                margin: 0,
              }}
            >
              When design understands meaning, it becomes more powerful.
            </p>

            <p
              style={{
                fontFamily: theme.bodyFont,
                color: theme.textSecondary,
                fontSize: "14px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Open Draw explores what happens when visual creativity meets semantic structure and
              code generation.
            </p>
          </blockquote>
        </div>

        {/* Right Column: 4 Capability Pillars Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            alignContent: "stretch",
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
      </div>
    </section>
  );
}
