import { describe, expect, test, vi } from 'vitest';
import type { Bounds, ShapeRecord } from '@open-draw/schema';
import { ShapeRegistry } from '../../registry.js';
import { CanvasStore } from '../../store/index.js';
import { frameDefinition } from '../../shapes/frame/index.js';
import { rectDefinition } from '../../shapes/rect/index.js';
import { ClippingManager, findSuggestedParent, isContainedWithin } from './manager.js';

describe('ClippingManager & Parenting', () => {
  test('isContainedWithin calculates geometric containment accurately', () => {
    const container: Bounds = { x: 100, y: 100, width: 400, height: 300 };
    const inside: Bounds = { x: 120, y: 120, width: 100, height: 80 };
    const outside: Bounds = { x: 50, y: 50, width: 100, height: 80 };
    const overflowing: Bounds = { x: 450, y: 350, width: 100, height: 100 };

    expect(isContainedWithin(inside, container)).toBe(true);
    expect(isContainedWithin(outside, container)).toBe(false);
    expect(isContainedWithin(overflowing, container)).toBe(false);
  });

  test('findSuggestedParent selects innermost (smallest area) container on overlap', () => {
    const registry = new ShapeRegistry();
    registry.register(frameDefinition);
    registry.register(rectDefinition);

    const largeFrame: ShapeRecord = {
      id: 'frame-large',
      type: 'frame',
      x: 0,
      y: 0,
      rotation: 0,
      hidden: false,
      meta: {},
      props: { width: 800, height: 600 },
    };

    const smallFrame: ShapeRecord = {
      id: 'frame-small',
      type: 'frame',
      x: 100,
      y: 100,
      rotation: 0,
      hidden: false,
      meta: {},
      props: { width: 300, height: 200 },
    };

    const childBounds: Bounds = { x: 150, y: 150, width: 80, height: 50 };

    const suggested = findSuggestedParent(childBounds, [largeFrame, smallFrame], registry);
    expect(suggested?.id).toBe('frame-small');
  });

  test('handleParentDeletion orphans children and emits event without silent reparenting', () => {
    const store = new CanvasStore();
    const manager = new ClippingManager();
    const orphanSpy = vi.fn();
    manager.onChildOrphaned(orphanSpy);

    const frame = store.createShape({
      id: 'frame-1',
      type: 'frame',
      x: 100,
      y: 100,
      props: { width: 400, height: 300 },
    });

    const child = store.createShape({
      id: 'child-1',
      type: 'rect',
      x: 150,
      y: 150,
      meta: { parent: frame.id },
      props: { width: 80, height: 50 },
    });

    store.deleteShape(frame.id);
    manager.handleParentDeletion(frame.id, store);

    const updatedChild = store.getShape(child.id);
    expect(updatedChild?.meta['parent']).toBeUndefined();
    expect(orphanSpy).toHaveBeenCalledWith({
      childId: child.id,
      previousParentId: frame.id,
    });
  });
});
