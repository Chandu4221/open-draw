import type { Bounds, Point, ShapeId } from '@open-draw/schema';
import { boundsIntersect, boundsOf } from '@open-draw/schema';
import type { ShapeRegistry } from '../registry.js';
import type { CanvasStore } from '../store/index.js';

export function computeMarqueeBounds(start: Point, current: Point): Bounds {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);
  return boundsOf(x, y, width, height);
}

export function findIntersectingShapes(
  box: Bounds,
  store: CanvasStore,
  registry: ShapeRegistry
): readonly ShapeId[] {
  const hitIds: ShapeId[] = [];
  for (const shape of store.listShapes()) {
    if (shape.hidden) continue;
    const def = registry.get(shape.type);
    if (!def) continue;
    const shapeBounds = def.geometry.bounds(shape);
    if (
      !Number.isFinite(shapeBounds.x) ||
      !Number.isFinite(shapeBounds.y) ||
      !Number.isFinite(shapeBounds.width) ||
      !Number.isFinite(shapeBounds.height)
    ) {
      continue;
    }
    if (boundsIntersect(box, shapeBounds)) {
      hitIds.push(shape.id);
    }
  }
  return hitIds;
}

export class MarqueeOverlay {
  private el: SVGRectElement | null = null;

  show(container: HTMLElement, bounds: Bounds): void {
    const viewport = container.querySelector('.od-viewport');
    if (!viewport) return;

    if (!this.el) {
      this.el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      this.el.setAttribute('class', 'od-marquee');
      this.el.setAttribute('fill', 'rgba(59, 130, 246, 0.1)');
      this.el.setAttribute('stroke', '#3b82f6');
      this.el.setAttribute('stroke-width', '1');
      this.el.setAttribute('stroke-dasharray', '3 3');
      this.el.setAttribute('pointer-events', 'none');
      viewport.appendChild(this.el);
    }

    this.el.setAttribute('x', String(bounds.x));
    this.el.setAttribute('y', String(bounds.y));
    this.el.setAttribute('width', String(bounds.width));
    this.el.setAttribute('height', String(bounds.height));
  }

  hide(): void {
    if (this.el) {
      this.el.remove();
      this.el = null;
    }
  }
}
