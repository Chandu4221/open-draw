// Selection is transient canvas state, never document data (R-016 placement
// test: it does not survive save + reload). A set, ready for multi-select;
// this milestone only ever feeds it one id.
import type { ShapeId } from "@open-draw/contracts";

export type Selection = ReadonlySet<ShapeId>;

export const EMPTY_SELECTION: Selection = new Set();

export function selectOne(id: ShapeId): Selection {
  return new Set([id]);
}

export function clearSelection(): Selection {
  return EMPTY_SELECTION;
}

export function isSelected(selection: Selection, id: ShapeId): boolean {
  return selection.has(id);
}

export function singleSelected(selection: Selection): ShapeId | null {
  for (const id of selection) {
    return id;
  }
  return null;
}
