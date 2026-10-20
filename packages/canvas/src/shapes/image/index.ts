import type { ShapeDefinition } from '../../registry.js';
import type { ImageProps } from './defs.js';
import { imageGeometry } from './geometry.js';
import { renderImage, updateImage } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';
export * from './handlers.js';

export const imageDefinition: ShapeDefinition<ImageProps> = {
  type: 'image',
  defaultProps(): ImageProps {
    return {
      width: 200,
      height: 200,
      src: '',
      natural: { w: 200, h: 200 },
    };
  },
  geometry: imageGeometry,
  render: renderImage,
  update: updateImage,
};
