// @open-draw/semantics — pure semantic wireframing layer (ADR-0004).
// Pure data & functions; handles root resolution, semantic tagging,
// conflict evaluation, display-name resolution, and hierarchical tree walks.
export * from "./root-roles";
export * from "./compute-conflict";
export * from "./display-name";
export * from "./resolve-root";
export * from "./resolve-semantic";
export * from "./tree-walk";
export * from "./harmonization";
export * from "./version";
export * from "./plugins";

export type {
  ControlId,
  PropertyOption,
  PropertyRange,
  PropertySchema,
  SemanticCategory,
  SemanticConflict,
  SemanticConflictStatus,
  SemanticDefinition,
  SemanticId,
  SemanticTag,
  PlatformId,
  ThemePalette,
  ThemePaletteSlot,
  DesignStyleId,
  PlatformProfile,
  StyleProfile,
  StyleId,
} from "@open-draw/profiles";
export {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  SEMANTIC_CONFLICTS,
  isValidSemanticCategory,
  isValidSemanticId,
  parseSemanticId,
  PLATFORMS,
  PLATFORM_BY_VALUE,
  isPlatformId,
  THEME_PALETTE_SLOTS,
  DESIGN_STYLES,
  DESIGN_STYLE_LABELS,
  DESIGN_STYLE_BY_VALUE,
  isDesignStyle,
  STYLE_PROFILES,
  PLATFORM_PROFILES,
} from "@open-draw/profiles";
