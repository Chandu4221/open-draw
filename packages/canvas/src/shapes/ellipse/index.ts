import type { ShapeDefinition } from '../../registry.js';
import type { EllipseProps } from './defs.js';
import { ellipseGeometry } from './geometry.js';
import { renderEllipse, updateEllipse } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';

export const ellipseDefinition: ShapeDefinition<EllipseProps> = {
  type: 'ellipse',
  defaultProps(): EllipseProps {
    return {
      width: 100,
      height: 100,
      fill: '#10b981',
      stroke: '#059669',
      strokeWidth: 2,
    };
  },
  geometry: ellipseGeometry,
  render: renderEllipse,
  update: updateEllipse,
};
