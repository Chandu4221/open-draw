import { describe, expect, it } from 'vitest';
import { CorruptSnapshotError } from '@open-draw/schema';
import { CanvasStore, type StoreDiff } from './store.js';

describe('CanvasStore', () => {
  describe('CRUD operations', () => {
    it('creates, retrieves, and lists shapes', () => {
      const store = new CanvasStore();
      const s = store.createShape({
        id: 'rect-1',
        type: 'rect',
        x: 10,
        y: 20,
        props: { width: 100, height: 50 },
      });

      expect(s.id).toBe('rect-1');
      expect(store.hasShape('rect-1')).toBe(true);
      expect(store.getShape('rect-1')).toEqual(s);
      expect(store.listShapes()).toHaveLength(1);
    });

    it('updates shapes immutably', () => {
      const store = new CanvasStore();
      store.createShape({ id: 's1', type: 'rect', x: 0, y: 0 });
      const updated = store.updateShape('s1', { x: 50, y: 100 });

      expect(updated.x).toBe(50);
      expect(updated.y).toBe(100);
      expect(store.getShape('s1')?.x).toBe(50);
    });

    it('deletes shapes', () => {
      const store = new CanvasStore();
      store.createShape({ id: 's1', type: 'rect', x: 0, y: 0 });
      expect(store.deleteShape('s1')).toBe(true);
      expect(store.hasShape('s1')).toBe(false);
      expect(store.deleteShape('s1')).toBe(false);
    });
  });

  describe('Transactions & Atomicity', () => {
    it('rolls back completely if error is thrown inside transact', () => {
      const store = new CanvasStore();
      store.createShape({ id: 's1', type: 'rect', x: 0, y: 0 });

      expect(() => {
        store.transact(() => {
          store.createShape({ id: 's2', type: 'rect', x: 10, y: 10 });
          store.updateShape('s1', { x: 999 });
          throw new Error('Simulated gesture failure');
        });
      }).toThrow('Simulated gesture failure');

      // Assert rollback: s2 was not created, s1 remains unmodified
      expect(store.hasShape('s2')).toBe(false);
      expect(store.getShape('s1')?.x).toBe(0);
      expect(store.listShapes()).toHaveLength(1);
    });

    it('emits single combined diff for a transaction', () => {
      const store = new CanvasStore();
      const diffs: StoreDiff[] = [];
      store.listen((diff) => diffs.push(diff));

      store.transact(() => {
        store.createShape({ id: 's1', type: 'rect', x: 0, y: 0 });
        store.createShape({ id: 's2', type: 'rect', x: 10, y: 10 });
        store.updateShape('s1', { x: 50 });
      });

      expect(diffs).toHaveLength(1);
      const firstDiff = diffs[0];
      expect(firstDiff).toBeDefined();
      if (firstDiff) {
        expect(Array.from(firstDiff.created)).toEqual(['s1', 's2']);
        expect(firstDiff.updated.size).toBe(0); // newly created in same tx does not count as updated
        expect(firstDiff.deleted.size).toBe(0);
      }
    });
  });

  describe('Undo & Redo', () => {
    it('manages undo/redo history cleanly across transactions', () => {
      const store = new CanvasStore();
      expect(store.canUndo()).toBe(false);
      expect(store.canRedo()).toBe(false);

      store.createShape({ id: 's1', type: 'rect', x: 0, y: 0 });
      expect(store.canUndo()).toBe(true);

      store.updateShape('s1', { x: 100 });
      expect(store.getShape('s1')?.x).toBe(100);

      // Undo update
      expect(store.undo()).toBe(true);
      expect(store.getShape('s1')?.x).toBe(0);
      expect(store.canRedo()).toBe(true);

      // Undo creation
      expect(store.undo()).toBe(true);
      expect(store.hasShape('s1')).toBe(false);
      expect(store.canUndo()).toBe(false);

      // Redo creation
      expect(store.redo()).toBe(true);
      expect(store.hasShape('s1')).toBe(true);
      expect(store.getShape('s1')?.x).toBe(0);

      // Redo update
      expect(store.redo()).toBe(true);
      expect(store.getShape('s1')?.x).toBe(100);
      expect(store.canRedo()).toBe(false);
    });
  });

  describe('Snapshots & Validation', () => {
    it('supports snapshot serialization and restoration round-trips', () => {
      const store = new CanvasStore();
      store.createShape({
        id: 's1',
        type: 'rect',
        x: 10,
        y: 20,
        props: { fill: 'red' },
        meta: { tag: 'button' },
      });

      const snap = store.getSnapshot();
      expect(snap.version).toBe(1);
      expect(snap.shapes).toHaveLength(1);

      const newStore = new CanvasStore();
      newStore.loadSnapshot(snap);
      expect(newStore.getShape('s1')).toEqual(store.getShape('s1'));
    });

    it('rejects corrupt snapshots with CorruptSnapshotError', () => {
      const store = new CanvasStore();

      expect(() => store.loadSnapshot(null)).toThrow(CorruptSnapshotError);
      expect(() => store.loadSnapshot({ version: 0, shapes: [] })).toThrow(CorruptSnapshotError);
      expect(() => store.loadSnapshot({ version: 1, shapes: 'invalid' })).toThrow(CorruptSnapshotError);
      expect(() =>
        store.loadSnapshot({
          version: 1,
          shapes: [{ id: '', type: 'rect', x: 0, y: 0 }],
        })
      ).toThrow(CorruptSnapshotError);
      expect(() =>
        store.loadSnapshot({
          version: 1,
          shapes: [{ id: 's1', type: 'rect', x: NaN, y: 0, props: {}, meta: {} }],
        })
      ).toThrow(CorruptSnapshotError);
    });

    it('enforces registered meta-namespace validators during snapshot loading', () => {
      const store = new CanvasStore();
      store.registerMetaNamespace('semantics', (val) => {
        return typeof val === 'object' && val !== null && 'role' in val;
      });

      // Valid meta
      expect(() =>
        store.loadSnapshot({
          version: 1,
          shapes: [
            {
              id: 's1',
              type: 'rect',
              x: 0,
              y: 0,
              props: {},
              meta: { semantics: { role: 'container' } },
            },
          ],
        })
      ).not.toThrow();

      // Invalid meta fails validation
      expect(() =>
        store.loadSnapshot({
          version: 1,
          shapes: [
            {
              id: 's2',
              type: 'rect',
              x: 0,
              y: 0,
              props: {},
              meta: { semantics: 'invalid-string' },
            },
          ],
        })
      ).toThrow(CorruptSnapshotError);
    });
  });
});
