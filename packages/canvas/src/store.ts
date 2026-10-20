import { CorruptSnapshotError, type ShapeId, type ShapeRecord, type Snapshot } from '@open-draw/schema';

export interface StoreDiff {
  readonly created: ReadonlySet<ShapeId>;
  readonly updated: ReadonlySet<ShapeId>;
  readonly deleted: ReadonlySet<ShapeId>;
}

export type StoreListener = (diff: StoreDiff) => void;
export type MetaValidator = (metaValue: unknown) => boolean;

interface HistoryEntry {
  readonly before: Map<ShapeId, ShapeRecord>;
  readonly after: Map<ShapeId, ShapeRecord>;
}

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

  registerMetaNamespace(namespace: string, validator: MetaValidator): void {
    this.metaValidators.set(namespace, validator);
  }

  getShape(id: ShapeId): ShapeRecord | undefined {
    return this.shapes.get(id);
  }

  hasShape(id: ShapeId): boolean {
    return this.shapes.has(id);
  }

  listShapes(): ReadonlyArray<ShapeRecord> {
    return Array.from(this.shapes.values());
  }

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

    const updated: ShapeRecord = Object.freeze({
      ...existing,
      ...patch,
      meta: patch.meta ? Object.freeze({ ...existing.meta, ...patch.meta }) : existing.meta,
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

  transact(fn: () => void): void {
    if (!this.isTransacting) {
      this.isTransacting = true;
      this.transactionDepth = 1;
      this.transactionInitialShapes = new Map(this.shapes);
      this.pendingCreated.clear();
      this.pendingUpdated.clear();
      this.pendingDeleted.clear();

      try {
        fn();

        // Commit transaction
        const before = this.transactionInitialShapes;
        const after = new Map(this.shapes);

        this.undoStack.push({ before, after });
        this.redoStack = [];

        const diff: StoreDiff = {
          created: new Set(this.pendingCreated),
          updated: new Set(this.pendingUpdated),
          deleted: new Set(this.pendingDeleted),
        };

        this.isTransacting = false;
        this.transactionDepth = 0;
        this.transactionInitialShapes = null;

        if (diff.created.size > 0 || diff.updated.size > 0 || diff.deleted.size > 0) {
          this.notifyListeners(diff);
        }
      } catch (err) {
        // Rollback transaction atomically
        if (this.transactionInitialShapes) {
          this.shapes = new Map(this.transactionInitialShapes);
        }
        this.isTransacting = false;
        this.transactionDepth = 0;
        this.transactionInitialShapes = null;
        this.pendingCreated.clear();
        this.pendingUpdated.clear();
        this.pendingDeleted.clear();
        throw err;
      }
    } else {
      this.transactionDepth++;
      try {
        fn();
      } finally {
        this.transactionDepth--;
      }
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const entry = this.undoStack.pop();
    if (!entry) return false;

    const currentShapes = new Map(this.shapes);
    this.redoStack.push({ before: entry.before, after: currentShapes });
    this.shapes = new Map(entry.before);

    const diff = this.computeDiff(currentShapes, this.shapes);
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

    const diff = this.computeDiff(currentShapes, this.shapes);
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
    if (!snapshot || typeof snapshot !== 'object') {
      throw new CorruptSnapshotError('Snapshot must be an object');
    }

    const s = snapshot as Partial<Snapshot>;
    if (typeof s.version !== 'number' || s.version < 1) {
      throw new CorruptSnapshotError(`Invalid snapshot version: ${s.version}`);
    }

    if (!Array.isArray(s.shapes)) {
      throw new CorruptSnapshotError('Snapshot shapes must be an array');
    }

    const newShapes = new Map<ShapeId, ShapeRecord>();

    for (const item of s.shapes) {
      if (!item || typeof item !== 'object') {
        throw new CorruptSnapshotError('Shape record must be an object');
      }

      if (typeof item.id !== 'string' || item.id.trim() === '') {
        throw new CorruptSnapshotError('Shape record must have a non-empty string id');
      }

      if (typeof item.type !== 'string' || item.type.trim() === '') {
        throw new CorruptSnapshotError(`Shape "${item.id}" must have a non-empty string type`);
      }

      if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) {
        throw new CorruptSnapshotError(`Shape "${item.id}" must have finite x and y coordinates`);
      }

      if (!item.props || typeof item.props !== 'object') {
        throw new CorruptSnapshotError(`Shape "${item.id}" props must be an object`);
      }

      if (!item.meta || typeof item.meta !== 'object') {
        throw new CorruptSnapshotError(`Shape "${item.id}" meta must be an object`);
      }

      // Validate registered meta namespaces
      const meta = item.meta as Record<string, unknown>;
      for (const [namespace, validator] of this.metaValidators.entries()) {
        if (namespace in meta) {
          const isValid = validator(meta[namespace]);
          if (!isValid) {
            throw new CorruptSnapshotError(
              `Shape "${item.id}" contains invalid meta for namespace "${namespace}"`
            );
          }
        }
      }

      const validatedShape: ShapeRecord = Object.freeze({
        id: item.id,
        type: item.type,
        x: item.x,
        y: item.y,
        rotation: typeof item.rotation === 'number' ? item.rotation : 0,
        hidden: Boolean(item.hidden),
        meta: Object.freeze({ ...meta }),
        props: Object.freeze({ ...item.props }),
      });

      newShapes.set(validatedShape.id, validatedShape);
    }

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

  private computeDiff(before: Map<ShapeId, ShapeRecord>, after: Map<ShapeId, ShapeRecord>): StoreDiff {
    const created = new Set<ShapeId>();
    const updated = new Set<ShapeId>();
    const deleted = new Set<ShapeId>();

    for (const [id] of after) {
      if (!before.has(id)) {
        created.add(id);
      } else if (before.get(id) !== after.get(id)) {
        updated.add(id);
      }
    }

    for (const [id] of before) {
      if (!after.has(id)) {
        deleted.add(id);
      }
    }

    return { created, updated, deleted };
  }
}
