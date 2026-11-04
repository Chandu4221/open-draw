// Profile-aware display name chain resolver (ADR-0004 D2, Ruling 9, R-042).
// Full chain: label -> semantic display name (from profile data) -> shape kind label.
import type { PlatformProfile } from "@open-draw/contracts";
import { ROOT_ROLES, SHAPE_KINDS, SHAPE_KIND_LABELS, isRootId } from "@open-draw/contracts";
import { getDisplayName, type Shape } from "@open-draw/document";

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
  if (isRootId(shape.parent)) {
    if (shape.meta.role === ROOT_ROLES.component) {
      if (shape.meta.semantic !== undefined && profile !== undefined) {
        const definition = profile.semantics[shape.meta.semantic.id];
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
  if (shape.meta.semantic !== undefined && profile !== undefined) {
    const definition = profile.semantics[shape.meta.semantic.id];
    if (definition !== undefined && definition.displayName !== "") {
      return definition.displayName;
    }
  }
  return getDisplayName(shape);
}
