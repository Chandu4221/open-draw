// Profile-aware display name chain resolver (ADR-0004 D2, Ruling 9, R-042).
// Full chain: label -> semantic display name (from profile data) -> shape kind label.
import type { BuiltinShapeKind, Shape } from "@open-draw/canvas";
import { SHAPE_KINDS, SHAPE_KIND_LABELS, isRootId } from "@open-draw/canvas";
import type { PlatformId, PlatformProfile } from "@open-draw/profiles";
import { PLATFORMS } from "@open-draw/profiles";
import { ROOT_ROLES, type RootRole } from "./root-roles";
import { PLUGIN_ROOT_PLATFORM, PLUGIN_ROOT_ROLE, getShapeSemantic } from "./plugins";

export function getDisplayName(shape: Shape): string {
  if (shape.label !== undefined && shape.label !== "") {
    return shape.label;
  }
  return shape.kind in SHAPE_KIND_LABELS
    ? SHAPE_KIND_LABELS[shape.kind as BuiltinShapeKind]
    : shape.kind;
}

const ROOT_SEMANTIC_DISPLAY_NAMES: Readonly<Record<string, string>> = Object.freeze({
  page: "Page",
  screen: "Screen",
  scaffold: "Scaffold",
});

/**
 * Resolves the full display-name chain:
 * 1. shape.label (human-authored override)
 * 2. profile rootSemantic label (for root shapes with screen role)
 * 3. profile semantic displayName (if tagged and known in profile)
 * 4. shape kind label (fallback from SHAPE_KIND_LABELS)
 */
export function resolveShapeDisplayName(shape: Shape, profile?: PlatformProfile): string {
  if (shape.label !== undefined && shape.label !== "") {
    return shape.label;
  }
  const semantic = getShapeSemantic(shape);
  const role =
    (shape.meta.pluginData?.[PLUGIN_ROOT_ROLE] as RootRole | undefined) ??
    (shape.meta.role as RootRole | undefined);

  if (isRootId(shape.parentId)) {
    if (role === ROOT_ROLES.component) {
      if (semantic !== undefined && profile !== undefined) {
        const definition = profile.semantics[semantic.id];
        if (definition !== undefined && definition.displayName !== "") {
          return definition.displayName;
        }
      }
      return "Component";
    }
    if (profile?.rootSemantic !== undefined) {
      return (
        ROOT_SEMANTIC_DISPLAY_NAMES[profile.rootSemantic] ??
        profile.rootSemantic.charAt(0).toUpperCase() + profile.rootSemantic.slice(1)
      );
    }
    if (shape.kind === SHAPE_KINDS.page) {
      return SHAPE_KIND_LABELS[SHAPE_KINDS.page];
    }
  }
  if (semantic !== undefined && profile !== undefined) {
    const definition = profile.semantics[semantic.id];
    if (definition !== undefined && definition.displayName !== "") {
      return definition.displayName;
    }
  }
  return getDisplayName(shape);
}

/**
 * Resolves the semantic type classification for a shape (e.g. for Layers panel badges)
 * following R-023, R-024, R-026, R-042:
 * 1. Root shape:
 *    - Platform-Agnostic / None: default geometric shape kind label (e.g. "Rectangle", "Ellipse", "Text")
 *    - Component role: "Component" (or semantic displayName if tagged)
 *    - Web platform: "Page"
 *    - Android / Flutter / iOS / other platforms: "Screen"
 * 2. Child shape:
 *    - Tagged with semantic: semantic displayName from active profile
 *    - Untagged: undefined (no badge)
 */
export function resolveShapeSemanticType(
  shape: Shape,
  profile?: PlatformProfile,
): string | undefined {
  const semantic = getShapeSemantic(shape);
  const role =
    (shape.meta.pluginData?.[PLUGIN_ROOT_ROLE] as RootRole | undefined) ??
    (shape.meta.role as RootRole | undefined);
  const platform =
    (shape.meta.pluginData?.[PLUGIN_ROOT_PLATFORM] as PlatformId | undefined) ??
    (shape.meta.platform as PlatformId | undefined);

  if (isRootId(shape.parentId)) {
    // Platform-Agnostic mode (R-024, Ruling 10)
    if (platform === undefined) {
      return SHAPE_KIND_LABELS[shape.kind as BuiltinShapeKind] ?? shape.kind;
    }

    // Root component role
    if (role === ROOT_ROLES.component) {
      if (semantic !== undefined && profile !== undefined) {
        const definition = profile.semantics[semantic.id];
        if (definition !== undefined && definition.displayName !== "") {
          return definition.displayName;
        }
      }
      return "Component";
    }

    // Root screen / page role (defaults to screen role per R-024)
    const effectivePlatform = platform ?? profile?.id;
    if (
      effectivePlatform === PLATFORMS.web ||
      profile?.id === PLATFORMS.web ||
      profile?.rootSemantic === "page"
    ) {
      return "Page";
    }
    return "Screen";
  }

  // Child shape: returns profile semantic displayName if tagged, undefined if untagged
  if (semantic !== undefined && profile !== undefined) {
    const definition = profile.semantics[semantic.id];
    if (definition !== undefined && definition.displayName !== "") {
      return definition.displayName;
    }
  }
  return undefined;
}
