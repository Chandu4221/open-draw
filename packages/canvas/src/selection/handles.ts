import type { Bounds, Point } from '@open-draw/schema';

export type HandleType =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotate';

export interface HandleDescriptor {
  readonly type: HandleType;
  readonly point: Point;
  readonly cursor: string;
}

export function getHandleDescriptors(bounds: Bounds, rotateOffset = 24): readonly HandleDescriptor[] {
  const { x, y, width, height } = bounds;
  const midX = x + width / 2;
  const midY = y + height / 2;
  const right = x + width;
  const bottom = y + height;

  return [
    { type: 'nw', point: { x, y }, cursor: 'nwse-resize' },
    { type: 'n', point: { x: midX, y }, cursor: 'ns-resize' },
    { type: 'ne', point: { x: right, y }, cursor: 'nesw-resize' },
    { type: 'e', point: { x: right, y: midY }, cursor: 'ew-resize' },
    { type: 'se', point: { x: right, y: bottom }, cursor: 'nwse-resize' },
    { type: 's', point: { x: midX, y: bottom }, cursor: 'ns-resize' },
    { type: 'sw', point: { x, y: bottom }, cursor: 'nesw-resize' },
    { type: 'w', point: { x, y: midY }, cursor: 'ew-resize' },
    { type: 'rotate', point: { x: midX, y: y - rotateOffset }, cursor: 'grab' },
  ];
}
