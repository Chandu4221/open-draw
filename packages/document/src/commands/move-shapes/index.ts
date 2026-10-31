// MoveShapes: translates shapes by a parent-local delta (ADR-0002 D4 —
// parent-local coordinates). One gesture = one command batch (R-018). The
// inverse is the same batch negated — no snapshots (R-008).
import type { ShapeId } from "@open-draw/contracts";
import type { Command, CommandResult } from "..";
import type { Document } from "../../document";
import { createDocument } from "../../document";
import { DocumentError } from "../../errors";
import type { Shape } from "../../shape";
import { COMMANDS } from "../registry";

export interface MoveShapes {
  readonly type: (typeof COMMANDS)["moveShapes"];
  readonly ids: readonly ShapeId[];
  readonly dx: number;
  readonly dy: number;
}

export function applyMoveShapes(document: Document, command: MoveShapes): CommandResult {
  for (const id of command.ids) {
    if (document.shapes[id] === undefined) {
      throw new DocumentError("shapeNotFound", `no shape with id: ${id}`);
    }
  }
  // Replace in place, preserving map iteration order — rebuilding the map as
  // [others, moved] would pop moved shapes to the top of the z-stack
  // (review finding: sibling order IS map order).
  const movedIds = new Set<ShapeId>(command.ids);
  const shapes = Object.values(document.shapes).map((shape): Shape =>
    movedIds.has(shape.id)
      ? {
          ...shape,
          boundingBox: {
            ...shape.boundingBox,
            x: shape.boundingBox.x + command.dx,
            y: shape.boundingBox.y + command.dy,
          },
        }
      : shape,
  );
  const next = createDocument(shapes);
  const inverse: readonly Command[] = [
    { type: COMMANDS.moveShapes, ids: command.ids, dx: -command.dx, dy: -command.dy },
  ];
  return { document: next, inverse };
}
