// SetRootStyle: sets style on root pages ONLY (R-026, ADR-0004 D7).
// Rejects non-root shapes with typed DocumentError.
import { type ShapeId, type StyleId, isRootId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetRootStyle {
  readonly type: (typeof COMMANDS)["setRootStyle"];
  readonly id: ShapeId;
  readonly style: StyleId | null;
}

export function applySetRootStyle(document: Document, command: SetRootStyle): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  if (!isRootId(shape.parent) || shape.kind !== "page") {
    throw new DocumentError("invalidShape", "style may only be set on root pages (R-026)");
  }

  const previousStyle = shape.meta.style ?? null;
  const nextMeta = { ...shape.meta };
  if (command.style === null) {
    delete nextMeta.style;
  } else {
    nextMeta.style = command.style;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setRootStyle, id: command.id, style: previousStyle },
  ];
  return { document: next, inverse };
}
