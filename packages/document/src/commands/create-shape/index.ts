// CreateShape: inserts a fully-formed shape (ADR-0002 D8). The inverse of a
// create is a delete of the created id.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface CreateShape {
  readonly type: (typeof COMMANDS)["createShape"];
  readonly shape: Shape;
}

export function applyCreateShape(document: Document, command: CreateShape): CommandResult {
  const { shape } = command;
  if (document.shapes[shape.id] !== undefined) {
    throw new DocumentError("duplicateShapeId", `shape already exists: ${shape.id}`);
  }
  const next = createDocument([...Object.values(document.shapes), shape]);
  const inverse: readonly Command[] = [{ type: COMMANDS.deleteShape, id: shape.id as ShapeId }];
  return { document: next, inverse };
}
