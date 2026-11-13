// Pure semantic resolver (ADR-0004 D1, D5).
import type {
  PlatformProfile,
  SemanticDefinition,
  SemanticId,
  SemanticTag,
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
