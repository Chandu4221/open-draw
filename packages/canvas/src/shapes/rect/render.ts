import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import type { RectProps } from './defs.js';

export function renderRect(shape: ShapeRecord<RectProps>, _ctx: RenderContext): SVGElement {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('class', 'od-shape-body');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', String(shape.props.width));
  rect.setAttribute('height', String(shape.props.height));
  rect.setAttribute('fill', shape.props.fill ?? 'transparent');
  const stroke = shape.props.stroke ?? '#0f172a';
  if (stroke) {
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 2));
  }
  if (shape.props.rx) {
    rect.setAttribute('rx', String(shape.props.rx));
  }
  return rect;
}

export function updateRect(
  element: SVGElement,
  shape: ShapeRecord<RectProps>,
  _prevShape: ShapeRecord<RectProps>,
  _ctx: RenderContext
): void {
  const rect = element.classList.contains('od-shape-body')
    ? (element as SVGRectElement)
    : element.querySelector<SVGRectElement>('.od-shape-body');
  if (rect) {
    rect.setAttribute('width', String(shape.props.width));
    rect.setAttribute('height', String(shape.props.height));
    rect.setAttribute('fill', shape.props.fill ?? 'transparent');
    if (shape.props.stroke) {
      rect.setAttribute('stroke', shape.props.stroke);
      rect.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 2));
    } else if (shape.props.stroke === undefined) {
      rect.setAttribute('stroke', '#0f172a');
      rect.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 2));
    } else {
      rect.removeAttribute('stroke');
      rect.removeAttribute('stroke-width');
    }
    if (shape.props.rx) {
      rect.setAttribute('rx', String(shape.props.rx));
    } else {
      rect.removeAttribute('rx');
    }
  }
}
