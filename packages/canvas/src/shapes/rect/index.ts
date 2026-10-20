import type { ShapeDefinition } from '../../registry.js';
import type { RectProps } from './defs.js';
import { rectGeometry } from './geometry.js';
import { renderRect, updateRect } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';

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
  geometry: rectGeometry,
  render: renderRect,
  update: updateRect,
};
