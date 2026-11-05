// SetRootDesignStyle: sets design style on root shapes ONLY for AI/developer handoff (R-026).
// Rejects non-root shapes with typed DocumentError.
import { type DesignStyleId, type ShapeId, isRootId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetRootDesignStyle {
  readonly type: (typeof COMMANDS)["setRootDesignStyle"];
  readonly id: ShapeId;
  readonly designStyle: DesignStyleId | null;
}

export function applySetRootDesignStyle(
  document: Document,
  command: SetRootDesignStyle,
): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }
  if (!isRootId(shape.parentId)) {
    throw new DocumentError("invalidShape", "design style may only be set on root shapes (R-026)");
  }

  const previousDesignStyle = shape.meta.designStyle ?? null;
  const nextMeta = { ...shape.meta };
  if (command.designStyle === null) {
    delete nextMeta.designStyle;
  } else {
    nextMeta.designStyle = command.designStyle;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setRootDesignStyle, id: command.id, designStyle: previousDesignStyle },
  ];
  return { document: next, inverse };
}
