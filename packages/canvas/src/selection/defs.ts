import type { ShapeId } from '@open-draw/schema';

export interface SelectionState {
  readonly selectedIds: readonly ShapeId[];
}

export type SelectionListener = (selection: readonly ShapeId[]) => void;
