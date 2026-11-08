// SetRootDarkMode: sets darkMode flag on root shapes ONLY (R-026).
// Rejects non-root shapes with typed DocumentError.
import { type ShapeId, isRootId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetRootDarkMode {
  readonly type: (typeof COMMANDS)["setRootDarkMode"];
  readonly id: ShapeId;
  readonly darkMode: boolean | null;
}

export function applySetRootDarkMode(document: Document, command: SetRootDarkMode): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  if (!isRootId(shape.parentId)) {
    throw new DocumentError("invalidShape", "darkMode may only be set on root shapes (R-026)");
  }

  const previousDarkMode = shape.meta.darkMode ?? null;
  const nextMeta = { ...shape.meta };
  if (command.darkMode === null || command.darkMode === false) {
    delete nextMeta.darkMode;
  } else {
    nextMeta.darkMode = true;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const shapes = Object.values(document.shapes).map((entry) =>
    entry.id === command.id ? nextShape : entry,
  );
  const next = createDocument(shapes);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setRootDarkMode, id: command.id, darkMode: previousDarkMode },
  ];
  return { document: next, inverse };
}
