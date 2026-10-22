import type { Camera, ShapeId, ShapeRecord } from '@open-draw/schema';
import { cameraToTransform } from './camera.js';
import type { ShapeRegistry } from './registry.js';
import type { CanvasStore, StoreDiff } from './store/index.js';

interface ShapeDOMEntry {
  readonly wrapper: SVGGElement;
  readonly slot: SVGGElement;
  shape: ShapeRecord;
}

/**
 * Pure DOM/SVG Canvas Renderer.
 * Completely polymorphic — delegates shape inner rendering to registered ShapeDefinition plugins.
 * Maintains the overlay slot structural contract: wrapper's last child with identity transform.
 */
export class SVGRenderer {
  readonly registry: ShapeRegistry;

  private container: HTMLElement | null = null;
  private svgElement: SVGSVGElement | null = null;
  private viewportGroup: SVGGElement | null = null;
  private shapesLayer: SVGGElement | null = null;

  private readonly shapeElements = new Map<ShapeId, ShapeDOMEntry>();
  private store: CanvasStore | null = null;

  constructor(registry: ShapeRegistry) {
    this.registry = registry;
  }

  mount(container: HTMLElement, initialCamera: Camera): void {
    this.container = container;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'od-canvas-root');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.style.cssText = 'width:100%;height:100%;display:block;overflow:hidden;user-select:none;';

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
    if (this.svgElement && this.container) this.container.removeChild(this.svgElement);
    this.shapeElements.clear();
    this.container = this.svgElement = this.viewportGroup = this.shapesLayer = null;
  }

  updateCamera(camera: Camera): void {
    if (this.viewportGroup) {
      this.viewportGroup.setAttribute('transform', cameraToTransform(camera));
    }
  }

  getOverlaySlot(id: ShapeId): SVGGElement | null { return this.shapeElements.get(id)?.slot ?? null; }
  getShapeWrapper(id: ShapeId): SVGGElement | null { return this.shapeElements.get(id)?.wrapper ?? null; }
  getShapeRecord(id: ShapeId): ShapeRecord | undefined { return this.shapeElements.get(id)?.shape; }

  reorderDOM(shapes: Iterable<ShapeRecord>): void {
    if (!this.shapesLayer) return;
    for (const shape of shapes) {
      const entry = this.shapeElements.get(shape.id);
      if (entry && entry.wrapper.parentNode === this.shapesLayer) {
        this.shapesLayer.appendChild(entry.wrapper);
      }
    }
  }

  renderAll(shapes: Iterable<ShapeRecord>): void {
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
    this.store = store;

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
        const prevShape = entry.shape;
        entry.shape = shape;
        this._patchShapeDOM(entry, prevShape);
        if (
          prevShape.meta['parent'] !== shape.meta['parent'] ||
          prevShape.meta['parentId'] !== shape.meta['parentId']
        ) {
          this._attachWrapper(shape, entry.wrapper);
        }
      }
    }

    // 4. Connector reconciliation for bound arrows
    for (const updatedId of diff.updated) {
      for (const s of store.listShapes()) {
        const def = this.registry.get(s.type);
        if (def?.capabilities?.connector) {
          const props = s.props as { startBinding?: { shapeId: string }; endBinding?: { shapeId: string } };
          if (props.startBinding?.shapeId === updatedId || props.endBinding?.shapeId === updatedId) {
            const entry = this.shapeElements.get(s.id);
            if (entry) this._patchShapeDOM(entry, entry.shape);
          }
        }
      }
    }
  }

  private _createOrReuseEntry(shape: ShapeRecord): ShapeDOMEntry {
    let entry = this.shapeElements.get(shape.id);
    if (entry) {
      const prevShape = entry.shape;
      entry.shape = shape;
      this._patchShapeDOM(entry, prevShape);
      return entry;
    }

    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapper.setAttribute('class', 'od-shape');
    wrapper.setAttribute('data-id', shape.id);
    wrapper.setAttribute('tabindex', '0');
    wrapper.setAttribute('role', 'button');
    const label = shape.meta['name'] ? `${shape.type} ${shape.meta['name']}` : shape.type;
    wrapper.setAttribute('aria-label', String(label));
    wrapper.setAttribute('transform', `translate(${shape.x}, ${shape.y})`);

    const slot = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    slot.setAttribute('class', 'od-overlay-slot');
    slot.setAttribute('data-slot', 'overlay');
    slot.style.pointerEvents = 'none';

    entry = { wrapper, slot, shape };
    this.shapeElements.set(shape.id, entry);
    this._renderShapeContent(entry);
    wrapper.appendChild(slot);
    return entry;
  }

  private _renderShapeContent(entry: ShapeDOMEntry): void {
    const { wrapper, slot, shape } = entry;
    const def = this.registry.get(shape.type);

    if (def) {
      const rendered = def.render(shape, {
        overlaySlot: slot,
        store: this.store ?? undefined,
        registry: this.registry,
      });
      if (Array.isArray(rendered)) {
        for (const el of rendered) {
          wrapper.appendChild(el);
        }
      } else {
        wrapper.appendChild(rendered);
      }
    }
  }

  private _patchShapeDOM(entry: ShapeDOMEntry, prevShape: ShapeRecord): void {
    const { wrapper, slot, shape } = entry;
    const parentId =
      typeof shape.meta['parent'] === 'string'
        ? shape.meta['parent']
        : typeof shape.meta['parentId'] === 'string'
          ? shape.meta['parentId']
          : null;

    let localX = shape.x;
    let localY = shape.y;

    if (parentId) {
      const parentEntry = this.shapeElements.get(parentId);
      if (parentEntry) {
        const parentDef = this.registry.get(parentEntry.shape.type);
        if (parentDef?.capabilities?.clipping) {
          localX = shape.x - parentEntry.shape.x;
          localY = shape.y - parentEntry.shape.y;
        }
      }
    }

    wrapper.setAttribute('transform', `translate(${localX}, ${localY})`);
    const label = shape.meta['name'] ? `${shape.type} ${shape.meta['name']}` : shape.type;
    wrapper.setAttribute('aria-label', String(label));
    const def = this.registry.get(shape.type);
    if (def?.update) {
      def.update(wrapper, shape, prevShape, {
        overlaySlot: slot,
        store: this.store ?? undefined,
        registry: this.registry,
      });
    }

    // Ensure slot remains the last child
    if (wrapper.lastElementChild !== slot) {
      wrapper.appendChild(slot);
    }
  }

  private _attachWrapper(shape: ShapeRecord, wrapper: SVGGElement): void {
    const parentId =
      typeof shape.meta['parent'] === 'string'
        ? shape.meta['parent']
        : typeof shape.meta['parentId'] === 'string'
          ? shape.meta['parentId']
          : null;

    if (parentId) {
      const parentEntry = this.shapeElements.get(parentId);
      if (parentEntry) {
        const parentDef = this.registry.get(parentEntry.shape.type);
        if (parentDef?.capabilities?.clipping) {
          wrapper.setAttribute(
            'transform',
            `translate(${shape.x - parentEntry.shape.x}, ${shape.y - parentEntry.shape.y})`
          );
        }
        const frameChildren = parentEntry.wrapper.querySelector('.od-frame-children');
        if (frameChildren) {
          frameChildren.appendChild(wrapper);
          return;
        }
        const groupContent = parentEntry.wrapper.querySelector('.od-group-content');
        if (groupContent) {
          groupContent.appendChild(wrapper);
          return;
        }
        parentEntry.wrapper.insertBefore(wrapper, parentEntry.slot);
        return;
      }
    }

    wrapper.setAttribute('transform', `translate(${shape.x}, ${shape.y})`);
    if (this.shapesLayer && wrapper.parentNode !== this.shapesLayer) {
      this.shapesLayer.appendChild(wrapper);
    }
  }
}
