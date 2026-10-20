import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle } from '../../registry.js';
import type { RectProps } from './defs.js';

export const rectGeometry = {
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
    const localX = point.x - shape.x;
    const localY = point.y - shape.y;
    return localX >= 0 && localX <= shape.props.width && localY >= 0 && localY <= shape.props.height;
  },
};
