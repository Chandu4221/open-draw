import {
  PLATFORM_PROFILES,
  type PlatformProfile,
  type SemanticDefinition,
  type SemanticId,
  type SemanticTag,
} from "@open-draw/profiles";

export interface ResolvedSemantic {
  readonly id: SemanticId;
  readonly displayName: string;
  readonly definition: SemanticDefinition;
  readonly properties?: Readonly<Record<string, string | number | boolean>>;
}

/**
 * Resolves a shape's semantic tag against a platform profile.
 * Returns undefined if tag is absent (NONE baseline, R-024) or not in the profile.
 */
export function resolveSemantic(
  profile: PlatformProfile | undefined,
  tag: SemanticTag | undefined,
): ResolvedSemantic | undefined {
  if (tag === undefined || profile === undefined) {
    return undefined;
  }
  const definition = profile.semantics[tag.id];
  if (definition === undefined) {
    return undefined;
  }
  return {
    id: definition.id,
    displayName: definition.displayName,
    definition,
    ...(tag.properties !== undefined ? { properties: tag.properties } : {}),
  };
}

/**
 * Checks whether a semantic tag has scope === "section" in its platform profile.
 */
export function isSectionScopedSemantic(
  tag: SemanticTag | undefined,
  profile?: PlatformProfile,
): boolean {
  if (tag === undefined) {
    return false;
  }
  const targetProfile = profile ?? PLATFORM_PROFILES[tag.platform];
  const definition = targetProfile?.semantics[tag.id];
  return definition?.scope === "section";
}

/**
 * Checks whether a semantic tag has scope === "component" in its platform profile.
 */
export function isComponentScopedSemantic(
  tag: SemanticTag | undefined,
  profile?: PlatformProfile,
): boolean {
  if (tag === undefined) {
    return false;
  }
  const targetProfile = profile ?? PLATFORM_PROFILES[tag.platform];
  const definition = targetProfile?.semantics[tag.id];
  return definition?.scope === "component";
}

/**
 * Checks whether a semantic tag qualifies as a container semantic across all platforms
 * (scope === "section", layout category, cards, or explicit container tags).
 */
export function isContainerSemantic(
  tag: SemanticTag | undefined,
  profile?: PlatformProfile,
): boolean {
  if (tag === undefined) {
    return false;
  }
  const targetProfile = profile ?? PLATFORM_PROFILES[tag.platform];
  const definition = targetProfile?.semantics[tag.id];
  if (definition === undefined) {
    return false;
  }
  return (
    definition.scope === "section" ||
    definition.category === "layout" ||
    tag.id === "card" ||
    tag.id.endsWith("-card") ||
    tag.id === "form" ||
    tag.id === "table"
  );
}

/**
 * Checks whether a semantic tag represents an atomic leaf component (button, input, toggle, etc.).
 */
export function isLeafComponentSemantic(
  tag: SemanticTag | undefined,
  profile?: PlatformProfile,
): boolean {
  if (tag === undefined) {
    return false;
  }
  return !isContainerSemantic(tag, profile);
}
