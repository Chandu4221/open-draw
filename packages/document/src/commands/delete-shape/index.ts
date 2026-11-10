// DeleteShape: removes a shape and its whole subtree; the inverse recreates
// the subtree parent-first, so undo restores it in one batch (ADR-0002 D8).
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import type { Shape } from "../../shape";
import { createDocumentFromMap, SCHEMA_VERSION } from "../../document";
import { subtreeOf } from "../../tree";
import type { CreateShape } from "../create-shape";
import { COMMANDS } from "../registry";

export interface DeleteShape {
  readonly type: (typeof COMMANDS)["deleteShape"];
  readonly id: ShapeId;
}

export function mutateDeleteShape(
  shapes: Record<ShapeId, Shape>,
  command: DeleteShape,
): readonly Command[] {
  const dummyDoc = { schema: { version: SCHEMA_VERSION }, shapes } as unknown as Document;
  const subtree = subtreeOf(dummyDoc, command.id);
  for (const shape of subtree) {
    delete shapes[shape.id];
  }
  const inverse: readonly Command[] = [...subtree].reverse().map((shape): CreateShape => ({
    type: COMMANDS.createShape,
    shape,
  }));
  return inverse;
}

export function applyDeleteShape(document: Document, command: DeleteShape): CommandResult {
  const shapes = { ...document.shapes };
  const inverse = mutateDeleteShape(shapes, command);
  return { document: createDocumentFromMap(shapes), inverse };
}
