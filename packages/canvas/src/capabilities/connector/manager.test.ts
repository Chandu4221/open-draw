import { describe, expect, test, vi } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import { ShapeRegistry } from '../../registry.js';
import { CanvasStore } from '../../store.js';
import { rectDefinition } from '../../shapes/rect.js';
import { arrowDefinition, type ArrowProps } from '../../shapes/arrow/index.js';
import { ConnectorManager } from './manager.js';

describe('ConnectorManager', () => {
  test('handleTargetDeletion unbinds arrow, sets fallback point, emits event, and keeps arrow', () => {
    const store = new CanvasStore();
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);
    registry.register(arrowDefinition);

    const manager = new ConnectorManager();
    const unbindSpy = vi.fn();
    manager.onTargetUnbound(unbindSpy);

    const rect = store.createShape({
      id: 'rect-1',
      type: 'rect',
      x: 100,
      y: 100,
      props: { width: 100, height: 100 },
    });

    const arrow = store.createShape({
      id: 'arrow-1',
      type: 'arrow',
      x: 0,
      y: 0,
      props: {
        startBinding: { shapeId: rect.id, anchor: 'right' },
        endPoint: { x: 500, y: 150 },
      },
    });

    store.deleteShape(rect.id);
    manager.handleTargetDeletion(rect.id, rect, store, registry);

    const updatedArrow = store.getShape(arrow.id) as ShapeRecord<ArrowProps>;
    expect(updatedArrow).toBeDefined();
    expect(updatedArrow.props.startBinding).toBeUndefined();
    expect(updatedArrow.props.startPoint).toEqual({ x: 200, y: 150 });
    expect(unbindSpy).toHaveBeenCalledWith({
      arrowId: arrow.id,
      which: 'start',
      previousTargetId: rect.id,
      fallbackPoint: { x: 200, y: 150 },
    });
  });

  test('findSnapTarget detects nearest anchor within 12px snap distance', () => {
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);
    const manager = new ConnectorManager();

    const rect: ShapeRecord = {
      id: 'rect-1',
      type: 'rect',
      x: 100,
      y: 100,
      rotation: 0,
      hidden: false,
      meta: {},
      props: { width: 100, height: 100 },
    };

    // Right anchor is at (200, 150)
    // Query within 10px: at (205, 152)
    const snap = manager.findSnapTarget({ x: 205, y: 152 }, [rect], registry);
    expect(snap).not.toBeNull();
    expect(snap?.shapeId).toBe('rect-1');
    expect(snap?.anchor).toBe('right');
    expect(snap?.point).toEqual({ x: 200, y: 150 });

    // Query 20px away: no snap
    const noSnap = manager.findSnapTarget({ x: 220, y: 150 }, [rect], registry);
    expect(noSnap).toBeNull();
  });
});
