import { describe, it, expect } from 'vitest';
import { getDescendantIds, getValidParentCandidates } from './parent-select.js';
import type { ShapeRecord } from '@open-draw/schema';

describe('Cycle-Safe Parent Selection (ADR-002 / §1.1)', () => {
  it('correctly identifies all descendants in a nested hierarchy', () => {
    const shapes: ShapeRecord[] = [
      { id: 'frame-root', type: 'frame', x: 0, y: 0, props: {}, meta: {} },
      { id: 'frame-sub', type: 'frame', x: 10, y: 10, props: {}, meta: { parent: 'frame-root' } },
      { id: 'rect-leaf', type: 'rect', x: 20, y: 20, props: {}, meta: { parent: 'frame-sub' } },
      { id: 'frame-other', type: 'frame', x: 100, y: 100, props: {}, meta: {} },
    ];

    const rootDescendants = getDescendantIds('frame-root', shapes);
    expect(rootDescendants.has('frame-sub')).toBe(true);
    expect(rootDescendants.has('rect-leaf')).toBe(true);
    expect(rootDescendants.has('frame-other')).toBe(false);

    const subDescendants = getDescendantIds('frame-sub', shapes);
    expect(subDescendants.has('rect-leaf')).toBe(true);
    expect(subDescendants.has('frame-root')).toBe(false);
  });

  it('filters out self and any descendants from candidate parent frames', () => {
    const shapes: ShapeRecord[] = [
      { id: 'frame-root', type: 'frame', x: 0, y: 0, props: {}, meta: {} },
      { id: 'frame-child', type: 'frame', x: 10, y: 10, props: {}, meta: { parent: 'frame-root' } },
      { id: 'frame-sibling', type: 'frame', x: 100, y: 100, props: {}, meta: {} },
    ];

    // For frame-root: frame-child is a descendant and frame-root is self -> only frame-sibling is valid!
    const validForRoot = getValidParentCandidates('frame-root', shapes);
    expect(validForRoot.map((s) => s.id)).toEqual(['frame-sibling']);

    // For frame-child: self is excluded, but frame-root and frame-sibling are valid!
    const validForChild = getValidParentCandidates('frame-child', shapes);
    expect(validForChild.map((s) => s.id)).toEqual(['frame-root', 'frame-sibling']);
  });

  it('anti-suggestion ruling: an overlapping shape that is not a stored parent never becomes default', () => {
    const shapes: ShapeRecord[] = [
      { id: 'frame-canvas', type: 'frame', x: 0, y: 0, props: { width: 500, height: 500 }, meta: {} },
      { id: 'rect-overlap', type: 'rect', x: 50, y: 50, props: { width: 50, height: 50 }, meta: {} },
    ];

    // rect-overlap is geometrically inside frame-canvas, but its meta.parent is unset (root level)
    const valid = getValidParentCandidates('rect-overlap', shapes);
    expect(valid.map((s) => s.id)).toEqual(['frame-canvas']);
    // rect-overlap stored parent is undefined, meaning no implicit parent is injected
    expect(shapes.find((s) => s.id === 'rect-overlap')?.meta.parent).toBeUndefined();
  });
});
