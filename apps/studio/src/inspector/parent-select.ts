import type { CanvasEditor } from '@open-draw/canvas';
import type { ShapeRecord } from '@open-draw/schema';
import { assignParentWithGrowth } from './grow-on-assign.js';

/**
 * Traverses the scene graph to find all descendant IDs of a given shape.
 */
export function getDescendantIds(shapeId: string, shapes: readonly ShapeRecord[]): Set<string> {
  const descendants = new Set<string>();
  const queue = [shapeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const s of shapes) {
      const parentId = (s.meta?.parent ?? s.meta?.parentId) as string | undefined;
      if (parentId === current && !descendants.has(s.id)) {
        descendants.add(s.id);
        queue.push(s.id);
      }
    }
  }

  return descendants;
}

/**
 * Returns all valid parent candidate shapes (frames) excluding the shape itself
 * and any of its descendants. Cycle-safe by construction (ADR-002).
 */
export function getValidParentCandidates(shapeId: string, shapes: readonly ShapeRecord[]): ShapeRecord[] {
  const invalid = getDescendantIds(shapeId, shapes);
  invalid.add(shapeId);

  return shapes.filter((s) => s.type === 'frame' && !invalid.has(s.id)); // EXEMPTION: Frame container candidate filtering for UI dropdown
}

export class ParentSelectController {
  private editor: CanvasEditor;
  private selectEl: HTMLSelectElement;
  private activeShapeId: string | null = null;
  private highlightedFrameId: string | null = null;

  constructor(editor: CanvasEditor) {
    this.editor = editor;
    this.selectEl = document.createElement('select');
    this.selectEl.id = 'inspector-parent-select';
    this.selectEl.setAttribute('aria-label', 'Parent Frame');
    this.selectEl.style.cssText = `
      width: 100%; box-sizing: border-box; padding: 6px 8px;
      border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px;
      outline: none; background: #ffffff; cursor: pointer;
    `;

    this.selectEl.addEventListener('change', () => this.onSelectChange());
    this.selectEl.addEventListener('mouseenter', () => this.onHoverOption());
    this.selectEl.addEventListener('mouseleave', () => this.clearHighlight());
  }

  private lastShapeId: string | null = null;
  private lastCandidatesKey: string | null = null;
  private lastParentId: string | null = null;

  get element(): HTMLSelectElement {
    return this.selectEl;
  }

  update(shapeId: string): void {
    this.activeShapeId = shapeId;
    this.clearHighlight();

    const shapes = this.editor.store.listShapes();
    const currentShape = shapes.find((s) => s.id === shapeId);
    if (!currentShape) {
      this.selectEl.innerHTML = '';
      this.lastShapeId = null;
      return;
    }

    const currentParentId = ((currentShape.meta?.parent ?? currentShape.meta?.parentId) as string | undefined) || '';
    const validCandidates = getValidParentCandidates(shapeId, shapes);
    const candidatesKey = validCandidates.map((f) => f.id).join(',');

    if (
      this.lastShapeId === shapeId &&
      this.lastCandidatesKey === candidatesKey &&
      this.lastParentId === currentParentId
    ) {
      return;
    }

    this.lastShapeId = shapeId;
    this.lastCandidatesKey = candidatesKey;
    this.lastParentId = currentParentId;
    this.selectEl.innerHTML = '';

    // Option: None
    const noneOpt = document.createElement('option');
    noneOpt.value = '';
    noneOpt.textContent = '(None - root canvas)';
    this.selectEl.appendChild(noneOpt);

    for (const frame of validCandidates) {
      const opt = document.createElement('option');
      opt.value = frame.id;
      const label = ((frame.meta?.semantic as Record<string, unknown>)?.name as string) ||
        (typeof frame.props['label'] === 'string' ? frame.props['label'] : '') ||
        frame.id;
      opt.textContent = `Frame: ${label} (#${frame.id})`;
      this.selectEl.appendChild(opt);
    }

    this.selectEl.value = currentParentId;
  }

  private onSelectChange(): void {
    if (!this.activeShapeId) return;
    const nextParentId = this.selectEl.value.trim() || null;
    const shape = this.editor.store.getShape(this.activeShapeId);
    if (!shape) return;

    const currentParentId = (shape.meta?.parent ?? shape.meta?.parentId) as string | null | undefined;
    if (nextParentId === (currentParentId || null)) return;

    // Cycle check defense
    if (nextParentId !== null) {
      const descendants = getDescendantIds(this.activeShapeId, this.editor.getSnapshot().shapes);
      if (descendants.has(nextParentId) || nextParentId === this.activeShapeId) {
        throw new Error(`Cycle detected: cannot parent shape #${this.activeShapeId} into its own descendant #${nextParentId}`);
      }
    }

    assignParentWithGrowth(this.editor, this.activeShapeId, nextParentId);
  }

  private onHoverOption(): void {
    const val = this.selectEl.value;
    if (val) this.setHighlight(val);
  }

  private setHighlight(frameId: string): void {
    this.clearHighlight();
    this.highlightedFrameId = frameId;
    const el = document.querySelector(`.od-shape[data-id="${frameId}"]`);
    el?.classList.add('od-parent-hover-highlight');
  }

  private clearHighlight(): void {
    if (this.highlightedFrameId) {
      const el = document.querySelector(`.od-shape[data-id="${this.highlightedFrameId}"]`);
      el?.classList.remove('od-parent-hover-highlight');
      this.highlightedFrameId = null;
    }
  }

  destroy(): void {
    this.clearHighlight();
    this.selectEl.remove();
  }
}
