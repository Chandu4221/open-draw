import React from "react";
import {
  LANDING_DESIGN_STYLES,
  type LandingDesignStyle,
  type LandingThemeTokens,
} from "./landing-styles.js";

export interface LandingFeaturesProps {
  readonly theme: LandingThemeTokens;
  readonly activeStyle: LandingDesignStyle;
  readonly onStyleChange: (style: LandingDesignStyle) => void;
}

interface StyleFeatureItem {
  readonly id: LandingDesignStyle;
  readonly name: string;
  readonly description: string;
}

const STYLE_FEATURES: readonly StyleFeatureItem[] = [
  {
    id: LANDING_DESIGN_STYLES.minimal,
    name: "Minimal",
    description: "Clean, elegant and distraction-free.",
  },
  {
    id: LANDING_DESIGN_STYLES.brutalist,
    name: "Brutalist",
    description: "Bold, expressive and unconventional.",
  },
  {
    id: LANDING_DESIGN_STYLES.glass,
    name: "Glass",
    description: "Modern, translucent and layered.",
  },
  {
    id: LANDING_DESIGN_STYLES.editorial,
    name: "Editorial",
    description: "Typography-driven and expressive.",
  },
  {
    id: LANDING_DESIGN_STYLES.retro,
    name: "Retro",
    description: "Nostalgic with a contemporary twist.",
  },
];

export function LandingFeatures({
  theme,
  activeStyle,
  onStyleChange,
}: LandingFeaturesProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="features-heading"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "64px 24px",
        maxWidth: "1080px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        gap: "36px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          maxWidth: "760px",
        }}
      >
        {/* Main Section Heading (s-7a08) */}
        <h2
          id="features-heading"
          style={{
            fontFamily: theme.headingFont,
            color: theme.textPrimary,
            fontSize: "clamp(26px, 4vw, 40px)",
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          One Design, Many Possibilities
        </h2>

        {/* Subhead (s-7a09) */}
        <p
          style={{
            fontFamily: theme.headingFont,
            color: theme.textSecondary,
            fontSize: "clamp(16px, 2.5vw, 20px)",
            fontWeight: 600,
            margin: 0,
          }}
        >
          What if you could change the entire visual identity of a website without redesigning
        </p>

        {/* Narrative Description (s-7a0a) */}
        <p
          style={{
            fontFamily: theme.bodyFont,
            color: theme.textSecondary,
            fontSize: "15px",
            lineHeight: 1.6,
            margin: 0,
            maxWidth: "640px",
          }}
        >
          With Open Draw, generate your markup once and explore multiple design languages using the
          same underlying structure.
        </p>
      </div>

      {/* Style Personality Grid (s-7a0b & s-7a0c) */}
      <div style={{ width: "100%" }}>
        <p
          style={{
            fontFamily: theme.headingFont,
            color: theme.textPrimary,
            fontSize: "14px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          One markup. Multiple design experiences. —
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          {STYLE_FEATURES.map((feat) => {
            const isSelected = activeStyle === feat.id;
            return (
              <button
                key={feat.id}
                type="button"
                onClick={() => onStyleChange(feat.id)}
                aria-pressed={isSelected}
                style={{
                  ...theme.card,
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  gap: "8px",
                  cursor: "pointer",
                  outline: isSelected ? `2px solid ${theme.accent}` : "none",
                  outlineOffset: "2px",
                  position: "relative",
                  background: isSelected
                    ? theme.id === "glass"
                      ? "rgba(255, 255, 255, 0.12)"
                      : undefined
                    : undefined,
                }}
              >
                <div
                  style={{
                    fontFamily: theme.headingFont,
                    fontWeight: 800,
                    fontSize: "15px",
                    color: theme.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <span>{feat.name}</span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: theme.accent,
                        color: theme.id === "brutalist" ? "#000000" : "#ffffff",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: theme.bodyFont,
                    fontSize: "13px",
                    lineHeight: 1.5,
                    color: theme.textSecondary,
                  }}
                >
                  {feat.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rhetorical closer prompt (s-7a0d) */}
      <p
        style={{
          fontFamily: theme.headingFont,
          color: theme.accent,
          fontSize: "18px",
          fontWeight: 700,
          fontStyle: "italic",
          margin: 0,
        }}
      >
        Why redesign when you can reimagine?
      </p>
    </section>
  );
}
