import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import type { ImageProps } from './defs.js';

export function renderImage(shape: ShapeRecord<ImageProps>, _ctx: RenderContext): SVGElement {
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  image.setAttribute('class', 'od-shape-body');
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('width', String(shape.props.width));
  image.setAttribute('height', String(shape.props.height));
  image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  if (shape.props.src) {
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', shape.props.src);
    image.setAttribute('href', shape.props.src);
  }
  return image;
}

export function updateImage(
  element: SVGElement,
  shape: ShapeRecord<ImageProps>,
  _prevShape: ShapeRecord<ImageProps>,
  _ctx: RenderContext
): void {
  const image = element.classList.contains('od-shape-body')
    ? (element as SVGImageElement)
    : element.querySelector<SVGImageElement>('.od-shape-body');
  if (image) {
    image.setAttribute('width', String(shape.props.width));
    image.setAttribute('height', String(shape.props.height));
    if (shape.props.src) {
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', shape.props.src);
      image.setAttribute('href', shape.props.src);
    }
  }
}
