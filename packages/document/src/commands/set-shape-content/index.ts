// SetShapeContent: sets or clears (null) the visible inner text of a shape.
// Inverse restores previous content.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeContent {
  readonly type: (typeof COMMANDS)["setShapeContent"];
  readonly id: ShapeId;
  readonly content: string | null;
}

function withoutContent(shape: Shape): Shape {
  const copy: { content?: string } = { ...shape };
  delete copy.content;
  return copy as Shape;
}

export function applySetShapeContent(document: Document, command: SetShapeContent): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousContent = shape.content === undefined ? null : shape.content;
  const nextShape =
    command.content === null
      ? withoutContent(shape)
      : ({ ...shape, content: command.content } as Shape);
  const shapes = Object.values(document.shapes).map((entry) =>
    entry.id === command.id ? nextShape : entry,
  );
  const next = createDocument(shapes);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setShapeContent, id: command.id, content: previousContent },
  ];
  return { document: next, inverse };
}
