// SetShapeBoundingBox: replaces one shape's bounding box (resize, ADR-0002
// D4, ADR-0003 D5). The inverse restores the previous box. Geometry only — render
// styles never alter semantics (R-021). Named per R-039: explicit over short.
// For point-carrying kinds (line, pen-path), points are proportionally scaled to
// preserve geometry within the new bounding box.
import type { BoundingBox, ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import { isCustomShape, type Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeBoundingBox {
  readonly type: (typeof COMMANDS)["setShapeBoundingBox"];
  readonly id: ShapeId;
  readonly boundingBox: BoundingBox;
}

export type ShapeScaleHook = (shape: Shape, prevBox: BoundingBox, nextBox: BoundingBox) => Shape;

export function applySetShapeBoundingBox(
  document: Document,
  command: SetShapeBoundingBox,
  scaleHook?: ShapeScaleHook,
): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousBox = shape.boundingBox;

  let nextShape: Shape;
  if (scaleHook !== undefined) {
    nextShape = scaleHook(shape, previousBox, command.boundingBox);
  } else if (!isCustomShape(shape)) {
    switch (shape.kind) {
      case "line": {
        const scaleX = previousBox.width === 0 ? 1 : command.boundingBox.width / previousBox.width;
        const scaleY =
          previousBox.height === 0 ? 1 : command.boundingBox.height / previousBox.height;
        nextShape = {
          ...shape,
          boundingBox: command.boundingBox,
          start: { x: shape.start.x * scaleX, y: shape.start.y * scaleY },
          end: { x: shape.end.x * scaleX, y: shape.end.y * scaleY },
        };
        break;
      }
      case "pen-path": {
        const scaleX = previousBox.width === 0 ? 1 : command.boundingBox.width / previousBox.width;
        const scaleY =
          previousBox.height === 0 ? 1 : command.boundingBox.height / previousBox.height;
        nextShape = {
          ...shape,
          boundingBox: command.boundingBox,
          points: shape.points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY })),
        };
        break;
      }
      default: {
        nextShape = { ...shape, boundingBox: command.boundingBox };
        break;
      }
    }
  } else {
    nextShape = { ...shape, boundingBox: command.boundingBox };
  }

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
