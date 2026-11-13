import React from "react";
import {
  LANDING_DESIGN_STYLES,
  type LandingDesignStyle,
  type LandingThemeTokens,
} from "./landing-styles.js";

export interface LandingStyleSwitcherProps {
  readonly activeStyle: LandingDesignStyle;
  readonly onStyleChange: (style: LandingDesignStyle) => void;
  readonly theme: LandingThemeTokens;
}

export function LandingStyleSwitcher({
  activeStyle,
  onStyleChange,
  theme,
}: LandingStyleSwitcherProps): React.JSX.Element {
  const stylesList: readonly LandingDesignStyle[] = [
    LANDING_DESIGN_STYLES.minimal,
    LANDING_DESIGN_STYLES.brutalist,
    LANDING_DESIGN_STYLES.glass,
    LANDING_DESIGN_STYLES.editorial,
    LANDING_DESIGN_STYLES.retro,
  ];

  const getContainerStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      padding: "6px 8px",
      flexWrap: "wrap",
    };

    if (theme.id === "brutalist") {
      return {
        ...base,
        borderRadius: "0px",
        backgroundColor: "#ffffff",
        border: "2px solid #000000",
        boxShadow: "3px 3px 0px #000000",
      };
    }
    if (theme.id === "glass") {
      return {
        ...base,
        borderRadius: "999px",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      };
    }
    if (theme.id === "retro") {
      return {
        ...base,
        borderRadius: "0px",
        backgroundColor: "#c0c0c0",
        borderWidth: "2px",
        borderStyle: "solid",
        borderTopColor: "#ffffff",
        borderLeftColor: "#ffffff",
        borderRightColor: "#808080",
        borderBottomColor: "#808080",
        boxShadow: "2px 2px 0px #000000",
      };
    }
    if (theme.id === "editorial") {
      return {
        ...base,
        borderRadius: "2px",
        backgroundColor: "#ffffff",
        border: "1px solid #d6d3d1",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      };
    }
    // minimal
    return {
      ...base,
      borderRadius: "999px",
      backgroundColor: "#ffffff",
      border: "1px solid #e2e8f0",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    };
  };

  const getButtonStyle = (styleKey: LandingDesignStyle, isActive: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      padding: "6px 14px",
      fontSize: "12px",
      cursor: "pointer",
      transition: "all 0.15s ease",
      fontFamily: theme.headingFont,
      fontWeight: isActive ? 800 : 500,
    };

    if (theme.id === "brutalist") {
      return {
        ...base,
        borderRadius: "0px",
        backgroundColor: isActive ? "#facc15" : "transparent",
        color: "#000000",
        border: isActive ? "2px solid #000000" : "2px solid transparent",
        boxShadow: isActive ? "2px 2px 0px #000000" : "none",
      };
    }
    if (theme.id === "glass") {
      return {
        ...base,
        borderRadius: "999px",
        backgroundColor: isActive ? "rgba(168, 85, 247, 0.7)" : "rgba(255, 255, 255, 0.04)",
        color: isActive ? "#ffffff" : theme.textSecondary,
        boxShadow: isActive ? "0 0 12px rgba(168, 85, 247, 0.5)" : "none",
        border: isActive ? "1px solid rgba(255, 255, 255, 0.4)" : "1px solid transparent",
      };
    }
    if (theme.id === "retro") {
      return {
        ...base,
        borderRadius: "0px",
        backgroundColor: "#c0c0c0",
        color: isActive ? "#000080" : "#000000",
        borderWidth: "2px",
        borderStyle: "solid",
        borderTopColor: isActive ? "#808080" : "#ffffff",
        borderLeftColor: isActive ? "#808080" : "#ffffff",
        borderRightColor: isActive ? "#ffffff" : "#808080",
        borderBottomColor: isActive ? "#ffffff" : "#808080",
      };
    }
    if (theme.id === "editorial") {
      return {
        ...base,
        borderRadius: "2px",
        backgroundColor: isActive ? "#1c1917" : "transparent",
        color: isActive ? "#fcf9f2" : theme.textSecondary,
        border: "1px solid transparent",
      };
    }
    // minimal
    return {
      ...base,
      borderRadius: "999px",
      backgroundColor: isActive ? "#0f172a" : "transparent",
      color: isActive ? "#ffffff" : theme.textSecondary,
      border: "1px solid transparent",
    };
  };

  return (
    <div role="region" aria-label="Design Style Switcher" style={getContainerStyle()}>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: theme.textMuted,
          padding: "0 8px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Style:
      </span>

      {stylesList.map((styleKey) => {
        const isActive = activeStyle === styleKey;
        const label = styleKey.charAt(0).toUpperCase() + styleKey.slice(1);

        return (
          <button
            key={styleKey}
            type="button"
            onClick={() => onStyleChange(styleKey)}
            style={getButtonStyle(styleKey, isActive)}
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
