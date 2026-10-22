import type { Bounds, Point, ShapeRecord } from '@open-draw/schema';
import type { GroupProps } from './defs.js';

export const groupGeometry = {
  bounds(shape: ShapeRecord<GroupProps>): Bounds {
    return {
      x: shape.x,
      y: shape.y,
      width: Number(shape.props?.width ?? 0),
      height: Number(shape.props?.height ?? 0),
    };
  },

  resize(shape: ShapeRecord<GroupProps>, _handle: unknown, _point: Point): Partial<ShapeRecord<GroupProps>> {
    return shape;
  },

  hit(shape: ShapeRecord<GroupProps>, point: Point): boolean {
    const w = Number(shape.props?.width ?? 0);
    const h = Number(shape.props?.height ?? 0);
    return point.x >= shape.x && point.x <= shape.x + w && point.y >= shape.y && point.y <= shape.y + h;
  },
};
