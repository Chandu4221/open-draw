import type { Camera, ShapeId, ShapeRecord } from '@open-draw/schema';
import { cameraToTransform } from './camera.js';
import type { CanvasStore, StoreDiff } from './store.js';

interface ShapeDOMEntry {
  readonly wrapper: SVGGElement;
  readonly slot: SVGGElement;
  shape: ShapeRecord;
}

/**
 * Pure DOM/SVG Canvas Renderer.
 * Mounts a single root <svg> containing a root viewport <g> driven by Camera transforms.
 * Every shape is rendered as a <g class="od-shape" data-id="..."> with its overlay slot as last child.
 */
export class SVGRenderer {
  private container: HTMLElement | null = null;
  private svgElement: SVGSVGElement | null = null;
  private viewportGroup: SVGGElement | null = null;
  private shapesLayer: SVGGElement | null = null;

  private readonly shapeElements = new Map<ShapeId, ShapeDOMEntry>();

  mount(container: HTMLElement, initialCamera: Camera): void {
    this.container = container;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'od-canvas-root');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.display = 'block';
    svg.style.overflow = 'hidden';
    svg.style.userSelect = 'none';

    const viewport = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    viewport.setAttribute('class', 'od-viewport');
    viewport.setAttribute('transform', cameraToTransform(initialCamera));

    const shapes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    shapes.setAttribute('class', 'od-shapes-layer');

    viewport.appendChild(shapes);
    svg.appendChild(viewport);
    container.appendChild(svg);

    this.svgElement = svg;
    this.viewportGroup = viewport;
    this.shapesLayer = shapes;
  }

  destroy(): void {
    if (this.svgElement && this.container) {
      this.container.removeChild(this.svgElement);
    }
    this.shapeElements.clear();
    this.container = null;
    this.svgElement = null;
    this.viewportGroup = null;
    this.shapesLayer = null;
  }

  updateCamera(camera: Camera): void {
    if (this.viewportGroup) {
      this.viewportGroup.setAttribute('transform', cameraToTransform(camera));
    }
  }

  getOverlaySlot(id: ShapeId): SVGGElement | null {
    const entry = this.shapeElements.get(id);
    return entry ? entry.slot : null;
  }

  getShapeWrapper(id: ShapeId): SVGGElement | null {
    const entry = this.shapeElements.get(id);
    return entry ? entry.wrapper : null;
  }

  renderAll(shapes: Iterable<ShapeRecord>): void {
    // Clear existing
    if (this.shapesLayer) {
      this.shapesLayer.innerHTML = '';
    }
    this.shapeElements.clear();

    const shapeList = Array.from(shapes);

    // Pass 1: create entries
    for (const shape of shapeList) {
      this._createOrReuseEntry(shape);
    }

    // Pass 2: attach to parents or root layer
    for (const shape of shapeList) {
      const entry = this.shapeElements.get(shape.id);
      if (entry) {
        this._attachWrapper(entry.shape, entry.wrapper);
      }
    }
  }

  applyDiff(diff: StoreDiff, store: CanvasStore): void {
    // 1. Delete
    for (const id of diff.deleted) {
      const entry = this.shapeElements.get(id);
      if (entry) {
        entry.wrapper.remove();
        this.shapeElements.delete(id);
      }
    }

    // 2. Create
    for (const id of diff.created) {
      const shape = store.getShape(id);
      if (shape) {
        const entry = this._createOrReuseEntry(shape);
        this._attachWrapper(shape, entry.wrapper);
      }
    }

    // 3. Update
    for (const id of diff.updated) {
      const shape = store.getShape(id);
      const entry = this.shapeElements.get(id);
      if (shape && entry) {
        entry.shape = shape;
        this._patchShapeDOM(entry);
      }
    }
  }

  private _createOrReuseEntry(shape: ShapeRecord): ShapeDOMEntry {
    let entry = this.shapeElements.get(shape.id);
    if (entry) {
      entry.shape = shape;
      this._patchShapeDOM(entry);
      return entry;
    }

    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const isGroup = shape.type === 'group';
    wrapper.setAttribute('class', isGroup ? 'od-shape od-group' : 'od-shape');
    wrapper.setAttribute('data-id', shape.id);
    wrapper.setAttribute('transform', `translate(${shape.x}, ${shape.y})`);

    const slot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    slot.setAttribute('class', 'od-overlay-slot');
    slot.setAttribute('data-slot', 'overlay');
    slot.style.pointerEvents = 'none';

    entry = { wrapper, slot, shape };
    this.shapeElements.set(shape.id, entry);

    this._renderShapeContent(entry);

    // Contract: overlay slot is wrapper's last child
    wrapper.appendChild(slot);

    return entry;
  }

  private _renderShapeContent(entry: ShapeDOMEntry): void {
    const { wrapper, shape } = entry;

    if (shape.type === 'group') {
      const content = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      content.setAttribute('class', 'od-group-content');
      wrapper.appendChild(content);
    } else {
      // Default / rect content for Phase 2
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('class', 'od-shape-body');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      const width = typeof shape.props['width'] === 'number' ? shape.props['width'] : 100;
      const height = typeof shape.props['height'] === 'number' ? shape.props['height'] : 100;
      const fill = typeof shape.props['fill'] === 'string' ? shape.props['fill'] : '#3b82f6';
      rect.setAttribute('width', String(width));
      rect.setAttribute('height', String(height));
      rect.setAttribute('fill', fill);
      wrapper.appendChild(rect);
    }
  }

  private _patchShapeDOM(entry: ShapeDOMEntry): void {
    const { wrapper, slot, shape } = entry;
    wrapper.setAttribute('transform', `translate(${shape.x}, ${shape.y})`);

    if (shape.type !== 'group') {
      const rect = wrapper.querySelector('.od-shape-body');
      if (rect) {
        const width = typeof shape.props['width'] === 'number' ? shape.props['width'] : 100;
        const height = typeof shape.props['height'] === 'number' ? shape.props['height'] : 100;
        const fill = typeof shape.props['fill'] === 'string' ? shape.props['fill'] : '#3b82f6';
        rect.setAttribute('width', String(width));
        rect.setAttribute('height', String(height));
        rect.setAttribute('fill', fill);
      }
    }

    // Ensure slot remains the last child
    if (wrapper.lastElementChild !== slot) {
      wrapper.appendChild(slot);
    }
  }

  private _attachWrapper(shape: ShapeRecord, wrapper: SVGGElement): void {
    const parentId = typeof shape.meta['parentId'] === 'string' ? shape.meta['parentId'] : null;

    if (parentId) {
      const parentEntry = this.shapeElements.get(parentId);
      if (parentEntry) {
        const groupContent = parentEntry.wrapper.querySelector('.od-group-content');
        if (groupContent) {
          groupContent.appendChild(wrapper);
          return;
        }
        // Fallback: insert before parent's slot to keep slot last child
        parentEntry.wrapper.insertBefore(wrapper, parentEntry.slot);
        return;
      }
    }

    if (this.shapesLayer && wrapper.parentNode !== this.shapesLayer) {
      this.shapesLayer.appendChild(wrapper);
    }
  }
}
