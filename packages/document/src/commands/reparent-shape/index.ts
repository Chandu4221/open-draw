// ReparentShape: moves a shape under a new parent; the caller supplies the
// new parent-local bounding box (ADR-0002 D4/D8). The inverse restores the
// old parent and bounding box. Cycles are rejected by createDocument's
// structural validation.
import type { BoundingBox, ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import { COMMANDS } from "../registry";

export interface ReparentShape {
  readonly type: (typeof COMMANDS)["reparentShape"];
  readonly id: ShapeId;
  readonly parent: ShapeId;
  readonly boundingBox: BoundingBox;
}

export function applyReparentShape(document: Document, command: ReparentShape): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousParent = shape.parent;
  const previousBoundingBox = shape.boundingBox;
  const moved = { ...shape, parent: command.parent, boundingBox: command.boundingBox };
  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, moved]);
  const inverse: readonly Command[] = [
    {
      type: COMMANDS.reparentShape,
      id: command.id,
      parent: previousParent,
      boundingBox: previousBoundingBox,
    },
  ];
  return { document: next, inverse };
}
