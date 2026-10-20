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

  resize(shape: ShapeRecord<FrameProps>, handle: ResizeHandle, point: Point): Partial<ShapeRecord<FrameProps>> {
    const currentW = Math.max(MIN_SIZE, shape.props.width ?? DEFAULT_FRAME_PROPS.width);
    const currentH = Math.max(MIN_SIZE, shape.props.height ?? DEFAULT_FRAME_PROPS.height);

    let x = shape.x;
    let y = shape.y;
    let width = currentW;
    let height = currentH;

    if (handle.includes('right')) {
      width = Math.max(MIN_SIZE, point.x - shape.x);
    } else if (handle.includes('left')) {
      const right = shape.x + currentW;
      const newX = Math.min(point.x, right - MIN_SIZE);
      width = right - newX;
      x = newX;
    }

    if (handle.includes('bottom')) {
      height = Math.max(MIN_SIZE, point.y - shape.y);
    } else if (handle.includes('top')) {
      const bottom = shape.y + currentH;
      const newY = Math.min(point.y, bottom - MIN_SIZE);
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
