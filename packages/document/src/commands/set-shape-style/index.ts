// SetShapeStyle: sets or clears (null) shape styling (fill, stroke, strokeWidth).
// (ADR-0006 Option A, F1). Inverse restores previous style values.
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface SetShapeStyle {
  readonly type: (typeof COMMANDS)["setShapeStyle"];
  readonly id: ShapeId;
  readonly fill?: string | null | undefined;
  readonly stroke?: string | null | undefined;
  readonly strokeWidth?: number | null | undefined;
}

export function applySetShapeStyle(document: Document, command: SetShapeStyle): CommandResult {
  const shape = document.shapes[command.id];
  if (shape === undefined) {
    throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
  }

  const previousFill = shape.fill === undefined ? null : shape.fill;
  const previousStroke = shape.stroke === undefined ? null : shape.stroke;
  const previousStrokeWidth = shape.strokeWidth === undefined ? null : shape.strokeWidth;

  const nextShapeData: Record<string, unknown> = { ...shape };

  if (command.fill !== undefined) {
    if (command.fill === null) {
      delete nextShapeData.fill;
    } else {
      nextShapeData.fill = command.fill;
    }
  }

  if (command.stroke !== undefined) {
    if (command.stroke === null) {
      delete nextShapeData.stroke;
    } else {
      nextShapeData.stroke = command.stroke;
    }
  }

  if (command.strokeWidth !== undefined) {
    if (command.strokeWidth === null) {
      delete nextShapeData.strokeWidth;
    } else {
      nextShapeData.strokeWidth = command.strokeWidth;
    }
  }

  const nextShape = nextShapeData as unknown as Shape;
  const others = Object.values(document.shapes).filter((entry) => entry.id !== command.id);
  const next = createDocument([...others, nextShape]);

  const inverse: readonly Command[] = [
    {
      type: COMMANDS.setShapeStyle,
      id: command.id,
      fill: previousFill,
      stroke: previousStroke,
      strokeWidth: previousStrokeWidth,
    },
  ];

  return { document: next, inverse };
}
