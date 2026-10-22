import type { ShapeId, ShapeRecord, Snapshot } from '@open-draw/schema';
import { computeDiff, parseAndValidateSnapshot } from './snapshot.js';
import type { HistoryEntry, MetaValidator, StoreDiff, StoreListener } from './types.js';
import { reorderShapes, type ZOrderOperation } from './zorder.js';

export type { HistoryEntry, MetaValidator, StoreDiff, StoreListener };

export class CanvasStore {
  private shapes: Map<ShapeId, ShapeRecord> = new Map();
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private listeners: Set<StoreListener> = new Set();
  private metaValidators: Map<string, MetaValidator> = new Map();

  private isTransacting = false;
  private transactionDepth = 0;
  private transactionInitialShapes: Map<ShapeId, ShapeRecord> | null = null;
  private pendingCreated: Set<ShapeId> = new Set();
  private pendingUpdated: Set<ShapeId> = new Set();
  private pendingDeleted: Set<ShapeId> = new Set();

  registerMetaNamespace(namespace: string, validator: MetaValidator): void { this.metaValidators.set(namespace, validator); }
  getShape(id: ShapeId): ShapeRecord | undefined { return this.shapes.get(id); }
  hasShape(id: ShapeId): boolean { return this.shapes.has(id); }
  listShapes(): ReadonlyArray<ShapeRecord> { return Array.from(this.shapes.values()); }

  createShape(record: {
    readonly id: ShapeId;
    readonly type: string;
    readonly x: number;
    readonly y: number;
    readonly rotation?: number;
    readonly hidden?: boolean;
    readonly meta?: Record<string, unknown>;
    readonly props?: Record<string, unknown>;
  }): ShapeRecord {
    if (this.shapes.has(record.id)) {
      throw new Error(`Shape with id "${record.id}" already exists`);
    }

    const shape: ShapeRecord = Object.freeze({
      id: record.id,
      type: record.type,
      x: record.x,
      y: record.y,
      rotation: record.rotation ?? 0,
      hidden: record.hidden ?? false,
      meta: Object.freeze({ ...(record.meta ?? {}) }),
      props: Object.freeze({ ...(record.props ?? {}) }),
    });

    if (!this.isTransacting) {
      this.transact(() => {
        this.applyCreate(shape);
      });
    } else {
      this.applyCreate(shape);
    }

    return shape;
  }

  updateShape(
    id: ShapeId,
    patch: Partial<Omit<ShapeRecord, 'id' | 'type'>>
  ): ShapeRecord {
    const existing = this.shapes.get(id);
    if (!existing) {
      throw new Error(`Cannot update non-existent shape "${id}"`);
    }

    let meta = existing.meta;
    if (patch.meta) {
      const merged: Record<string, unknown> = { ...existing.meta, ...patch.meta };
      for (const k of Object.keys(merged)) {
        if (merged[k] === undefined) delete merged[k];
      }
      meta = Object.freeze(merged);
    }

    const updated: ShapeRecord = Object.freeze({
      ...existing,
      ...patch,
      meta,
      props: patch.props ? Object.freeze({ ...existing.props, ...patch.props }) : existing.props,
    });

    if (!this.isTransacting) {
      this.transact(() => {
        this.applyUpdate(updated);
      });
    } else {
      this.applyUpdate(updated);
    }

    return updated;
  }

  deleteShape(id: ShapeId): boolean {
    if (!this.shapes.has(id)) {
      return false;
    }

    if (!this.isTransacting) {
      this.transact(() => {
        this.applyDelete(id);
      });
    } else {
      this.applyDelete(id);
    }

    return true;
  }

  beginTransaction(): void {
    if (!this.isTransacting) {
      this.isTransacting = true;
      this.transactionDepth = 1;
      this.transactionInitialShapes = new Map(this.shapes);
      this.pendingCreated.clear();
      this.pendingUpdated.clear();
      this.pendingDeleted.clear();
    } else {
      this.transactionDepth++;
    }
  }

  commitTransaction(): void {
    if (!this.isTransacting) {
      return;
    }
    this.transactionDepth--;
    if (this.transactionDepth > 0) {
      return;
    }

    const hasChanges =
      this.pendingCreated.size > 0 ||
      this.pendingUpdated.size > 0 ||
      this.pendingDeleted.size > 0;

    if (hasChanges) {
      const before = this.transactionInitialShapes ?? new Map();
      const after = new Map(this.shapes);
      this.undoStack.push({ before, after });
      this.redoStack = [];
    }

    const diff: StoreDiff = {
      created: new Set(this.pendingCreated),
      updated: new Set(this.pendingUpdated),
      deleted: new Set(this.pendingDeleted),
    };

    this.isTransacting = false;
    this.transactionDepth = 0;
    this.transactionInitialShapes = null;

    if (hasChanges) {
      this.notifyListeners(diff);
    }
  }

  rollbackTransaction(): void {
    if (!this.isTransacting) {
      return;
    }
    if (this.transactionInitialShapes) {
      this.shapes = new Map(this.transactionInitialShapes);
    }
    this.isTransacting = false;
    this.transactionDepth = 0;
    this.transactionInitialShapes = null;
    this.pendingCreated.clear();
    this.pendingUpdated.clear();
    this.pendingDeleted.clear();
  }

  transact(fn: () => void): void {
    this.beginTransaction();
    try {
      fn();
      this.commitTransaction();
    } catch (err) {
      this.rollbackTransaction();
      throw err;
    }
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
  clearHistory(): void { this.undoStack = []; this.redoStack = []; }

  mergeLastHistoryEntry(): void {
    if (this.undoStack.length < 2) return;
    const current = this.undoStack.pop()!;
    const prev = this.undoStack[this.undoStack.length - 1]!;
    this.undoStack[this.undoStack.length - 1] = { before: prev.before, after: current.after };
  }

  reorderShapes(op: ZOrderOperation, ids: readonly ShapeId[]): void {
    if (ids.length === 0) return;
    const reordered = reorderShapes(Array.from(this.shapes.values()), ids, op);
    const before = new Map(this.shapes);
    const after = new Map<ShapeId, ShapeRecord>();
    for (const s of reordered) after.set(s.id, s);
    this.undoStack.push({ before, after });
    this.redoStack = [];
    this.shapes = after;
    this.notifyListeners({ created: new Set(), updated: new Set(), deleted: new Set() });
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const entry = this.undoStack.pop();
    if (!entry) return false;

    const currentShapes = new Map(this.shapes);
    this.redoStack.push({ before: entry.before, after: currentShapes });
    this.shapes = new Map(entry.before);

    const diff = computeDiff(currentShapes, this.shapes);
    this.notifyListeners(diff);
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    const entry = this.redoStack.pop();
    if (!entry) return false;

    const currentShapes = new Map(this.shapes);
    this.undoStack.push({ before: currentShapes, after: entry.after });
    this.shapes = new Map(entry.after);

    const diff = computeDiff(currentShapes, this.shapes);
    this.notifyListeners(diff);
    return true;
  }

  listen(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): Snapshot {
    return {
      version: 1,
      shapes: this.listShapes(),
    };
  }

  loadSnapshot(snapshot: unknown): void {
    const newShapes = parseAndValidateSnapshot(snapshot, this.metaValidators);
    this.transact(() => {
      this.shapes = newShapes;
    });
  }

  private applyCreate(shape: ShapeRecord): void {
    this.shapes.set(shape.id, shape);
    this.pendingCreated.add(shape.id);
  }

  private applyUpdate(shape: ShapeRecord): void {
    this.shapes.set(shape.id, shape);
    if (!this.pendingCreated.has(shape.id)) {
      this.pendingUpdated.add(shape.id);
    }
  }

  private applyDelete(id: ShapeId): void {
    this.shapes.delete(id);
    if (this.pendingCreated.has(id)) {
      this.pendingCreated.delete(id);
    } else {
      this.pendingUpdated.delete(id);
      this.pendingDeleted.add(id);
    }
  }

  private notifyListeners(diff: StoreDiff): void {
    for (const listener of this.listeners) {
      try {
        listener(diff);
      } catch (err) {
        console.error('Store listener error:', err);
      }
    }
  }
}

