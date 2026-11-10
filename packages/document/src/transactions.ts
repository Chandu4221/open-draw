// Transactions (R-018, ADR-0002 D8): one gesture = one batch = one event.
// Applying a transaction returns the inverse batch; history is an inverse
// stack (see history.ts). No snapshots: undo is O(batch).
import type { ShapeId } from "@open-draw/contracts";
import { applyCommandToMap } from "./apply-command";
import type { Command, CommandResult } from "./commands";
import { createDocumentFromMap, type Document } from "./document";
import { DocumentError } from "./errors";
import type { Shape } from "./shape";

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

export function applyCommand(document: Document, command: Command): CommandResult {
  const shapes: Record<ShapeId, Shape> = { ...document.shapes };
  const inverse = applyCommandToMap(shapes, command);
  return { document: createDocumentFromMap(shapes), inverse };
}

export function applyTransaction(document: Document, transaction: Transaction): TransactionResult {
  const shapes: Record<ShapeId, Shape> = { ...document.shapes };
  const inverse: Command[] = [];
  for (const command of transaction.commands) {
    const inv = applyCommandToMap(shapes, command);
    inverse.push(...inv);
  }
  const nextDoc = createDocumentFromMap(shapes);
  // Undo runs the inverses back-to-front.
  return { document: nextDoc, inverse: inverse.reverse() };
}
