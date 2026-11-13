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
    id: LANDING_DESIGN_STYLES.brutalist,
    name: "Brutalist",
    description: "Bold, expressive and unconventional.",
  },
  {
    id: LANDING_DESIGN_STYLES.soft,
    name: "Soft",
    description: "Warm, tactile and approachable.",
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
        padding: "48px 24px",
        maxWidth: "1080px",
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        gap: "28px",
      }}
    >
      {/* Main Section Heading (s-7a16) */}
      <h2
        id="features-heading"
        style={{
          fontFamily: theme.headingFont,
          color: theme.textPrimary,
          fontSize: "clamp(24px, 3.5vw, 36px)",
          fontWeight: 800,
          margin: 0,
          lineHeight: 1.25,
        }}
      >
        Same structure. Different design languages.
      </h2>

      {/* Style Personality Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
    </section>
  );
}
