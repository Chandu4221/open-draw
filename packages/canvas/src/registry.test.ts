import { describe, expect, it } from 'vitest';
import { DuplicateShapeTypeError, ShapeRegistry, type ShapeDefinition } from './registry.js';
import { rectDefinition } from './shapes/rect/index.js';
import { groupDefinition } from './shapes/group/index.js';

describe('ShapeRegistry', () => {
  it('registers and retrieves shape definitions', () => {
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);

    expect(registry.has('rect')).toBe(true);
    expect(registry.get('rect')).toBe(rectDefinition);
    expect(registry.list()).toEqual([rectDefinition]);
  });

  it('throws DuplicateShapeTypeError when registering identical type', () => {
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);

    expect(() => registry.register(rectDefinition)).toThrow(DuplicateShapeTypeError);
  });

  it('returns undefined for unregistered types', () => {
    const registry = new ShapeRegistry();
    expect(registry.has('unknown')).toBe(false);
    expect(registry.get('unknown')).toBeUndefined();
  });
});

describe('rectDefinition plugin', () => {
  it('provides default props', () => {
    const props = rectDefinition.defaultProps();
    expect(props.width).toBe(100);
    expect(props.height).toBe(100);
    expect(props.fill).toBe('transparent');
  });

  it('computes geometry bounds and hit tests', () => {
    const shape = {
      id: 'r1',
      type: 'rect',
      x: 50,
      y: 60,
      meta: {},
      props: { width: 120, height: 80, fill: '#ff0000' },
    };

    const bounds = rectDefinition.geometry.bounds(shape);
    expect(bounds).toEqual({ x: 50, y: 60, width: 120, height: 80 });

    // Hit test (hit test is evaluated relative to shape origin)
    expect(rectDefinition.geometry.hit(shape, { x: 100, y: 100 })).toBe(true);
    expect(rectDefinition.geometry.hit(shape, { x: 40, y: 100 })).toBe(false);
    expect(rectDefinition.geometry.hit(shape, { x: 200, y: 100 })).toBe(false);
  });

  it('computes resize geometry from bottom-right handle', () => {
    const shape = {
      id: 'r1',
      type: 'rect',
      x: 10,
      y: 10,
      meta: {},
      props: { width: 50, height: 50 },
    };

    const resized = rectDefinition.geometry.resize(shape, 'bottom-right', { x: 100, y: 120 });
    expect(resized.props?.width).toBe(90);
    expect(resized.props?.height).toBe(110);
  });
});

describe('groupDefinition plugin', () => {
  it('provides group definition defaults', () => {
    expect(groupDefinition.type).toBe('group');
    expect(groupDefinition.defaultProps()).toEqual({});
  });
});
