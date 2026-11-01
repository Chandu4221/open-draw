// Transactions (R-018, ADR-0002 D8): one gesture = one batch = one event.
// Applying a transaction returns the inverse batch; history is an inverse
// stack (see history.ts). No snapshots: undo is O(batch).
import { COMMANDS } from "./commands";
import type { Command, CommandResult } from "./commands";
import { applyCreateShape } from "./commands/create-shape";
import { applyDeleteShape } from "./commands/delete-shape";
import { applyMoveShapes } from "./commands/move-shapes";
import { applyReparentShape } from "./commands/reparent-shape";
import { applySetRootPlatform } from "./commands/set-root-platform";
import { applySetRootStyle } from "./commands/set-root-style";
import { applySetShapeBoundingBox } from "./commands/set-shape-bounding-box";
import { applySetShapeHiddenOn } from "./commands/set-shape-hidden-on";
import { applySetShapeLabel } from "./commands/set-shape-label";
import { applySetShapeOrder } from "./commands/set-shape-order";
import { applySetShapeSemantic } from "./commands/set-shape-semantic";
import type { Document } from "./document";
import { DocumentError } from "./errors";

export interface Transaction {
  readonly commands: readonly Command[];
}

export function createTransaction(commands: readonly Command[]): Transaction {
  if (commands.length === 0) {
    throw new DocumentError("invalidCommand", "a transaction requires at least one command");
  }
  return Object.freeze({ commands });
}

export interface TransactionResult {
  readonly document: Document;
  readonly inverse: readonly Command[];
}

function applyCommand(document: Document, command: Command): CommandResult {
  switch (command.type) {
    case COMMANDS.createShape:
      return applyCreateShape(document, command);
    case COMMANDS.deleteShape:
      return applyDeleteShape(document, command);
    case COMMANDS.setShapeLabel:
      return applySetShapeLabel(document, command);
    case COMMANDS.reparentShape:
      return applyReparentShape(document, command);
    case COMMANDS.moveShapes:
      return applyMoveShapes(document, command);
    case COMMANDS.setShapeBoundingBox:
      return applySetShapeBoundingBox(document, command);
    case COMMANDS.setShapeSemantic:
      return applySetShapeSemantic(document, command);
    case COMMANDS.setRootPlatform:
      return applySetRootPlatform(document, command);
    case COMMANDS.setRootStyle:
      return applySetRootStyle(document, command);
    case COMMANDS.setShapeHiddenOn:
      return applySetShapeHiddenOn(document, command);
    case COMMANDS.setShapeOrder:
      return applySetShapeOrder(document, command);
  }
}

export function applyTransaction(document: Document, transaction: Transaction): TransactionResult {
  let current = document;
  const inverse: Command[] = [];
  for (const command of transaction.commands) {
    const result = applyCommand(current, command);
    current = result.document;
    inverse.push(...result.inverse);
  }
  // Undo runs the inverses back-to-front.
  return { document: current, inverse: inverse.reverse() };
}
