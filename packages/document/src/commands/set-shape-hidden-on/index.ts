// SetShapeHiddenOn: updates responsive visibility per DeviceType (R-028, R-029).
// Inverse restores previous hiddenOn list.
import type { DeviceType, ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeHiddenOn {
  readonly type: (typeof COMMANDS)["setShapeHiddenOn"];
  readonly id: ShapeId;
  readonly hiddenOn: readonly DeviceType[] | null;
}

export function applySetShapeHiddenOn(
  document: Document,
  command: SetShapeHiddenOn,
): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }

  const previousHiddenOn = shape.meta.hiddenOn ?? null;
  const nextMeta = { ...shape.meta };
  if (command.hiddenOn === null || command.hiddenOn.length === 0) {
    delete nextMeta.hiddenOn;
  } else {
    nextMeta.hiddenOn = command.hiddenOn;
  }

  const nextShape: Shape = {
    ...shape,
    meta: nextMeta,
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    { type: COMMANDS.setShapeHiddenOn, id: command.id, hiddenOn: previousHiddenOn },
  ];
  return { document: next, inverse };
}
