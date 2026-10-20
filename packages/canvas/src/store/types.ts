import type { ShapeId, ShapeRecord } from '@open-draw/schema';

export interface StoreDiff {
  readonly created: ReadonlySet<ShapeId>;
  readonly updated: ReadonlySet<ShapeId>;
  readonly deleted: ReadonlySet<ShapeId>;
}

export type StoreListener = (diff: StoreDiff) => void;
export type MetaValidator = (metaValue: unknown) => boolean;

export interface HistoryEntry {
  readonly before: Map<ShapeId, ShapeRecord>;
  readonly after: Map<ShapeId, ShapeRecord>;
}
