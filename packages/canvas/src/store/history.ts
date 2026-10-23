import type { ShapeId, ShapeRecord } from '@open-draw/schema';
import type { HistoryEntry } from './types.js';

export class HistoryStack {
  readonly undoStack: HistoryEntry[] = [];
  readonly redoStack: HistoryEntry[] = [];

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  push(entry: HistoryEntry): void {
    this.undoStack.push(entry);
    this.redoStack.length = 0;
  }

  mergeLast(): void {
    if (this.undoStack.length < 2) return;
    const current = this.undoStack.pop()!;
    const prev = this.undoStack[this.undoStack.length - 1]!;
    this.undoStack[this.undoStack.length - 1] = { before: prev.before, after: current.after };
  }

  undo(currentShapes: Map<ShapeId, ShapeRecord>): Map<ShapeId, ShapeRecord> | null {
    if (!this.canUndo()) return null;
    const entry = this.undoStack.pop()!;
    this.redoStack.push({ before: entry.before, after: currentShapes });
    return new Map(entry.before);
  }

  redo(currentShapes: Map<ShapeId, ShapeRecord>): Map<ShapeId, ShapeRecord> | null {
    if (!this.canRedo()) return null;
    const entry = this.redoStack.pop()!;
    this.undoStack.push({ before: currentShapes, after: entry.after });
    return new Map(entry.after);
  }
}
