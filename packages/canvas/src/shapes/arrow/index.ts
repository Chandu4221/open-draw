import type { ShapeDefinition } from '../../registry.js';
import { DEFAULT_ARROW_PROPS, type ArrowProps } from './defs.js';
import { arrowGeometry, resolveArrowEndpoints } from './geometry.js';
import { renderArrow, updateArrow } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';

export const arrowDefinition: ShapeDefinition<ArrowProps> = {
  type: 'arrow',
  defaultProps: () => ({ ...DEFAULT_ARROW_PROPS }),
  geometry: arrowGeometry,
  render: renderArrow,
  update: updateArrow,
  capabilities: {
    connector: {
      getSnapPoints: (shape) => {
        const { start, end } = resolveArrowEndpoints(shape);
        return [start, end];
      },
      getConnectionAnchor: (_shape, target) => target,
    },
  },
};
