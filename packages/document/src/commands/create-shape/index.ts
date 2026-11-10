// CreateShape: inserts a fully-formed shape (ADR-0002 D8). The inverse of a
// create is a delete of the created id.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocumentFromMap } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { parseShape } from "../../validation";
import { COMMANDS } from "../registry";

export interface CreateShape {
  readonly type: (typeof COMMANDS)["createShape"];
  readonly shape: Shape;
}

export function mutateCreateShape(
  shapes: Record<ShapeId, Shape>,
  command: CreateShape,
): readonly Command[] {
  const shape = parseShape(command.shape);
  if (shapes[shape.id] !== undefined) {
    throw new DocumentError("duplicateShapeId", `shape already exists: ${shape.id}`);
  }
  shapes[shape.id] = shape;
  return [{ type: COMMANDS.deleteShape, id: shape.id as ShapeId }];
}

export function applyCreateShape(document: Document, command: CreateShape): CommandResult {
  const shapes = { ...document.shapes };
  const inverse = mutateCreateShape(shapes, command);
  return { document: createDocumentFromMap(shapes), inverse };
}
