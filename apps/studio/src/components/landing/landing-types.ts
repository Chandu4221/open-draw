import type React from "react";

export const LANDING_DESIGN_STYLES = {
  minimal: "minimal",
  brutalist: "brutalist",
  glass: "glass",
  editorial: "editorial",
  retro: "retro",
} as const;

export type LandingDesignStyle = (typeof LANDING_DESIGN_STYLES)[keyof typeof LANDING_DESIGN_STYLES];

export interface LandingThemeTokens {
  readonly id: LandingDesignStyle;
  readonly label: string;
  readonly tagline: string;
  readonly pageContainer: React.CSSProperties;
  readonly card: React.CSSProperties;
  readonly primaryButton: React.CSSProperties;
  readonly secondaryButton: React.CSSProperties;
  readonly badge: React.CSSProperties;
  readonly sectionDivider: React.CSSProperties;
  readonly headingFont: string;
  readonly bodyFont: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly accent: string;
}
