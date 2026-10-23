import { describe, expect, it } from 'vitest';
import type { ShapeRecord } from '@open-draw/schema';
import { CanvasStore } from '../store/index.js';
import { ShapeRegistry } from '../registry.js';
import { rectDefinition } from '../shapes/rect/index.js';
import { groupDefinition } from '../shapes/group/index.js';
import { textDefinition } from '../shapes/text/index.js';
import { noteDefinition } from '../shapes/note/index.js';
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

  it('safely finds intersecting shapes when text and note shapes omit width/height', () => {
    const store = new CanvasStore();
    const registry = new ShapeRegistry();
    registry.register(rectDefinition);
    registry.register(textDefinition);
    registry.register(noteDefinition);

    const t1 = store.createShape({
      id: 't1',
      type: 'text',
      x: 100,
      y: 100,
      props: { text: 'Hello World' },
    });
    const n1 = store.createShape({
      id: 'n1',
      type: 'note',
      x: 200,
      y: 200,
      props: { text: 'Note without dimensions' },
    });

    expect(() => {
      const hits = findIntersectingShapes(
        { x: 50, y: 50, width: 300, height: 300 },
        store,
        registry
      );
      expect(hits).toContain(t1.id);
      expect(hits).toContain(n1.id);
    }).not.toThrow();
  });

  it('gracefully skips shapes with non-finite bounds instead of throwing InvalidBoundsError', () => {
    const store = new CanvasStore();
    const registry = new ShapeRegistry();
    registry.register({
      type: 'malformed',
      defaultProps: () => ({}),
      geometry: {
        bounds: () => ({ x: NaN, y: 100, width: 50, height: 50 }),
        resize: () => ({}),
        hit: () => false,
      },
      render: () => ({} as any),
      update: () => {},
    });
    registry.register(rectDefinition);

    store.createShape({ id: 'bad', type: 'malformed', x: 0, y: 0 });
    const good = store.createShape({ id: 'good', type: 'rect', x: 50, y: 50, props: { width: 50, height: 50 } });

    expect(() => {
      const hits = findIntersectingShapes(
        { x: 0, y: 0, width: 200, height: 200 },
        store,
        registry
      );
      expect(hits).toEqual([good.id]);
    }).not.toThrow();
  });
});

