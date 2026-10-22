import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle } from '../../registry.js';
import type { TextProps } from './defs.js';

export const textGeometry = {
  bounds(shape: ShapeRecord<TextProps>): Bounds {
    return {
      x: shape.x,
      y: shape.y,
      width: shape.props.width,
      height: shape.props.height,
    };
  },

  resize(shape: ShapeRecord<TextProps>, handleOrBounds: ResizeHandle | Bounds, point?: Point): Partial<ShapeRecord<TextProps>> {
    if (typeof handleOrBounds === 'object' && 'width' in handleOrBounds && 'height' in handleOrBounds) {
      return {
        x: handleOrBounds.x,
        y: handleOrBounds.y,
        props: {
          ...shape.props,
          width: Math.max(30, handleOrBounds.width),
          height: Math.max(20, handleOrBounds.height),
        },
      };
    }

    let { x, y } = shape;
    let width = shape.props.width;
    let height = shape.props.height;
    const pt = point ?? { x, y };

    switch (handleOrBounds) {
      case 'bottom-right':
      case 'se':
        width = Math.max(30, pt.x - x);
        height = Math.max(20, pt.y - y);
        break;
      case 'bottom-left':
      case 'sw':
        width = Math.max(30, x + width - pt.x);
        height = Math.max(20, pt.y - y);
        x = pt.x;
        break;
      case 'top-right':
      case 'ne':
        width = Math.max(30, pt.x - x);
        height = Math.max(20, y + height - pt.y);
        y = pt.y;
        break;
      case 'top-left':
      case 'nw':
        width = Math.max(30, x + width - pt.x);
        height = Math.max(20, y + height - pt.y);
        x = pt.x;
        y = pt.y;
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

  hit(shape: ShapeRecord<TextProps>, point: Point): boolean {
    const localX = point.x - shape.x;
    const localY = point.y - shape.y;
    return localX >= 0 && localX <= shape.props.width && localY >= 0 && localY <= shape.props.height;
  },
};
