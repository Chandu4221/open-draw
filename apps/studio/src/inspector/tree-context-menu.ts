export interface TreeContextMenuCallbacks {
  onReveal: (shapeId: string) => void;
  onCopy: (shapeId: string) => void;
}

export class TreeContextMenu {
  readonly element: HTMLElement;
  private activeShapeId: string | null = null;
  private callbacks: TreeContextMenuCallbacks;
  private onDocPointerDown: (e: PointerEvent) => void;

  constructor(callbacks: TreeContextMenuCallbacks) {
    this.callbacks = callbacks;

    this.element = document.createElement('div');
    this.element.id = 'od-tree-context-menu';
    this.element.style.cssText = `
      position: fixed; display: none; z-index: 100;
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 4px 0; font-family: sans-serif;
      font-size: 12px; min-width: 130px;
    `;

    const revealItem = document.createElement('div');
    revealItem.id = 'od-tree-menu-reveal';
    revealItem.innerHTML = '<span class="material-symbols-outlined" style="font-size: 15px; margin-right: 8px; color: #64748b;">center_focus_strong</span>Reveal on canvas';
    revealItem.style.cssText = 'padding: 6px 12px; cursor: pointer; color: #0f172a; display: flex; align-items: center;';
    revealItem.addEventListener('mouseenter', () => revealItem.style.background = '#f1f5f9');
    revealItem.addEventListener('mouseleave', () => revealItem.style.background = 'transparent');
    revealItem.addEventListener('click', () => {
      if (this.activeShapeId) this.callbacks.onReveal(this.activeShapeId);
      this.hide();
    });

    const copyItem = document.createElement('div');
    copyItem.id = 'od-tree-menu-copy';
    copyItem.innerHTML = '<span class="material-symbols-outlined" style="font-size: 15px; margin-right: 8px; color: #64748b;">content_copy</span>Copy ID';
    copyItem.style.cssText = 'padding: 6px 12px; cursor: pointer; color: #0f172a; display: flex; align-items: center;';
    copyItem.addEventListener('mouseenter', () => copyItem.style.background = '#f1f5f9');
    copyItem.addEventListener('mouseleave', () => copyItem.style.background = 'transparent');
    copyItem.addEventListener('click', () => {
      if (this.activeShapeId) this.callbacks.onCopy(this.activeShapeId);
      this.hide();
    });

    this.element.appendChild(revealItem);
    this.element.appendChild(copyItem);
    document.body.appendChild(this.element);

    this.onDocPointerDown = (e: PointerEvent) => {
      if (!this.element.contains(e.target as Node)) {
        this.hide();
      }
    };
    document.addEventListener('pointerdown', this.onDocPointerDown);
  }

  show(x: number, y: number, shapeId: string): void {
    this.activeShapeId = shapeId;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.style.display = 'block';
  }

  hide(): void {
    this.element.style.display = 'none';
    this.activeShapeId = null;
  }

  destroy(): void {
    document.removeEventListener('pointerdown', this.onDocPointerDown);
    this.element.remove();
  }
}
