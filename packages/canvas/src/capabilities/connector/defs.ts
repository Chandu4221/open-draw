import type { Point, ShapeId } from '@open-draw/schema';

export interface TargetUnboundEvent {
  readonly arrowId: ShapeId;
  readonly which: 'start' | 'end';
  readonly previousTargetId: ShapeId;
  readonly fallbackPoint: Point;
}

export type UnbindListener = (event: TargetUnboundEvent) => void;
