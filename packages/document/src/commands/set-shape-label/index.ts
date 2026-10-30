// SetShapeLabel: sets or clears (null) the only human-authored stored field
// (ADR-0002 D5). Inverse restores the previous label.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeLabel {
  readonly type: (typeof COMMANDS)["setShapeLabel"];
  readonly id: ShapeId;
  readonly label: string | null;
}

function withoutLabel(shape: Shape): Shape {
  const copy: { label?: string } = { ...shape };
  delete copy.label;
  return copy as Shape;
}

export function applySetShapeLabel(document: Document, command: SetShapeLabel): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  const previousLabel = shape.label === undefined ? null : shape.label;
  const nextShape =
    command.label === null ? withoutLabel(shape) : ({ ...shape, label: command.label } as Shape);
  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setShapeLabel, id: command.id, label: previousLabel },
  ];
  return { document: next, inverse };
}
