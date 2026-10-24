import type { CanvasEditor } from '@open-draw/canvas';
import type { ShapeRecord } from '@open-draw/schema';

export class MemberListController {
  private editor: CanvasEditor;
  readonly containerEl: HTMLElement;
  private listEl: HTMLElement;

  constructor(editor: CanvasEditor) {
    this.editor = editor;
    this.containerEl = document.createElement('div');
    this.containerEl.style.cssText = 'margin-bottom: 10px; display: none;';

    const label = document.createElement('div');
    label.textContent = 'Children / Members';
    label.style.cssText = 'font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;';
    
    this.listEl = document.createElement('div');
    this.listEl.id = 'inspector-member-list';
    this.listEl.style.cssText = 'display: flex; flex-direction: column; gap: 4px; max-height: 120px; overflow-y: auto;';

    this.containerEl.appendChild(label);
    this.containerEl.appendChild(this.listEl);
  }

  private lastShapeId: string | null = null;
  private lastChildrenKey: string | null = null;

  update(shape: ShapeRecord): void {
    const def = this.editor.registry.get(shape.type);
    const isContainer = Boolean(def?.capabilities?.clipping || def?.capabilities?.group);
    if (!isContainer) {
      this.clear();
      return;
    }
    const allShapes = this.editor.store.listShapes();
    const children = allShapes.filter((s) => s.meta?.parent === shape.id || s.meta?.parentId === shape.id);
    if (children.length === 0) {
      this.clear();
      return;
    }

    const childrenKey = children.map((c) => `${c.id}:${((c.meta?.semantic as Record<string, unknown>)?.name as string) || c.type}`).join(',');
    if (this.lastShapeId === shape.id && this.lastChildrenKey === childrenKey) {
      return;
    }

    this.lastShapeId = shape.id;
    this.lastChildrenKey = childrenKey;
    this.containerEl.style.display = 'block';
    this.listEl.innerHTML = '';
    for (const child of children) {
      const item = document.createElement('div');
      item.className = 'od-inspector-member-item';
      item.style.cssText = 'padding: 4px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 11px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;';
      const label = ((child.meta?.semantic as Record<string, unknown>)?.name as string) || child.type;
      item.textContent = `${label} (#${child.id})`;
      item.addEventListener('click', () => this.editor.selectShape(child.id));
      this.listEl.appendChild(item);
    }
  }

  clear(): void {
    this.lastShapeId = null;
    this.lastChildrenKey = null;
    this.containerEl.style.display = 'none';
    this.listEl.innerHTML = '';
  }
}
