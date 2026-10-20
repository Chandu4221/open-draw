import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { RenderContext, ResizeHandle, ShapeDefinition } from '../registry.js';

export interface RectProps {
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
}

export const rectDefinition: ShapeDefinition<RectProps> = {
  type: 'rect',

  defaultProps(): RectProps {
    return {
      width: 100,
      height: 100,
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      strokeWidth: 2,
      rx: 0,
    };
  },

  geometry: {
    bounds(shape: ShapeRecord<RectProps>): Bounds {
      return {
        x: shape.x,
        y: shape.y,
        width: shape.props.width,
        height: shape.props.height,
      };
    },

    resize(shape: ShapeRecord<RectProps>, handle: ResizeHandle, point: Point): Partial<ShapeRecord<RectProps>> {
      let { x, y } = shape;
      let width = shape.props.width;
      let height = shape.props.height;

      switch (handle) {
        case 'bottom-right':
          width = Math.max(10, point.x - x);
          height = Math.max(10, point.y - y);
          break;
        case 'bottom-left':
          width = Math.max(10, x + width - point.x);
          height = Math.max(10, point.y - y);
          x = point.x;
          break;
        case 'top-right':
          width = Math.max(10, point.x - x);
          height = Math.max(10, y + height - point.y);
          y = point.y;
          break;
        case 'top-left':
          width = Math.max(10, x + width - point.x);
          height = Math.max(10, y + height - point.y);
          x = point.x;
          y = point.y;
          break;
      }

      return {
        x,
        y,
        props: {
          ...shape.props,
          width,
          height,
        },
      };
    },

    hit(shape: ShapeRecord<RectProps>, point: Point): boolean {
      // Local coordinate hit testing (0,0 to width,height)
      const localX = point.x - shape.x;
      const localY = point.y - shape.y;
      return localX >= 0 && localX <= shape.props.width && localY >= 0 && localY <= shape.props.height;
    },
  },

  render(shape: ShapeRecord<RectProps>, _ctx: RenderContext): SVGElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('class', 'od-shape-body');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(shape.props.width));
    rect.setAttribute('height', String(shape.props.height));
    rect.setAttribute('fill', shape.props.fill ?? '#3b82f6');
    if (shape.props.stroke) {
      rect.setAttribute('stroke', shape.props.stroke);
      rect.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 1));
    }
    if (shape.props.rx) {
      rect.setAttribute('rx', String(shape.props.rx));
    }
    return rect;
  },

  update(element: SVGElement, shape: ShapeRecord<RectProps>, _prevShape: ShapeRecord<RectProps>, _ctx: RenderContext): void {
    const rect = element.classList.contains('od-shape-body') ? (element as SVGRectElement) : element.querySelector<SVGRectElement>('.od-shape-body');
    if (rect) {
      rect.setAttribute('width', String(shape.props.width));
      rect.setAttribute('height', String(shape.props.height));
      rect.setAttribute('fill', shape.props.fill ?? '#3b82f6');
      if (shape.props.stroke) {
        rect.setAttribute('stroke', shape.props.stroke);
        rect.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 1));
      } else {
        rect.removeAttribute('stroke');
        rect.removeAttribute('stroke-width');
      }
      if (shape.props.rx) {
        rect.setAttribute('rx', String(shape.props.rx));
      } else {
        rect.removeAttribute('rx');
      }
    }
  },
};
