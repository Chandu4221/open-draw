// SetRootPlatform: sets platform on root shapes ONLY (R-026, ADR-0004 D7).
// Rejects non-root shapes with typed DocumentError.
import { type PlatformId, type ShapeId, isRootId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetRootPlatform {
  readonly type: (typeof COMMANDS)["setRootPlatform"];
  readonly id: ShapeId;
  readonly platform: PlatformId | null;
}

export function applySetRootPlatform(document: Document, command: SetRootPlatform): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  if (!isRootId(shape.parent)) {
    throw new DocumentError("invalidShape", "platform may only be set on root shapes (R-026)");
  }

  const previousPlatform = shape.meta.platform ?? null;
  const nextMeta = { ...shape.meta };
  if (command.platform === null) {
    delete nextMeta.platform;
  } else {
    nextMeta.platform = command.platform;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setRootPlatform, id: command.id, platform: previousPlatform },
  ];
  return { document: next, inverse };
}
