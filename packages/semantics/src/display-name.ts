// Profile-aware display name chain resolver (ADR-0004 D2, Ruling 9, R-042).
// Full chain: label -> semantic display name (from profile data) -> shape kind label.
import type { PlatformProfile } from "@open-draw/contracts";
import { getDisplayName, type Shape } from "@open-draw/document";

/**
 * Resolves the full display-name chain:
 * 1. shape.label (human-authored override)
 * 2. profile semantic displayName (if tagged and known in profile)
 * 3. shape kind label (fallback from SHAPE_KIND_LABELS)
 */
export function resolveShapeDisplayName(shape: Shape, profile?: PlatformProfile): string {
  if (shape.label !== undefined && shape.label !== "") {
    return shape.label;
  }
  if (shape.meta.semantic !== undefined && profile !== undefined) {
    const definition = profile.semantics[shape.meta.semantic.id];
    if (definition !== undefined && definition.displayName !== "") {
      return definition.displayName;
    }
  }
  return getDisplayName(shape);
}
