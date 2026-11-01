// SetShapeOrder: sets responsive flex order for a specific DeviceType (R-027).
// Inverse restores previous order.
import type { DeviceType, ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeOrder {
  readonly type: (typeof COMMANDS)["setShapeOrder"];
  readonly id: ShapeId;
  readonly deviceType: DeviceType;
  readonly order: number | null;
}

export function applySetShapeOrder(document: Document, command: SetShapeOrder): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }

  const previousOrder = shape.meta.order[command.deviceType] ?? null;
  const nextOrder = { ...shape.meta.order };
  if (command.order === null) {
    delete nextOrder[command.deviceType];
  } else {
    nextOrder[command.deviceType] = command.order;
  }

  const nextShape: Shape = {
    ...shape,
    meta: {
      ...shape.meta,
      order: nextOrder,
    },
  };

  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);
  const inverse: readonly Command[] = [
    {
      type: COMMANDS.setShapeOrder,
      id: command.id,
      deviceType: command.deviceType,
      order: previousOrder,
    },
  ];
  return { document: next, inverse };
}
