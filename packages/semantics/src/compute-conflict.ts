// Computed foreign-tag conflict evaluation (R-025, ADR-0004 D3).
// Pure function: nothing is ever written back to the document.
// Foreign tags stay stored; switching page platforms computes conflict dynamically.
import { isRootId, type Document, type Shape } from "@open-draw/canvas";
import {
  SEMANTIC_CONFLICTS,
  type PlatformProfile,
  type SemanticConflict,
} from "@open-draw/profiles";
import { ROOT_ROLES, type RootRole } from "./root-roles";
import { resolveRootPlatform } from "./resolve-root";
import { PLUGIN_ROOT_ROLE, getShapeSemantic } from "./plugins";

/**
 * Computes semantic conflict status for a shape in a document.
 * Returns undefined if shape has no semantic tag (NONE baseline, R-024) or is valid.
 */
export function computeSemanticConflict(
  doc: Document,
  shape: Shape,
  profile?: PlatformProfile,
): SemanticConflict | undefined {
  const semantic = getShapeSemantic(shape);
  if (semantic === undefined) {
    return undefined;
  }

  const rootPlatform = resolveRootPlatform(doc, shape.id);
  if (rootPlatform === undefined) {
    return {
      status: SEMANTIC_CONFLICTS.conflicted,
      actualPlatform: semantic.platform,
      reason: `Shape is tagged with "${semantic.platform}" semantic "${semantic.id}" on a platform-agnostic root page (Ruling 10, R-025).`,
    };
  }

  if (semantic.platform !== rootPlatform) {
    return {
      status: SEMANTIC_CONFLICTS.conflicted,
      expectedPlatform: rootPlatform,
      actualPlatform: semantic.platform,
      reason: `Shape is tagged with "${semantic.platform}" semantic "${semantic.id}" on a "${rootPlatform}" root page (R-025).`,
    };
  }

  if (!isRootId(shape.parentId) && profile !== undefined && semantic.id === profile.rootSemantic) {
    return {
      status: SEMANTIC_CONFLICTS.conflicted,
      expectedPlatform: rootPlatform,
      actualPlatform: semantic.platform,
      reason: `Root semantic "${semantic.id}" cannot be assigned to child shapes.`,
    };
  }

  const role =
    (shape.meta.pluginData?.[PLUGIN_ROOT_ROLE] as RootRole | undefined) ??
    (shape.meta.role as RootRole | undefined);

  if (
    role === ROOT_ROLES.component &&
    profile !== undefined &&
    semantic.id === profile.rootSemantic
  ) {
    return {
      status: SEMANTIC_CONFLICTS.conflicted,
      expectedPlatform: rootPlatform,
      actualPlatform: semantic.platform,
      reason: `Root semantic "${semantic.id}" cannot be assigned to a component.`,
    };
  }

  if (profile !== undefined) {
    const definition = profile.semantics[semantic.id];
    if (definition === undefined) {
      return {
        status: SEMANTIC_CONFLICTS.unknown,
        expectedPlatform: rootPlatform,
        actualPlatform: semantic.platform,
        reason: `Semantic "${semantic.id}" is not defined in active profile "${profile.id}".`,
      };
    }
  }

  return undefined;
}
