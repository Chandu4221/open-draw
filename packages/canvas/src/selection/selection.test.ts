import { describe, expect, it } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import { CanvasStore } from '../store/index.js';
import { ShapeRegistry } from '../registry.js';
import { rectDefinition } from '../shapes/rect/index.js';
import { groupDefinition } from '../shapes/group/index.js';
import { computeMarqueeBounds, findIntersectingShapes } from './marquee.js';
import { findGroupForMember, getGroupMembers, isGroupShape } from './group.js';

describe('Selection Marquee & Group helpers', () => {
  it('computes marquee bounds correctly regardless of drag direction', () => {
    const b1 = computeMarqueeBounds({ x: 10, y: 20 }, { x: 50, y: 70 });
    expect(b1).toEqual({ x: 10, y: 20, width: 40, height: 50 });

    const b2 = computeMarqueeBounds({ x: 50, y: 70 }, { x: 10, y: 20 });
    expect(b2).toEqual({ x: 10, y: 20, width: 40, height: 50 });
  });

  it('finds intersecting shapes using boundsIntersect', () => {
    const store = new CanvasStore();
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);

    const s1 = store.createShape({
      id: 's1',
      type: 'rect',
      x: 100,
      y: 100,
      props: { width: 50, height: 50 },
    });
    const s2 = store.createShape({
      id: 's2',
      type: 'rect',
      x: 500,
      y: 500,
      props: { width: 50, height: 50 },
    });

    const hits = findIntersectingShapes(
      { x: 120, y: 120, width: 200, height: 200 },
      store,
      registry
    );
    expect(hits).toContain(s1.id);
    expect(hits).not.toContain(s2.id);
  });

  it('queries group capability and membership without shape-type branching', () => {
    const store = new CanvasStore();
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);
    registry.register(groupDefinition);

    const m1 = store.createShape({ id: 'm1', type: 'rect', x: 10, y: 10, props: { width: 40, height: 40 } });
    const m2 = store.createShape({ id: 'm2', type: 'rect', x: 60, y: 10, props: { width: 40, height: 40 } });
    const grp = store.createShape({
      id: 'grp',
      type: 'group',
      x: 10,
      y: 10,
      props: { memberIds: [m1.id, m2.id], width: 90, height: 40 },
    });

    expect(isGroupShape(grp, registry)).toBe(true);
    expect(isGroupShape(m1, registry)).toBe(false);

    expect(getGroupMembers(grp, registry)).toEqual([m1.id, m2.id]);
    expect(getGroupMembers(m1, registry)).toEqual([]);

    const foundGroup = findGroupForMember(m1.id, store, registry);
    expect(foundGroup?.id).toBe(grp.id);

    const noGroup = findGroupForMember('unknown-shape', store, registry);
    expect(noGroup).toBeNull();
  });
});
