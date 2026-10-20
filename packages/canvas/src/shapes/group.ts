import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { RenderContext, ShapeDefinition } from '../registry.js';

export const groupDefinition: ShapeDefinition<Record<string, unknown>> = {
  type: 'group',

  defaultProps(): Record<string, unknown> {
    return {};
  },

  geometry: {
    bounds(shape: ShapeRecord): Bounds {
      return {
        x: shape.x,
        y: shape.y,
        width: 0,
        height: 0,
      };
    },

    resize(shape: ShapeRecord, _handle, _point): Partial<ShapeRecord> {
      return shape;
    },

    hit(_shape: ShapeRecord, _point: Point): boolean {
      return false;
    },
  },

  render(_shape: ShapeRecord, _ctx: RenderContext): SVGElement {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'od-group-content');
    return group;
  },

  update(_element: SVGElement, _shape: ShapeRecord, _prevShape: ShapeRecord, _ctx: RenderContext): void {
    // Group wrapper position is updated by engine; children handle their own updates
  },
};
