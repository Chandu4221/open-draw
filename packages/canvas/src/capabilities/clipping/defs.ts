import type { ShapeId } from '@open-draw/schema';

export interface ChildOrphanedEvent {
  readonly childId: ShapeId;
  readonly previousParentId: ShapeId;
}

export type OrphanListener = (event: ChildOrphanedEvent) => void;
