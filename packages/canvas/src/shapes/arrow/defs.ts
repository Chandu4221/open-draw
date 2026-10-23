import type { Point, ShapeId } from '@open-draw/schema';

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface ArrowBinding {
  readonly shapeId: ShapeId;
  readonly anchor: AnchorPosition;
}

export interface ArrowProps {
  readonly startBinding?: ArrowBinding;
  readonly endBinding?: ArrowBinding;
  readonly startPoint?: Point;
  readonly endPoint?: Point;
  readonly label?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
}

export const DEFAULT_ARROW_PROPS: ArrowProps = {
  stroke: '#1e293b',
  strokeWidth: 2,
};

