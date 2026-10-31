// Minimal, framework-free keyboard event descriptor and binding tables (R-008, R-011).
// Contains zero DOM types.
import { ACTIONS, type ActionId } from "./actions";

export interface KeyboardEventDescriptor {
  readonly code: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
}

export interface KeyBinding {
  readonly code: string;
  readonly ctrlOrMeta?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  readonly action: ActionId;
}

export type KeyBindings = readonly KeyBinding[];

export const DEFAULT_KEY_BINDINGS: KeyBindings = [
  { code: "Escape", action: ACTIONS.cancel },
  { code: "KeyZ", ctrlOrMeta: true, action: ACTIONS.undo },
  { code: "KeyZ", ctrlOrMeta: true, shiftKey: true, action: ACTIONS.redo },
  { code: "KeyY", ctrlOrMeta: true, action: ACTIONS.redo },
  { code: "Delete", action: ACTIONS.deleteSelected },
  { code: "Backspace", action: ACTIONS.deleteSelected },
  { code: "KeyV", action: ACTIONS.selectTool },
  { code: "KeyT", action: ACTIONS.selectTool },
];
