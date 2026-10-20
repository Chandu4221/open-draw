import { describe, expect, test } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import { arrowGeometry, getAnchorPoint, resolveArrowEndpoints } from './geometry.js';
import type { ArrowProps } from './defs.js';
import { CanvasStore } from '../../store.js';
import { ShapeRegistry } from '../../registry.js';
import { rectDefinition } from '../rect.js';

describe('arrowGeometry', () => {
  test('getAnchorPoint returns correct coordinates for standard anchor positions', () => {
    const bounds = { x: 100, y: 100, width: 200, height: 100 };
    expect(getAnchorPoint(bounds, 'top')).toEqual({ x: 200, y: 100 });
    expect(getAnchorPoint(bounds, 'right')).toEqual({ x: 300, y: 150 });
    expect(getAnchorPoint(bounds, 'bottom')).toEqual({ x: 200, y: 200 });
    expect(getAnchorPoint(bounds, 'left')).toEqual({ x: 100, y: 150 });
    expect(getAnchorPoint(bounds, 'center')).toEqual({ x: 200, y: 150 });
  });

  test('resolveArrowEndpoints resolves dynamic target bounds when bound', () => {
    const store = new CanvasStore();
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);

    const rect = store.createShape({
      id: 'rect-1',
      type: 'rect',
      x: 100,
      y: 100,
      props: { width: 100, height: 100 },
    });

    const arrow: ShapeRecord<ArrowProps> = {
      id: 'arrow-1',
      type: 'arrow',
      x: 0,
      y: 0,
      rotation: 0,
      hidden: false,
      meta: {},
      props: {
        startBinding: { shapeId: rect.id, anchor: 'right' },
        endPoint: { x: 500, y: 150 },
      },
    };

    const resolved = resolveArrowEndpoints(arrow, store, registry);
    expect(resolved.start).toEqual({ x: 200, y: 150 });
    expect(resolved.end).toEqual({ x: 500, y: 150 });

    // Move target rect
    store.updateShape(rect.id, { x: 300, y: 200 });
    const updatedResolved = resolveArrowEndpoints(arrow, store, registry);
    expect(updatedResolved.start).toEqual({ x: 400, y: 250 });
  });

  test('hit accurately determines hit proximity to line segment', () => {
    const arrow: ShapeRecord<ArrowProps> = {
      id: 'arrow-1',
      type: 'arrow',
      x: 100,
      y: 100,
      rotation: 0,
      hidden: false,
      meta: {},
      props: {
        startPoint: { x: 100, y: 100 },
        endPoint: { x: 300, y: 100 },
      },
    };

    expect(arrowGeometry.hit(arrow, { x: 200, y: 100 })).toBe(true);
    expect(arrowGeometry.hit(arrow, { x: 200, y: 105 })).toBe(true);
    expect(arrowGeometry.hit(arrow, { x: 200, y: 120 })).toBe(false);
  });
});
