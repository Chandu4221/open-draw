import type { ShapeDefinition } from '../../registry.js';
import { DEFAULT_HIGHLIGHTER_PROPS, DEFAULT_INK_PROPS, type InkProps } from './defs.js';
import { inkGeometry } from './geometry.js';
import { renderInk, updateInk } from './render.js';

export * from './defs.js';
export * from './rdp.js';
export * from './geometry.js';
export * from './render.js';

export const inkDefinition: ShapeDefinition<InkProps> = {
  type: 'ink',
  defaultProps: () => ({ ...DEFAULT_INK_PROPS }),
  geometry: inkGeometry,
  render: renderInk,
  update: updateInk,
};

export const highlighterDefinition: ShapeDefinition<InkProps> = {
  type: 'highlighter',
  defaultProps: () => ({ ...DEFAULT_HIGHLIGHTER_PROPS }),
  geometry: inkGeometry,
  render: renderInk,
  update: updateInk,
};
