// SetShapeSemantic: sets or clears (null) the semantic tag on a shape (R-024).
// Inverse restores the previous semantic tag.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { SemanticTag, Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeSemantic {
  readonly type: (typeof COMMANDS)["setShapeSemantic"];
  readonly id: ShapeId;
  readonly semantic: SemanticTag | null;
}

export function applySetShapeSemantic(
  document: Document,
  command: SetShapeSemantic,
): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousSemantic = shape.meta.semantic ?? null;

  const nextMeta = { ...shape.meta };
  if (command.semantic === null) {
    delete nextMeta.semantic;
  } else {
    nextMeta.semantic = command.semantic;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setShapeSemantic, id: command.id, semantic: previousSemantic },
  ];
  return { document: next, inverse };
}
