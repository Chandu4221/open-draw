// Semantic wireframing contracts (ADR-0004 D1, D6).
// Zero dependencies, zero behavior beyond constants and boundary validation (R-006).
import type { PlatformId } from "./platforms";

/**
 * Branded semantic identifier matching `/^[a-z0-9-]+$/`.
 * Serialized in kebab-case per R-014.
 */
export type SemanticId = string & { readonly __brand: unique symbol };

const SEMANTIC_ID_REGEX = /^[a-z0-9-]+$/;

export function isValidSemanticId(value: string): boolean {
  return SEMANTIC_ID_REGEX.test(value);
}

export function parseSemanticId(value: string): SemanticId {
  if (!isValidSemanticId(value)) {
    throw new Error(`invalid semantic id: ${JSON.stringify(value)}`);
  }
  return value as SemanticId;
}

/**
 * Closed registry of high-level semantic categories.
 */
export const SEMANTIC_CATEGORIES = {
  layout: "layout",
  navigation: "navigation",
  marketing: "marketing",
  ecommerce: "ecommerce",
  auth: "auth",
  interactive: "interactive",
  forms: "forms",
  data: "data",
  content: "content",
  feedback: "feedback",
} as const;

export type SemanticCategory = (typeof SEMANTIC_CATEGORIES)[keyof typeof SEMANTIC_CATEGORIES];

export const SEMANTIC_CATEGORY_VALUES: ReadonlySet<string> = new Set(
  Object.values(SEMANTIC_CATEGORIES),
);

export function isValidSemanticCategory(value: unknown): value is SemanticCategory {
  return typeof value === "string" && SEMANTIC_CATEGORY_VALUES.has(value);
}

/**
 * Closed registry of inspector property control types.
 */
export const CONTROL_TYPES = {
  text: "text",
  select: "select",
  toggle: "toggle",
  number: "number",
} as const;

export type ControlId = (typeof CONTROL_TYPES)[keyof typeof CONTROL_TYPES];

export interface PropertyOption {
  readonly value: string;
  readonly label: string;
}

export interface PropertyRange {
  readonly min: number;
  readonly max: number;
  readonly step?: number;
}

/**
 * Pure data schema driving data-driven inspector controls for a semantic tag (ADR-0004 D6).
 */
export interface PropertySchema {
  readonly id: string;
  readonly control: ControlId;
  readonly label: string;
  readonly defaultValue?: string | number | boolean;
  readonly options?: readonly PropertyOption[];
  readonly range?: PropertyRange;
}

/**
 * Semantic conflict status constants (ADR-0004 D3, R-025).
 */
export const SEMANTIC_CONFLICTS = {
  valid: "valid",
  conflicted: "conflicted",
  unknown: "unknown",
} as const;

export type SemanticConflictStatus = (typeof SEMANTIC_CONFLICTS)[keyof typeof SEMANTIC_CONFLICTS];

/**
 * Diagnostic record produced by pure conflict computation (never stored in document).
 */
export interface SemanticConflict {
  readonly status: SemanticConflictStatus;
  readonly expectedPlatform?: PlatformId;
  readonly actualPlatform?: PlatformId;
  readonly reason?: string;
}
