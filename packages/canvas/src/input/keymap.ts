export type CommandId =
  | 'select-all'
  | 'clear-selection'
  | 'cycle-forward'
  | 'cycle-backward'
  | 'nudge-up'
  | 'nudge-down'
  | 'nudge-left'
  | 'nudge-right'
  | 'nudge-up-big'
  | 'nudge-down-big'
  | 'nudge-left-big'
  | 'nudge-right-big'
  | 'delete'
  | 'duplicate'
  | 'clipboard-copy'
  | 'clipboard-cut'
  | 'clipboard-paste'
  | 'undo'
  | 'redo'
  | 'zoom-reset'
  | 'zoom-fit'
  | 'zoom-selection'
  | 'tool-select'
  | 'tool-rect'
  | 'tool-ellipse'
  | 'tool-text'
  | 'tool-frame'
  | 'tool-note'
  | 'tool-arrow'
  | 'tool-ink'
  | 'tool-eraser'
  | 'tool-pan'
  | 'tool-image'
  | 'bring-to-front'
  | 'send-to-back'
  | 'bring-forward'
  | 'send-backward';

export interface KeyBinding {
  readonly key: string;
  readonly mod?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly command: CommandId;
}

export const DEFAULT_KEYMAP: readonly KeyBinding[] = [
  // Selection
  { key: 'Tab', shift: false, command: 'cycle-forward' },
  { key: 'Tab', shift: true, command: 'cycle-backward' },
  { key: 'Escape', command: 'clear-selection' },
  { key: 'a', mod: true, command: 'select-all' },
  { key: 'A', mod: true, command: 'select-all' },

  // Nudge
  { key: 'ArrowUp', shift: false, command: 'nudge-up' },
  { key: 'ArrowDown', shift: false, command: 'nudge-down' },
  { key: 'ArrowLeft', shift: false, command: 'nudge-left' },
  { key: 'ArrowRight', shift: false, command: 'nudge-right' },
  { key: 'ArrowUp', shift: true, command: 'nudge-up-big' },
  { key: 'ArrowDown', shift: true, command: 'nudge-down-big' },
  { key: 'ArrowLeft', shift: true, command: 'nudge-left-big' },
  { key: 'ArrowRight', shift: true, command: 'nudge-right-big' },

  // Edit / Delete / Duplicate
  { key: 'Delete', command: 'delete' },
  { key: 'Backspace', command: 'delete' },
  { key: 'd', mod: true, command: 'duplicate' },
  { key: 'D', mod: true, command: 'duplicate' },

  // Clipboard
  { key: 'c', mod: true, command: 'clipboard-copy' },
  { key: 'C', mod: true, command: 'clipboard-copy' },
  { key: 'x', mod: true, command: 'clipboard-cut' },
  { key: 'X', mod: true, command: 'clipboard-cut' },
  { key: 'v', mod: true, command: 'clipboard-paste' },
  { key: 'V', mod: true, command: 'clipboard-paste' },

  // Undo / Redo
  { key: 'z', mod: true, shift: false, command: 'undo' },
  { key: 'Z', mod: true, shift: false, command: 'undo' },
  { key: 'z', mod: true, shift: true, command: 'redo' },
  { key: 'Z', mod: true, shift: true, command: 'redo' },
  { key: 'y', mod: true, command: 'redo' },
  { key: 'Y', mod: true, command: 'redo' },

  // Zoom
  { key: '0', mod: true, command: 'zoom-reset' },
  { key: '1', shift: true, command: 'zoom-fit' },
  { key: '!', shift: true, command: 'zoom-fit' },
  { key: '2', shift: true, command: 'zoom-selection' },
  { key: '@', shift: true, command: 'zoom-selection' },

  // Tools
  { key: 'v', mod: false, shift: false, alt: false, command: 'tool-select' },
  { key: 'V', mod: false, shift: false, alt: false, command: 'tool-select' },
  { key: 'r', mod: false, shift: false, alt: false, command: 'tool-rect' },
  { key: 'R', mod: false, shift: false, alt: false, command: 'tool-rect' },
  { key: 'o', mod: false, shift: false, alt: false, command: 'tool-ellipse' },
  { key: 'O', mod: false, shift: false, alt: false, command: 'tool-ellipse' },
  { key: 't', mod: false, shift: false, alt: false, command: 'tool-text' },
  { key: 'T', mod: false, shift: false, alt: false, command: 'tool-text' },
  { key: 'f', mod: false, shift: false, alt: false, command: 'tool-frame' },
  { key: 'F', mod: false, shift: false, alt: false, command: 'tool-frame' },
  { key: 'n', mod: false, shift: false, alt: false, command: 'tool-note' },
  { key: 'N', mod: false, shift: false, alt: false, command: 'tool-note' },
  { key: 'a', mod: false, shift: false, alt: false, command: 'tool-arrow' },
  { key: 'A', mod: false, shift: false, alt: false, command: 'tool-arrow' },
  { key: 'd', mod: false, shift: false, alt: false, command: 'tool-ink' },
  { key: 'D', mod: false, shift: false, alt: false, command: 'tool-ink' },
  { key: 'p', mod: false, shift: false, alt: false, command: 'tool-ink' },
  { key: 'P', mod: false, shift: false, alt: false, command: 'tool-ink' },
  { key: 'e', mod: false, shift: false, alt: false, command: 'tool-eraser' },
  { key: 'E', mod: false, shift: false, alt: false, command: 'tool-eraser' },
  { key: 'h', mod: false, shift: false, alt: false, command: 'tool-pan' },
  { key: 'H', mod: false, shift: false, alt: false, command: 'tool-pan' },
  { key: 'i', mod: false, shift: false, alt: false, command: 'tool-image' },
  { key: 'I', mod: false, shift: false, alt: false, command: 'tool-image' },

  // Z-Order
  { key: ']', mod: true, shift: true, command: 'bring-to-front' },
  { key: '}', mod: true, shift: true, command: 'bring-to-front' },
  { key: '[', mod: true, shift: true, command: 'send-to-back' },
  { key: '{', mod: true, shift: true, command: 'send-to-back' },
  { key: ']', alt: true, command: 'bring-forward' },
  { key: '[', alt: true, command: 'send-backward' },
];
