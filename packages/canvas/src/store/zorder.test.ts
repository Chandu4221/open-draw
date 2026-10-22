import { describe, expect, it } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import { reorderShapes } from './zorder.js';

function mk(id: string): ShapeRecord {
  return { id, type: 'rect', x: 0, y: 0, rotation: 0, hidden: false, meta: {}, props: {} };
}

describe('reorderShapes', () => {
  const a = mk('A');
  const b = mk('B');
  const c = mk('C');
  const d = mk('D');

  it('brings target to front', () => {
    const res = reorderShapes([a, b, c, d], ['B'], 'front');
    expect(res.map((s) => s.id)).toEqual(['A', 'C', 'D', 'B']);
  });

  it('sends target to back', () => {
    const res = reorderShapes([a, b, c, d], ['C'], 'back');
    expect(res.map((s) => s.id)).toEqual(['C', 'A', 'B', 'D']);
  });

  it('moves target forward one step', () => {
    const res = reorderShapes([a, b, c, d], ['B'], 'forward');
    expect(res.map((s) => s.id)).toEqual(['A', 'C', 'B', 'D']);
  });

  it('moves target backward one step', () => {
    const res = reorderShapes([a, b, c, d], ['C'], 'backward');
    expect(res.map((s) => s.id)).toEqual(['A', 'C', 'B', 'D']);
  });

  it('handles multiple selected shapes preserving relative order', () => {
    const resFront = reorderShapes([a, b, c, d], ['B', 'C'], 'front');
    expect(resFront.map((s) => s.id)).toEqual(['A', 'D', 'B', 'C']);

    const resBack = reorderShapes([a, b, c, d], ['B', 'C'], 'back');
    expect(resBack.map((s) => s.id)).toEqual(['B', 'C', 'A', 'D']);
  });
});
