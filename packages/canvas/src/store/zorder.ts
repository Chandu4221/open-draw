import type { ShapeId, ShapeRecord } from '@open-draw/schema';

export type ZOrderOperation = 'forward' | 'backward' | 'front' | 'back';

export function reorderShapes(
  shapes: readonly ShapeRecord[],
  targetIds: readonly ShapeId[],
  op: ZOrderOperation
): ShapeRecord[] {
  const targetSet = new Set(targetIds);
  if (targetSet.size === 0 || shapes.length <= 1) {
    return [...shapes];
  }

  if (op === 'front') {
    const nonTargets: ShapeRecord[] = [];
    const targets: ShapeRecord[] = [];
    for (const s of shapes) {
      if (targetSet.has(s.id)) {
        targets.push(s);
      } else {
        nonTargets.push(s);
      }
    }
    return [...nonTargets, ...targets];
  }

  if (op === 'back') {
    const nonTargets: ShapeRecord[] = [];
    const targets: ShapeRecord[] = [];
    for (const s of shapes) {
      if (targetSet.has(s.id)) {
        targets.push(s);
      } else {
        nonTargets.push(s);
      }
    }
    return [...targets, ...nonTargets];
  }

  const result = [...shapes];
  if (op === 'forward') {
    for (let i = result.length - 2; i >= 0; i--) {
      if (targetSet.has(result[i]!.id) && !targetSet.has(result[i + 1]!.id)) {
        const temp = result[i]!;
        result[i] = result[i + 1]!;
        result[i + 1] = temp;
      }
    }
    return result;
  }

  // op === 'backward'
  for (let i = 1; i < result.length; i++) {
    if (targetSet.has(result[i]!.id) && !targetSet.has(result[i - 1]!.id)) {
      const temp = result[i]!;
      result[i] = result[i - 1]!;
      result[i - 1] = temp;
    }
  }
  return result;
}
