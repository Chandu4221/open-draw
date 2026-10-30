// DeleteShape: removes a shape and its whole subtree; the inverse recreates
// the subtree parent-first, so undo restores it in one batch (ADR-0002 D8).
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { subtreeOf } from "../../tree";
import type { CreateShape } from "../create-shape";
import { COMMANDS } from "../registry";

export interface DeleteShape {
  readonly type: (typeof COMMANDS)["deleteShape"];
  readonly id: ShapeId;
}

export function applyDeleteShape(document: Document, command: DeleteShape): CommandResult {
  const subtree = subtreeOf(document, command.id);
  const removed = new Set(subtree.map((shape) => shape.id));
  const next = createDocument(
    Object.values(document.shapes).filter((shape) => !removed.has(shape.id)),
  );
  const inverse: readonly Command[] = [...subtree].reverse().map((shape): CreateShape => ({
    type: COMMANDS.createShape,
    shape,
  }));
  return { document: next, inverse };
}
