// SetRootTheme: sets brand theme palette on root shapes ONLY (R-026).
// Rejects non-root shapes with typed DocumentError.
import { type ShapeId, type ThemePalette, isRootId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetRootTheme {
  readonly type: (typeof COMMANDS)["setRootTheme"];
  readonly id: ShapeId;
  readonly theme: ThemePalette | null;
}

export function applySetRootTheme(document: Document, command: SetRootTheme): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  if (!isRootId(shape.parentId)) {
    throw new DocumentError("invalidShape", "theme may only be set on root shapes (R-026)");
  }

  const previousTheme = shape.meta.theme ?? null;
  const nextMeta = { ...shape.meta };
  if (command.theme === null) {
    delete nextMeta.theme;
  } else {
    nextMeta.theme = command.theme;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setRootTheme, id: command.id, theme: previousTheme },
  ];
  return { document: next, inverse };
}
