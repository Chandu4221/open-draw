import { describe, it, expect } from 'vitest';
import { CycleDetectedError } from '@open-draw/schema';
import { CanvasStore } from './store.js';

describe('Store Parenting & Cycle Validation (ADR-002 & ADR-003 Amendments)', () => {
  it('allows valid parenting hierarchy', () => {
    const store = new CanvasStore();
    const frame = store.createShape({ id: 'frame-1', type: 'frame', x: 0, y: 0 });
    const card = store.createShape({ id: 'card-1', type: 'rect', x: 10, y: 10 });
    const btn = store.createShape({ id: 'btn-1', type: 'rect', x: 20, y: 20 });

    store.setParent('card-1', 'frame-1');
    store.setParent('btn-1', 'card-1');

    expect(store.getShape('card-1')?.meta.parent).toBe('frame-1');
    expect(store.getShape('btn-1')?.meta.parent).toBe('card-1');
  });

  it('rejects self-parenting with CycleDetectedError', () => {
    const store = new CanvasStore();
    store.createShape({ id: 'shape-1', type: 'rect', x: 0, y: 0 });

    expect(() => {
      store.setParent('shape-1', 'shape-1');
    }).toThrow(CycleDetectedError);
  });

  it('rejects indirect cycles with CycleDetectedError', () => {
    const store = new CanvasStore();
    store.createShape({ id: 'A', type: 'frame', x: 0, y: 0 });
    store.createShape({ id: 'B', type: 'frame', x: 10, y: 10 });
    store.createShape({ id: 'C', type: 'frame', x: 20, y: 20 });

    store.setParent('B', 'A'); // A -> B
    store.setParent('C', 'B'); // A -> B -> C

    // Attempting to make A a child of C would create A -> B -> C -> A
    expect(() => {
      store.setParent('A', 'C');
    }).toThrow(CycleDetectedError);

    // Verify state unchanged
    expect(store.getShape('A')?.meta.parent).toBeUndefined();
    expect(store.getShape('B')?.meta.parent).toBe('A');
  });

  it('allows detaching parent by passing null', () => {
    const store = new CanvasStore();
    store.createShape({ id: 'parent-1', type: 'frame', x: 0, y: 0 });
    store.createShape({ id: 'child-1', type: 'rect', x: 10, y: 10 });

    store.setParent('child-1', 'parent-1');
    expect(store.getShape('child-1')?.meta.parent).toBe('parent-1');

    store.setParent('child-1', null);
    expect(store.getShape('child-1')?.meta.parent).toBeUndefined();
  });

  it('ungroups members to group parent and deletes group shell in one transaction', () => {
    const store = new CanvasStore();
    const frame = store.createShape({ id: 'frame-1', type: 'frame', x: 0, y: 0 });
    const group = store.createShape({ id: 'grp-1', type: 'group', x: 10, y: 10, meta: { parent: 'frame-1' } });
    store.createShape({ id: 'm1', type: 'rect', x: 20, y: 20, meta: { parent: 'grp-1' } });
    store.createShape({ id: 'm2', type: 'rect', x: 30, y: 30, meta: { parent: 'grp-1' } });

    store.ungroup('grp-1');

    expect(store.hasShape('grp-1')).toBe(false);
    expect(store.getShape('m1')?.meta.parent).toBe('frame-1');
    expect(store.getShape('m2')?.meta.parent).toBe('frame-1');

    // Verify undo restores group and reparents children back to group
    expect(store.canUndo()).toBe(true);
    store.undo();

    expect(store.hasShape('grp-1')).toBe(true);
    expect(store.getShape('m1')?.meta.parent).toBe('grp-1');
    expect(store.getShape('m2')?.meta.parent).toBe('grp-1');
  });

  it('deletes group with cascade deleting all members in one transaction', () => {
    const store = new CanvasStore();
    store.createShape({ id: 'grp-1', type: 'group', x: 10, y: 10 });
    store.createShape({ id: 'm1', type: 'rect', x: 20, y: 20, meta: { parent: 'grp-1' } });
    store.createShape({ id: 'm2', type: 'rect', x: 30, y: 30, meta: { parent: 'grp-1' } });

    store.deleteShape('grp-1', true); // cascade delete

    expect(store.hasShape('grp-1')).toBe(false);
    expect(store.hasShape('m1')).toBe(false);
    expect(store.hasShape('m2')).toBe(false);

    // Verify undo restores all shapes
    store.undo();
    expect(store.hasShape('grp-1')).toBe(true);
    expect(store.hasShape('m1')).toBe(true);
    expect(store.hasShape('m2')).toBe(true);
  });
});
