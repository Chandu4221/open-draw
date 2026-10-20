import { describe, expect, it } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import type { EllipseProps } from './defs.js';
import { ellipseGeometry } from './geometry.js';

describe('ellipseGeometry', () => {
  const shape: ShapeRecord<EllipseProps> = {
    id: 'e1',
    type: 'ellipse',
    x: 100,
    y: 100,
    rotation: 0,
    hidden: false,
    meta: {},
    props: {
      width: 100,
      height: 60,
    },
  };

  it('computes bounding box', () => {
    const bounds = ellipseGeometry.bounds(shape);
    expect(bounds).toEqual({ x: 100, y: 100, width: 100, height: 60 });
  });

  it('handles hit testing correctly for inscribed ellipse', () => {
    // Center of ellipse: (150, 130)
    expect(ellipseGeometry.hit(shape, { x: 150, y: 130 })).toBe(true);

    // Bounding box corners should NOT be hit
    expect(ellipseGeometry.hit(shape, { x: 100, y: 100 })).toBe(false);
    expect(ellipseGeometry.hit(shape, { x: 200, y: 100 })).toBe(false);
    expect(ellipseGeometry.hit(shape, { x: 100, y: 160 })).toBe(false);
    expect(ellipseGeometry.hit(shape, { x: 200, y: 160 })).toBe(false);

    // Cardinal extrema (should be hit)
    expect(ellipseGeometry.hit(shape, { x: 100, y: 130 })).toBe(true);
    expect(ellipseGeometry.hit(shape, { x: 200, y: 130 })).toBe(true);
    expect(ellipseGeometry.hit(shape, { x: 150, y: 100 })).toBe(true);
    expect(ellipseGeometry.hit(shape, { x: 150, y: 160 })).toBe(true);

    // Far away point
    expect(ellipseGeometry.hit(shape, { x: 500, y: 500 })).toBe(false);
  });

  it('resizes handles with min-size clamping at 10', () => {
    const resized = ellipseGeometry.resize(shape, 'bottom-right', { x: 250, y: 220 });
    expect(resized.props?.width).toBe(150);
    expect(resized.props?.height).toBe(120);

    const clamped = ellipseGeometry.resize(shape, 'bottom-right', { x: 102, y: 102 });
    expect(clamped.props?.width).toBe(10);
    expect(clamped.props?.height).toBe(10);
  });
});
