// Minimal, framework-free keyboard event descriptor and binding tables (R-008, R-011).
// Contains zero DOM types.
import { ACTIONS, type ActionId } from "./actions";

export const KEY_CODES = {
  space: "Space",
  escape: "Escape",
  delete: "Delete",
  backspace: "Backspace",
} as const;

export type KeyCode = (typeof KEY_CODES)[keyof typeof KEY_CODES];

export interface KeyboardEventDescriptor {
  readonly code: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  readonly isEditableTarget?: boolean;
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
  { code: "KeyD", ctrlOrMeta: true, action: ACTIONS.duplicate },
  { code: "KeyC", ctrlOrMeta: true, action: ACTIONS.copy },
  { code: "KeyV", ctrlOrMeta: true, action: ACTIONS.paste },
  { code: "KeyV", action: ACTIONS.selectTool },
  { code: "Digit1", action: ACTIONS.selectTool },
  { code: "KeyR", action: ACTIONS.selectToolRect },
  { code: "KeyO", action: ACTIONS.selectToolEllipse },
  { code: "KeyL", action: ACTIONS.selectToolLine },
  { code: "KeyP", action: ACTIONS.selectToolPenPath },
  { code: "KeyD", action: ACTIONS.selectToolPenPath },
  { code: "KeyT", action: ACTIONS.selectToolText },
];
