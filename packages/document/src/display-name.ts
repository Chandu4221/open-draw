// Derived display names (ADR-0002 D5, R-042): labels describe for humans, ids
// identify for machines; the display name is never stored.
import { SHAPE_KIND_LABELS, type BuiltinShapeKind } from "@open-draw/contracts";
import type { Shape } from "./shape";

export function getDisplayName(shape: Shape): string {
  if (shape.label !== undefined && shape.label !== "") {
    return shape.label;
  }
  return shape.kind in SHAPE_KIND_LABELS
    ? SHAPE_KIND_LABELS[shape.kind as BuiltinShapeKind]
    : shape.kind;
}
