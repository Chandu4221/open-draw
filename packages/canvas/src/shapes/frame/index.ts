import type { ShapeDefinition } from '../../registry.js';
import { DEFAULT_FRAME_PROPS, type FrameProps } from './defs.js';
import { frameGeometry } from './geometry.js';
import { renderFrame, updateFrame } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';

export const frameDefinition: ShapeDefinition<FrameProps> = {
  type: 'frame',
  defaultProps: () => ({ ...DEFAULT_FRAME_PROPS }),
  geometry: frameGeometry,
  render: renderFrame,
  update: updateFrame,
  capabilities: {
    clipping: {
      getClipPath: (shape) => `url(#od-frame-clip-${shape.id})`,
      isMask: () => true,
    },
  },
};
