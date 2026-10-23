import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import type { TextProps } from './defs.js';

export function renderText(shape: ShapeRecord<TextProps>, _ctx: RenderContext): SVGElement {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('class', 'od-shape-body od-text-body');
  text.setAttribute('x', '0');
  text.setAttribute('y', String(shape.props.fontSize ?? 16));
  text.setAttribute('font-size', String(shape.props.fontSize ?? 16));
  text.setAttribute('font-family', shape.props.fontFamily ?? 'system-ui, sans-serif');
  text.setAttribute('fill', shape.props.fill ?? '#1e293b');
  if (shape.props.fontWeight) {
    text.setAttribute('font-weight', shape.props.fontWeight);
  }
  text.textContent = shape.props.text;
  return text;
}

export function updateText(
  element: SVGElement,
  shape: ShapeRecord<TextProps>,
  _prevShape: ShapeRecord<TextProps>,
  _ctx: RenderContext
): void {
  const text = element.classList.contains('od-shape-body')
    ? (element as SVGTextElement)
    : element.querySelector<SVGTextElement>('.od-shape-body');
  if (text) {
    text.setAttribute('y', String(shape.props.fontSize ?? 16));
    text.setAttribute('font-size', String(shape.props.fontSize ?? 16));
    text.setAttribute('fill', shape.props.fill ?? '#1e293b');
    if (shape.props.fontWeight) {
      text.setAttribute('font-weight', shape.props.fontWeight);
    } else {
      text.removeAttribute('font-weight');
    }
    text.textContent = shape.props.text;
  }
}
