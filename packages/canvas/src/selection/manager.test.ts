import { describe, expect, it, vi } from 'vitest';
import { SelectionManager } from './manager.js';
import type { ShapeRecord } from '@open-draw/schema';

describe('SelectionManager', () => {
  it('handles basic selection operations and maintains pick order', () => {
    const manager = new SelectionManager();
    expect(manager.selection).toEqual([]);

    manager.select('shape-1');
    expect(manager.selection).toEqual(['shape-1']);

    manager.add(['shape-2', 'shape-3']);
    expect(manager.selection).toEqual(['shape-1', 'shape-2', 'shape-3']);

    manager.toggle('shape-2');
    expect(manager.selection).toEqual(['shape-1', 'shape-3']);

    manager.toggle('shape-4');
    expect(manager.selection).toEqual(['shape-1', 'shape-3', 'shape-4']);

    manager.remove(['shape-1']);
    expect(manager.selection).toEqual(['shape-3', 'shape-4']);

    manager.clear();
    expect(manager.selection).toEqual([]);
  });

  it('cycles selection through shapes in z-order', () => {
    const manager = new SelectionManager();
    const shapes: ShapeRecord[] = [
      { id: 's1', type: 'rect', x: 0, y: 0, rotation: 0, hidden: false, meta: {}, props: {} },
      { id: 's2', type: 'rect', x: 0, y: 0, rotation: 0, hidden: false, meta: {}, props: {} },
      { id: 's3', type: 'rect', x: 0, y: 0, rotation: 0, hidden: true, meta: {}, props: {} },
      { id: 's4', type: 'rect', x: 0, y: 0, rotation: 0, hidden: false, meta: {}, props: {} },
    ];

    // Starting from empty, cycles forward to first visible
    manager.cycleZOrder(shapes, 'forward');
    expect(manager.selection).toEqual(['s1']);

    // Next visible is s2 (s3 is hidden)
    manager.cycleZOrder(shapes, 'forward');
    expect(manager.selection).toEqual(['s2']);

    // Next visible is s4
    manager.cycleZOrder(shapes, 'forward');
    expect(manager.selection).toEqual(['s4']);

    // Wraps around to s1
    manager.cycleZOrder(shapes, 'forward');
    expect(manager.selection).toEqual(['s1']);

    // Backward cycles to s4
    manager.cycleZOrder(shapes, 'backward');
    expect(manager.selection).toEqual(['s4']);
  });

  it('selects all visible shapes', () => {
    const manager = new SelectionManager();
    const shapes: ShapeRecord[] = [
      { id: 's1', type: 'rect', x: 0, y: 0, rotation: 0, hidden: false, meta: {}, props: {} },
      { id: 's2', type: 'rect', x: 0, y: 0, rotation: 0, hidden: true, meta: {}, props: {} },
      { id: 's3', type: 'rect', x: 0, y: 0, rotation: 0, hidden: false, meta: {}, props: {} },
    ];

    manager.selectAll(shapes);
    expect(manager.selection).toEqual(['s1', 's3']);
  });

  it('notifies subscribers on selection change', () => {
    const manager = new SelectionManager();
    const listener = vi.fn();
    const unsub = manager.subscribe(listener);

    manager.select('s1');
    expect(listener).toHaveBeenCalledWith(['s1']);

    // Setting same selection does not trigger redundant notifications
    manager.setSelection(['s1']);
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    manager.clear();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
