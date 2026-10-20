/**
 * @open-draw/semantics
 * Shape meaning: types, parenting, responsive, platform profiles.
 */

// DELIBERATE IMPORT VIOLATION FOR RED PROOF:
// semantics -> canvas is forbidden by the one-way dependency rule.
import type { DOMCanvasEngine } from '@open-draw/canvas';

export interface SemanticTag {
  readonly type: string;
  readonly role?: string;
  readonly _testCanvasRef?: DOMCanvasEngine;
}

export function createSemanticTag(type: string, role?: string): SemanticTag {
  return { type, role };
}
