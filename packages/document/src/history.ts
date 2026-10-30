// History as an inverse stack (R-018, ADR-0002 D8): push the inverse batch
// after every transaction; undo applies it, redo applies the undo's inverse.
// Pure data in, pure data out (R-008).
import type { Command } from "./commands";
import type { Document } from "./document";
import { applyTransaction, createTransaction } from "./transactions";
import type { Transaction } from "./transactions";

export interface HistoryState {
  readonly undoStack: readonly Transaction[];
  readonly redoStack: readonly Transaction[];
}

export const EMPTY_HISTORY: HistoryState = { undoStack: [], redoStack: [] };

export interface UndoRedoResult {
  readonly document: Document;
  readonly history: HistoryState;
}

export function recordHistory(state: HistoryState, inverse: readonly Command[]): HistoryState {
  return {
    undoStack: [...state.undoStack, createTransaction(inverse)],
    redoStack: [],
  };
}

export function undo(document: Document, history: HistoryState): UndoRedoResult | null {
  const latest = history.undoStack[history.undoStack.length - 1];
  if (latest === undefined) {
    return null;
  }
  const result = applyTransaction(document, latest);
  return {
    document: result.document,
    history: {
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, createTransaction(result.inverse)],
    },
  };
}

export function redo(document: Document, history: HistoryState): UndoRedoResult | null {
  const latest = history.redoStack[history.redoStack.length - 1];
  if (latest === undefined) {
    return null;
  }
  const result = applyTransaction(document, latest);
  return {
    document: result.document,
    history: {
      undoStack: [...history.undoStack, createTransaction(result.inverse)],
      redoStack: history.redoStack.slice(0, -1),
    },
  };
}
