// Derived display names (ADR-0002 D5): labels describe for humans, ids
// identify for machines; the display name is never stored.
import { SHAPE_KIND_LABELS } from "@open-draw/contracts";
import type { Shape } from "./shape";

export function getDisplayName(shape: Shape): string {
  if (shape.label !== undefined && shape.label !== "") {
    return shape.label;
  }
  return SHAPE_KIND_LABELS[shape.kind];
}
