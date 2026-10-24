import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import type { EllipseProps } from './defs.js';

export function renderEllipse(shape: ShapeRecord<EllipseProps>, _ctx: RenderContext): SVGElement {
  const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttribute('class', 'od-shape-body');
  const rx = shape.props.width / 2;
  const ry = shape.props.height / 2;
  ellipse.setAttribute('cx', String(rx));
  ellipse.setAttribute('cy', String(ry));
  ellipse.setAttribute('rx', String(rx));
  ellipse.setAttribute('ry', String(ry));
  ellipse.setAttribute('fill', shape.props.fill ?? 'transparent');
  const stroke = shape.props.stroke ?? '#0f172a';
  if (stroke) {
    ellipse.setAttribute('stroke', stroke);
    ellipse.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 2));
  }
  return ellipse;
}

export function updateEllipse(
  element: SVGElement,
  shape: ShapeRecord<EllipseProps>,
  _prevShape: ShapeRecord<EllipseProps>,
  _ctx: RenderContext
): void {
  const ellipse = element.classList.contains('od-shape-body')
    ? (element as SVGEllipseElement)
    : element.querySelector<SVGEllipseElement>('.od-shape-body');
  if (ellipse) {
    const rx = shape.props.width / 2;
    const ry = shape.props.height / 2;
    ellipse.setAttribute('cx', String(rx));
    ellipse.setAttribute('cy', String(ry));
    ellipse.setAttribute('rx', String(rx));
    ellipse.setAttribute('ry', String(ry));
    ellipse.setAttribute('fill', shape.props.fill ?? 'transparent');
    if (shape.props.stroke) {
      ellipse.setAttribute('stroke', shape.props.stroke);
      ellipse.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 2));
    } else if (shape.props.stroke === undefined) {
      ellipse.setAttribute('stroke', '#0f172a');
      ellipse.setAttribute('stroke-width', String(shape.props.strokeWidth ?? 2));
    } else {
      ellipse.removeAttribute('stroke');
      ellipse.removeAttribute('stroke-width');
    }
  }
}
