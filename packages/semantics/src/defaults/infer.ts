import type { ShapeRecord, Snapshot } from '@open-draw/schema';
import { INFERENCE_RULES, type TypeInferenceResult } from './rules.js';

export * from './rules.js';

/**
 * Pure function that evaluates creation-time semantic type inference per Phase 3 §2.
 * - Evaluates ONCE at the creation gesture commit.
 * - NEVER re-fires or overrides an explicit user tag or retagged shape.
 * - Returns TypeInferenceResult with confidence tier (strong or weak) or null.
 */
export function inferType(
  shape: ShapeRecord,
  scene: Snapshot
): TypeInferenceResult | null {
  // 1. Guardrail: If shape already has an explicit semantic type, NEVER override.
  const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
  if (semantic.type && typeof semantic.type === 'string' && semantic.type !== '') {
    return null;
  }

  // 2. Guardrail: If shape was explicitly retagged by the user this session, NEVER override.
  if (shape.meta?.userRetagged === true) {
    return null;
  }

  // 3. Resolve parent shape if any
  const parentId = (shape.meta?.parent ?? shape.meta?.parentId) as string | undefined;
  const parent = parentId ? scene.shapes.find((s) => s.id === parentId) : undefined;

  // 4. Evaluate rules in order of priority (highest confidence first)
  const sortedRules = [...INFERENCE_RULES].sort((a, b) => b.confidence - a.confidence);

  for (const rule of sortedRules) {
    if (rule.evaluate(shape, scene, parent)) {
      return {
        type: rule.targetType,
        confidence: rule.confidence,
        tier: rule.tier,
        ruleId: rule.id,
        explanation: rule.explanation,
      };
    }
  }

  return null;
}
