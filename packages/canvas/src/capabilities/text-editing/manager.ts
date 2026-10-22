import type { ShapeId, ShapeRecord } from '@open-draw/schema';
import type { CanvasEditor } from '../../editor.js';
import { computeShapeAria } from '../../a11y.js';

export class TextEditingManager {
  private activeShapeId: ShapeId | null = null;
  private foreignObject: SVGForeignObjectElement | null = null;
  private textarea: HTMLTextAreaElement | null = null;
  private initialText: string = '';
  private currentEditor: CanvasEditor | null = null;
  private isCommitting = false;

  isEditing(): boolean {
    return this.activeShapeId !== null;
  }

  getActiveShapeId(): ShapeId | null {
    return this.activeShapeId;
  }

  startEditing(shapeId: ShapeId, editor: CanvasEditor): boolean {
    if (this.activeShapeId) {
      this.commit();
    }

    const shape = editor.store.getShape(shapeId);
    if (!shape) return false;

    const def = editor.registry.get(shape.type);
    if (!def?.capabilities?.text?.canEditText(shape)) {
      return false;
    }

    const slot = editor.getOverlaySlot(shapeId);
    if (!slot) return false;

    this.activeShapeId = shapeId;
    this.currentEditor = editor;
    editor.mode = 'editing';

    const wrapper = editor.renderer.getShapeWrapper(shapeId);
    if (wrapper) {
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('tabindex', '-1');
    }

    const textCap = def.capabilities.text;
    this.initialText = textCap.getText(shape);

    const bounds = def.geometry.bounds(shape);
    const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    fo.setAttribute('class', 'od-text-editing-fo');
    fo.setAttribute('x', '0');
    fo.setAttribute('y', '0');
    fo.setAttribute('width', String(Math.max(bounds.width, 100)));
    fo.setAttribute('height', String(Math.max(bounds.height, 60)));
    fo.style.pointerEvents = 'auto';

    const textarea = document.createElement('textarea');
    textarea.className = 'od-text-editor';
    textarea.setAttribute('aria-label', 'Edit shape text');
    textarea.value = this.initialText;
    textarea.style.width = '100%';
    textarea.style.height = '100%';
    textarea.style.pointerEvents = 'auto';
    textarea.style.background = 'rgba(255, 255, 255, 0.9)';
    textarea.style.border = '1px solid #3b82f6';
    textarea.style.borderRadius = '3px';
    textarea.style.padding = '4px 8px';
    textarea.style.boxSizing = 'border-box';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.font = 'inherit';
    textarea.style.color = 'inherit';

    textarea.addEventListener('keydown', this.onKeyDown);
    textarea.addEventListener('blur', this.onBlur);

    fo.appendChild(textarea);
    slot.appendChild(fo);

    this.foreignObject = fo;
    this.textarea = textarea;

    setTimeout(() => {
      textarea.focus();
      textarea.select();
    }, 0);

    return true;
  }

  commit(): void {
    if (this.isCommitting || !this.activeShapeId || !this.currentEditor) return;
    this.isCommitting = true;

    const shapeId = this.activeShapeId;
    const editor = this.currentEditor;
    const newText = this.textarea?.value ?? '';
    const initialText = this.initialText;

    this.cleanupDOM();

    const shape = editor.store.getShape(shapeId);
    if (!shape) {
      this.resetState(editor);
      return;
    }

    const def = editor.registry.get(shape.type);
    const textCap = def?.capabilities?.text;

    if (newText.trim() === '') {
      // Empty text on commit -> shape deleted in one transaction
      editor.store.transact(() => {
        editor.deleteShape(shapeId);
      });
    } else if (newText !== initialText && textCap) {
      // Apply updated text and auto-grown bounds in single transaction
      const patch = textCap.setText(shape, newText);
      editor.store.transact(() => {
        editor.store.updateShape(shapeId, patch);
      });
    }

    this.resetState(editor, shapeId);
  }

  cancel(): void {
    if (!this.activeShapeId || !this.currentEditor) return;
    const shapeId = this.activeShapeId;
    const editor = this.currentEditor;
    this.cleanupDOM();
    this.resetState(editor, shapeId);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.cancel();
    }
  };

  private onBlur = (): void => {
    this.commit();
  };

  private cleanupDOM(): void {
    if (this.textarea) {
      this.textarea.removeEventListener('keydown', this.onKeyDown);
      this.textarea.removeEventListener('blur', this.onBlur);
    }
    if (this.foreignObject && this.foreignObject.parentNode) {
      this.foreignObject.parentNode.removeChild(this.foreignObject);
    }
    this.foreignObject = null;
    this.textarea = null;
  }

  private resetState(editor: CanvasEditor, shapeId?: ShapeId | null): void {
    if (shapeId) {
      const wrapper = editor.renderer.getShapeWrapper(shapeId);
      const shape = editor.store.getShape(shapeId);
      if (wrapper && shape) {
        const def = editor.registry.get(shape.type);
        const { role } = computeShapeAria(shape, def);
        wrapper.setAttribute('role', role);
        wrapper.setAttribute('tabindex', '0');
      }
    }
    this.activeShapeId = null;
    this.currentEditor = null;
    this.initialText = '';
    this.isCommitting = false;
    editor.mode = 'none';
  }
}
