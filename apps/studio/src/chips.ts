import type { CanvasEditor } from '@open-draw/canvas';
import type { ShapeRecord } from '@open-draw/schema';

export type ChipMode = 'always' | 'hover' | 'off';

export class ChipController {
  private editor: CanvasEditor;
  private mode: ChipMode = 'hover';
  private hoveredShapeId: string | null = null;
  private unsubscribeStore?: () => void;
  private unsubscribeSelection?: () => void;
  private containerListeners: Array<{ type: string; listener: EventListener }> = [];

  constructor(editor: CanvasEditor) {
    this.editor = editor;
    this.init();
  }

  private init(): void {
    this.unsubscribeStore = this.editor.store.listen((diff) => {
      if (this.mode === 'off' || this.editor.gesture?.isActive) return;
      if (diff) {
        for (const id of diff.created) this.renderShapeChip(id);
        for (const id of diff.updated) this.renderShapeChip(id);
      } else {
        this.updateAll();
      }
    });
    this.unsubscribeSelection = this.editor.selectionManager.subscribe(() => {
      if (this.mode !== 'off') this.updateAll();
    });

    const container = this.editor.getContainer();
    if (container) {
      const onPointerOver = (e: Event): void => {
        if (this.mode !== 'hover' || this.editor.gesture?.isActive) return;
        const target = (e.target as Element | null)?.closest('.od-shape');
        const id = target?.getAttribute('data-id') || null;
        if (id !== this.hoveredShapeId) {
          const prev = this.hoveredShapeId;
          this.hoveredShapeId = id;
          if (prev) this.renderShapeChip(prev);
          if (id) this.renderShapeChip(id);
        }
      };

      const onPointerOut = (e: Event): void => {
        if (this.mode !== 'hover' || this.editor.gesture?.isActive) return;
        const pe = e as PointerEvent;
        const related = (pe.relatedTarget as Element | null)?.closest('.od-shape');
        const nextId = related?.getAttribute('data-id') || null;
        if (nextId !== this.hoveredShapeId) {
          const prev = this.hoveredShapeId;
          this.hoveredShapeId = nextId;
          if (prev) this.renderShapeChip(prev);
          if (nextId) this.renderShapeChip(nextId);
        }
      };

      container.addEventListener('pointerover', onPointerOver);
      container.addEventListener('pointerout', onPointerOut);
      this.containerListeners.push(
        { type: 'pointerover', listener: onPointerOver },
        { type: 'pointerout', listener: onPointerOut }
      );
    }

    this.updateAll();
  }

  getMode(): ChipMode {
    return this.mode;
  }

  setMode(mode: ChipMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'off') {
      const container = this.editor.getContainer();
      const chips = container?.querySelectorAll('.od-semantic-chip');
      if (chips) {
        for (const chip of Array.from(chips)) chip.remove();
      }
      return;
    }
    this.updateAll();
  }

  updateAll(): void {
    if (this.mode === 'off') return;
    for (const shape of this.editor.store.listShapes()) {
      this.renderChip(shape);
    }
  }

  private renderShapeChip(shapeId: string): void {
    const shape = this.editor.store.getShape(shapeId);
    if (shape) this.renderChip(shape);
  }

  private isParentOfAnySelected(shapeId: string): boolean {
    const sel = this.editor.selection;
    if (sel.length === 0) return false;
    for (const id of sel) {
      const s = this.editor.store.getShape(id);
      if (s) {
        const parentId = (s.meta.parent ?? s.meta.parentId) as string | undefined;
        if (parentId === shapeId) return true;
      }
    }
    return false;
  }

  private renderChip(shape: ShapeRecord): void {
    if (this.mode === 'off') return;
    const slot = this.editor.getOverlaySlot(shape.id);
    if (!slot) return;

    const existing = slot.querySelector('.od-semantic-chip');
    if (existing) existing.remove();

    const isSelected = this.editor.isSelected(shape.id);
    const isParent = this.isParentOfAnySelected(shape.id);
    const isHovered = this.hoveredShapeId === shape.id;

    // Ruling: In hover mode, selection always reveals chips of selected + its parent
    const shouldShow =
      this.mode === 'always' ||
      isSelected ||
      isParent ||
      (this.mode === 'hover' && isHovered);

    if (!shouldShow) return;

    const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
    const type = (semantic.type as string) || shape.type;
    const name = (semantic.name as string) || (shape.meta?.['name'] as string) || '';
    const label = name || type;
    const truncatedLabel = label.length > 12 ? `${label.slice(0, 11)}…` : label;
    const fullName = `#${shape.id} ${label}`;
    const displayedText = `#${shape.id} ${truncatedLabel}`;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'od-semantic-chip od-chip-visible');
    g.setAttribute('data-shape-id', shape.id);
    g.setAttribute('data-semantic-type', type);
    g.setAttribute('aria-hidden', 'true');
    g.setAttribute('style', 'pointer-events: none; opacity: 1;');

    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleEl.textContent = fullName;
    g.appendChild(titleEl);

    const textWidth = Math.max(50, displayedText.length * 7 + 8);
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '-20');
    rect.setAttribute('width', String(textWidth));
    rect.setAttribute('height', '18');
    rect.setAttribute('rx', '3');
    rect.setAttribute('ry', '3');
    rect.setAttribute('fill', '#0f172a');
    rect.setAttribute('pointer-events', 'none');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '4');
    text.setAttribute('y', '-7');
    text.setAttribute('fill', '#f8fafc');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-family', 'monospace');
    text.setAttribute('pointer-events', 'none');
    text.textContent = displayedText;

    g.appendChild(rect);
    g.appendChild(text);
    slot.appendChild(g);
  }

  destroy(): void {
    this.unsubscribeStore?.();
    this.unsubscribeSelection?.();
    const container = this.editor.getContainer();
    if (container) {
      for (const { type, listener } of this.containerListeners) {
        container.removeEventListener(type, listener);
      }
    }
    this.containerListeners = [];
    for (const shape of this.editor.store.listShapes()) {
      const slot = this.editor.getOverlaySlot(shape.id);
      slot?.querySelector('.od-semantic-chip')?.remove();
    }
  }
}
