import { describe, expect, test } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import { inkGeometry } from './geometry.js';
import type { InkProps } from './defs.js';

describe('inkGeometry', () => {
  const createInk = (pts: number[]): ShapeRecord<InkProps> => ({
    id: 'ink-1',
    type: 'ink',
    x: pts[0] ?? 0,
    y: pts[1] ?? 0,
    rotation: 0,
    hidden: false,
    meta: {},
    props: {
      pts,
      strokeWidth: 4,
    },
  });

  test('bounds returns bounding box covering all stroke points plus strokeWidth', () => {
    const pts = [100, 100, 200, 150, 150, 300];
    const shape = createInk(pts);
    const bounds = inkGeometry.bounds(shape);

    // minX=100, maxX=200, minY=100, maxY=300, sw=4
    expect(bounds.x).toBe(98);
    expect(bounds.y).toBe(98);
    expect(bounds.width).toBe(104);
    expect(bounds.height).toBe(204);
  });

  test('hit detects proximity to stroke segments', () => {
    const pts = [100, 100, 200, 100];
    const shape = createInk(pts);

    expect(inkGeometry.hit(shape, { x: 150, y: 100 })).toBe(true);
    expect(inkGeometry.hit(shape, { x: 150, y: 105 })).toBe(true);
    expect(inkGeometry.hit(shape, { x: 150, y: 120 })).toBe(false);
  });
});
