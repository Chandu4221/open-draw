import type { CanvasEditor } from '../editor.js';
import { executeCommand } from './commands.js';
import { DEFAULT_KEYMAP, type KeyBinding } from './keymap.js';
import { isMod } from './utils.js';

export class KeyboardDispatcher {
  private editor: CanvasEditor;
  private keymap: readonly KeyBinding[];
  private target: HTMLElement | Window | null = null;

  constructor(editor: CanvasEditor, customKeymap?: readonly KeyBinding[]) {
    this.editor = editor;
    this.keymap = customKeymap ?? DEFAULT_KEYMAP;
  }

  attach(target: HTMLElement | Window = window): void {
    this.target = target;
    target.addEventListener('keydown', this.onKeyDown as EventListener);
  }

  detach(): void {
    if (this.target) {
      this.target.removeEventListener('keydown', this.onKeyDown as EventListener);
      this.target = null;
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // 1. Enter / Space selects focused shape
    if (e.key === 'Enter' || e.key === ' ') {
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const shapeWrapper = activeEl?.closest('.od-shape');
      const shapeId = shapeWrapper?.getAttribute('data-id');
      if (shapeId) {
        e.preventDefault();
        this.editor.selectShape(shapeId);
        return;
      }
    }

    // 2. Editing mode suspends all shortcuts except Escape
    if (this.editor.mode === 'editing') {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.editor.textEditing.commit();
      }
      return;
    }

    // 3. Match against keymap
    const eventMod = isMod(e);
    for (const binding of this.keymap) {
      if (this.matches(binding, e, eventMod)) {
        e.preventDefault();
        executeCommand(binding.command, this.editor);
        if (binding.command === 'cycle-forward' || binding.command === 'cycle-backward') {
          const sel = this.editor.selection;
          if (sel.length > 0) {
            const wrapper = this.editor.getShapeWrapper(sel[sel.length - 1]!);
            wrapper?.focus();
          }
        }
        return;
      }
    }
  };

  private matches(b: KeyBinding, e: KeyboardEvent, eventMod: boolean): boolean {
    const keyMatches = b.key.length === 1
      ? e.key.toLowerCase() === b.key.toLowerCase()
      : e.key === b.key;

    if (!keyMatches) return false;
    if (b.mod !== undefined && b.mod !== eventMod) return false;
    if (b.shift !== undefined && b.shift !== e.shiftKey) return false;
    if (b.alt !== undefined && b.alt !== e.altKey) return false;

    return true;
  }
}
