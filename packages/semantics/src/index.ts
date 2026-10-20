/**
 * @open-draw/semantics
 * Shape meaning: types, parenting, responsive, platform profiles.
 */

export interface SemanticTag {
  readonly type: string;
  readonly role?: string;
}

export function createSemanticTag(type: string, role?: string): SemanticTag {
  return { type, role };
}
