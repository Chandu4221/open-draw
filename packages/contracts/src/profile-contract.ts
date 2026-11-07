// Platform and style profile contracts (ADR-0004 D5, D7).
// Zero dependencies, pure data types and registries (R-005, R-023, R-026).
import type { DeviceType } from "./device-types";
import type { PlatformId } from "./platforms";
import type { PropertySchema, SemanticId } from "./semantic-contract";

/**
 * Closed registry of style profiles.
 * Milestone 05 ships `minimal`; additional styles (crayon, etc.) arrive in Milestone 06.
 */
export const STYLE_PROFILES = {
  minimal: "minimal",
  crayon: "crayon",
} as const;

export type StyleId = keyof typeof STYLE_PROFILES;

export const STYLE_PROFILE_BY_VALUE: Readonly<Record<string, StyleId>> = Object.fromEntries(
  (Object.keys(STYLE_PROFILES) as StyleId[]).map((style) => [STYLE_PROFILES[style], style]),
);

/**
 * Definition of a single semantic tag within a platform profile.
 */
export interface SemanticDefinition {
  readonly id: SemanticId;
  readonly displayName: string;
  readonly properties?: readonly PropertySchema[];
}

/**
 * Platform profile contract. Platform profiles are data modules;
 * adding a platform = data module, zero engine code (R-023).
 */
export interface PlatformProfile {
  readonly id: PlatformId;
  readonly label: string;
  readonly rootSemantic: SemanticId;
  readonly deviceTypes?: readonly DeviceType[];
  readonly semantics: Readonly<Record<string, SemanticDefinition>>;
}

/**
 * Style profile contract (R-026).
 */
export interface StyleProfile {
  readonly id: StyleId;
  readonly label: string;
}

/**
 * Closed registry of theme palette color slots (Idea 6, R-026).
 */
export const THEME_PALETTE_SLOTS = [
  "primary",
  "secondary",
  "tertiary",
  "surface",
  "error",
  "success",
] as const;

export type ThemePaletteSlot = (typeof THEME_PALETTE_SLOTS)[number];

/**
 * Root container semantic theme palette (Idea 6, R-026).
 * Carries brand theme tokens for AI prompt export (Tailwind, Flutter, Compose).
 */
export interface ThemePalette {
  readonly primary?: string;
  readonly secondary?: string;
  readonly tertiary?: string;
  readonly surface?: string;
  readonly error?: string;
  readonly success?: string;
}
