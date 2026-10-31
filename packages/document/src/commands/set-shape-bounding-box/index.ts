// SetShapeBoundingBox: replaces one shape's bounding box (resize, ADR-0002
// D4). The inverse restores the previous box. Geometry only — render styles
// never alter semantics (R-021). Named per R-039: explicit over short.
import type { BoundingBox, ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeBoundingBox {
  readonly type: (typeof COMMANDS)["setShapeBoundingBox"];
  readonly id: ShapeId;
  readonly boundingBox: BoundingBox;
}

export function applySetShapeBoundingBox(
  document: Document,
  command: SetShapeBoundingBox,
): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousBox = shape.boundingBox;
  const nextShape: Shape = { ...shape, boundingBox: command.boundingBox };
  // Replace in place, preserving map iteration order — the same z-stack rule
  // as MoveShapes (review round 2, Finding 3: filter-and-append would pop
  // the resized shape to the top of the sibling stack).
  const shapes = Object.values(document.shapes).map((entry): Shape =>
    entry.id === command.id ? nextShape : entry,
  );
  const next = createDocument(shapes);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setShapeBoundingBox, id: command.id, boundingBox: previousBox },
  ];
  return { document: next, inverse };
}
