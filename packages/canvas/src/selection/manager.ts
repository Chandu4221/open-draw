import type { Camera, ShapeId, ShapeRecord } from '@open-draw/schema';
import type { ShapeRegistry } from '../registry.js';
import type { SVGRenderer } from '../renderer.js';
import type { CanvasStore } from '../store/index.js';
import type { SelectionListener } from './defs.js';
import { renderHandles, removeHandles } from './handlesView.js';

export class SelectionManager {
  private selectedIds: ShapeId[] = [];
  private listeners: Set<SelectionListener> = new Set();
  private prevRenderedIds: Set<ShapeId> = new Set();

  get selection(): readonly ShapeId[] {
    return this.selectedIds;
  }

  setSelection(ids: readonly ShapeId[]): void {
    const next = Array.from(new Set(ids));
    if (this._arraysEqual(this.selectedIds, next)) return;
    this.selectedIds = next;
    this._notify();
  }

  select(id: ShapeId): void {
    this.setSelection([id]);
  }

  toggle(id: ShapeId): void {
    if (this.selectedIds.includes(id)) {
      this.setSelection(this.selectedIds.filter((item) => item !== id));
    } else {
      this.setSelection([...this.selectedIds, id]);
    }
  }

  add(ids: readonly ShapeId[]): void {
    this.setSelection([...this.selectedIds, ...ids]);
  }

  remove(ids: readonly ShapeId[]): void {
    const toRemove = new Set(ids);
    this.setSelection(this.selectedIds.filter((id) => !toRemove.has(id)));
  }

  clear(): void {
    this.setSelection([]);
  }

  selectAll(shapes: readonly ShapeRecord[]): void {
    const visibleIds = shapes.filter((s) => !s.hidden).map((s) => s.id);
    this.setSelection(visibleIds);
  }

  cycleZOrder(shapes: readonly ShapeRecord[], direction: 'forward' | 'backward' = 'forward'): void {
    const visible = shapes.filter((s) => !s.hidden);
    if (visible.length === 0) return;

    if (this.selectedIds.length === 0) {
      const target = direction === 'forward' ? visible[0]! : visible[visible.length - 1]!;
      this.select(target.id);
      return;
    }

    const currentId = this.selectedIds[this.selectedIds.length - 1]!;
    const currentIndex = visible.findIndex((s) => s.id === currentId);

    let nextIndex: number;
    if (currentIndex === -1) {
      nextIndex = 0;
    } else if (direction === 'forward') {
      nextIndex = (currentIndex + 1) % visible.length;
    } else {
      nextIndex = (currentIndex - 1 + visible.length) % visible.length;
    }

    this.select(visible[nextIndex]!.id);
  }

  isSelected(id: ShapeId): boolean {
    return this.selectedIds.includes(id);
  }

  subscribe(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  updateVisuals(
    renderer: SVGRenderer,
    store: CanvasStore,
    registry: ShapeRegistry,
    camera?: Camera
  ): void {
    const idsToRender = new Set<ShapeId>();

    for (const id of this.selectedIds) {
      idsToRender.add(id);
      const shape = store.getShape(id);
      if (shape) {
        const def = registry.get(shape.type);
        if (def?.capabilities?.group?.isGroup) {
          const members = def.capabilities.group.getMembers ? def.capabilities.group.getMembers(shape) : [];
          for (const m of members) idsToRender.add(m);
        }
      }
    }

    for (const prevId of this.prevRenderedIds) {
      if (!idsToRender.has(prevId)) {
        this._removeOutline(renderer, prevId);
      }
    }

    const singleSelectedId = this.selectedIds.length === 1 ? this.selectedIds[0] : null;

    for (const id of idsToRender) {
      if (id === singleSelectedId) {
        this._renderSingleSelection(renderer, store, registry, id, camera);
      } else {
        this._renderOutline(renderer, store, registry, id);
      }
    }

    this.prevRenderedIds = idsToRender;
  }

  private _renderSingleSelection(
    renderer: SVGRenderer,
    store: CanvasStore,
    registry: ShapeRegistry,
    id: ShapeId,
    camera?: Camera
  ): void {
    const slot = renderer.getOverlaySlot(id);
    const shape = renderer.getShapeRecord(id) ?? store.getShape(id);
    if (!slot || !shape) return;

    renderer.getShapeWrapper(id)?.classList.add('od-selected');

    const legacy = slot.querySelector(':scope > .od-selection-outline');
    legacy?.remove();

    const bounds = this._computeBounds(shape, store, registry, renderer);
    if (!bounds) return;

    const lx = bounds.x - shape.x;
    const ly = bounds.y - shape.y;
    renderHandles(slot, { x: lx, y: ly, width: bounds.width, height: bounds.height }, camera);
  }

  private _computeBounds(shape: ShapeRecord, store: CanvasStore, registry: ShapeRegistry, renderer?: SVGRenderer) {
    const def = registry.get(shape.type);
    if (!def) return null;

    let bounds = def.geometry.bounds(shape);
    if (def.capabilities?.group?.isGroup) {
      const members = def.capabilities.group.getMembers ? def.capabilities.group.getMembers(shape) : [];
      const memberShapes = members
        .map((mid) => (renderer ? renderer.getShapeRecord(mid) : null) ?? store.getShape(mid))
        .filter(Boolean) as ShapeRecord[];
      if (memberShapes.length > 0) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const m of memberShapes) {
          const mDef = registry.get(m.type);
          if (!mDef) continue;
          const mb = mDef.geometry.bounds(m);
          minX = Math.min(minX, mb.x);
          minY = Math.min(minY, mb.y);
          maxX = Math.max(maxX, mb.x + mb.width);
          maxY = Math.max(maxY, mb.y + mb.height);
        }
        if (minX !== Infinity) {
          bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
      }
    }
    return bounds;
  }

  private _renderOutline(
    renderer: SVGRenderer,
    store: CanvasStore,
    registry: ShapeRegistry,
    id: ShapeId
  ): void {
    const slot = renderer.getOverlaySlot(id);
    const shape = renderer.getShapeRecord(id) ?? store.getShape(id);
    if (!slot || !shape) return;

    removeHandles(slot);
    const bounds = this._computeBounds(shape, store, registry, renderer);
    if (!bounds) return;

    renderer.getShapeWrapper(id)?.classList.add('od-selected');

    const lx = bounds.x - shape.x;
    const ly = bounds.y - shape.y;

    let outline = slot.querySelector(':scope > .od-selection-outline') as SVGRectElement | null;
    if (!outline) {
      outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      outline.setAttribute('class', 'od-selection-outline');
      outline.setAttribute('fill', 'none');
      outline.setAttribute('stroke', '#3b82f6');
      outline.setAttribute('stroke-width', '1.5');
      outline.setAttribute('pointer-events', 'none');
      slot.appendChild(outline);
    }

    outline.setAttribute('x', String(lx - 2));
    outline.setAttribute('y', String(ly - 2));
    outline.setAttribute('width', String(Math.max(1, bounds.width + 4)));
    outline.setAttribute('height', String(Math.max(1, bounds.height + 4)));
  }

  private _removeOutline(renderer: SVGRenderer, id: ShapeId): void {
    renderer.getShapeWrapper(id)?.classList.remove('od-selected');
    const slot = renderer.getOverlaySlot(id);
    if (!slot) return;
    const outline = slot.querySelector(':scope > .od-selection-outline');
    outline?.remove();
    removeHandles(slot);
  }

  private _notify(): void {
    for (const listener of this.listeners) {
      listener(this.selectedIds);
    }
  }

  private _arraysEqual(a: readonly ShapeId[], b: readonly ShapeId[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
