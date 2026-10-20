import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { GroupProps } from './defs.js';

export const groupGeometry = {
  bounds(shape: ShapeRecord<GroupProps>): Bounds {
    return {
      x: shape.x,
      y: shape.y,
      width: 0,
      height: 0,
    };
  },

  resize(shape: ShapeRecord<GroupProps>, _handle: unknown, _point: Point): Partial<ShapeRecord<GroupProps>> {
    return shape;
  },

  hit(_shape: ShapeRecord<GroupProps>, _point: Point): boolean {
    return false;
  },
};
