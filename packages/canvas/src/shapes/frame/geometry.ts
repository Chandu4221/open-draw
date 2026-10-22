import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { ResizeHandle, ShapeGeometry } from '../../registry.js';
import { DEFAULT_FRAME_PROPS, type FrameProps } from './defs.js';

const MIN_SIZE = 50;

export const frameGeometry: ShapeGeometry<FrameProps> = {
  bounds(shape: ShapeRecord<FrameProps>): Bounds {
    const width = Math.max(MIN_SIZE, shape.props.width ?? DEFAULT_FRAME_PROPS.width);
    const height = Math.max(MIN_SIZE, shape.props.height ?? DEFAULT_FRAME_PROPS.height);
    return {
      x: shape.x,
      y: shape.y,
      width,
      height,
    };
  },

  resize(shape: ShapeRecord<FrameProps>, handleOrBounds: ResizeHandle | Bounds, point?: Point): Partial<ShapeRecord<FrameProps>> {
    if (typeof handleOrBounds === 'object' && 'width' in handleOrBounds && 'height' in handleOrBounds) {
      return {
        x: handleOrBounds.x,
        y: handleOrBounds.y,
        props: {
          ...shape.props,
          width: Math.max(MIN_SIZE, handleOrBounds.width),
          height: Math.max(MIN_SIZE, handleOrBounds.height),
        },
      };
    }

    const currentW = Math.max(MIN_SIZE, shape.props.width ?? DEFAULT_FRAME_PROPS.width);
    const currentH = Math.max(MIN_SIZE, shape.props.height ?? DEFAULT_FRAME_PROPS.height);

    let x = shape.x;
    let y = shape.y;
    let width = currentW;
    let height = currentH;
    const pt = point ?? { x, y };

    if (handleOrBounds.includes('right') || handleOrBounds === 'e' || handleOrBounds === 'ne' || handleOrBounds === 'se') {
      width = Math.max(MIN_SIZE, pt.x - shape.x);
    } else if (handleOrBounds.includes('left') || handleOrBounds === 'w' || handleOrBounds === 'nw' || handleOrBounds === 'sw') {
      const right = shape.x + currentW;
      const newX = Math.min(pt.x, right - MIN_SIZE);
      width = right - newX;
      x = newX;
    }

    if (handleOrBounds.includes('bottom') || handleOrBounds === 's' || handleOrBounds === 'se' || handleOrBounds === 'sw') {
      height = Math.max(MIN_SIZE, pt.y - shape.y);
    } else if (handleOrBounds.includes('top') || handleOrBounds === 'n' || handleOrBounds === 'ne' || handleOrBounds === 'nw') {
      const bottom = shape.y + currentH;
      const newY = Math.min(pt.y, bottom - MIN_SIZE);
      height = bottom - newY;
      y = newY;
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

  hit(shape: ShapeRecord<FrameProps>, point: Point): boolean {
    const b = frameGeometry.bounds(shape);
    return point.x >= b.x && point.x <= b.x + b.width && point.y >= b.y && point.y <= b.y + b.height;
  },
};
