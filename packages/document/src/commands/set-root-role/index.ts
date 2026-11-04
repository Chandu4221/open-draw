// SetRootRole: sets role (screen vs component) on root shapes ONLY (R-026).
// Rejects non-root shapes with typed DocumentError.
import { type RootRole, type ShapeId, isRootId, isRootRole } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetRootRole {
  readonly type: (typeof COMMANDS)["setRootRole"];
  readonly id: ShapeId;
  readonly role: RootRole | null;
}

export function applySetRootRole(document: Document, command: SetRootRole): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  if (!isRootId(shape.parent)) {
    throw new DocumentError("invalidShape", "role may only be set on root shapes (R-026)");
  }
  if (command.role !== null && !isRootRole(command.role)) {
    throw new DocumentError("invalidCommand", `unknown role: ${String(command.role)}`);
  }

  const previousRole = shape.meta.role ?? null;
  const nextMeta = { ...shape.meta };
  if (command.role === null) {
    delete nextMeta.role;
  } else {
    nextMeta.role = command.role;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setRootRole, id: command.id, role: previousRole },
  ];
  return { document: next, inverse };
}
