import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import type { NoteProps } from './defs.js';

export function renderNote(shape: ShapeRecord<NoteProps>, _ctx: RenderContext): SVGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'od-shape-body');

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('class', 'od-note-bg');
  bg.setAttribute('x', '0');
  bg.setAttribute('y', '0');
  bg.setAttribute('width', String(shape.props.width));
  bg.setAttribute('height', String(shape.props.height));
  bg.setAttribute('rx', '4');
  bg.setAttribute('fill', shape.props.color ?? '#fef08a');
  bg.setAttribute('stroke', '#facc15');
  bg.setAttribute('stroke-width', '1');
  group.appendChild(bg);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('class', 'od-note-text');
  text.setAttribute('x', '12');
  text.setAttribute('y', '24');
  text.setAttribute('fill', '#713f12');
  text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
  text.setAttribute('font-size', '14');
  text.textContent = shape.props.text ?? '';
  group.appendChild(text);

  return group;
}

export function updateNote(
  element: SVGElement,
  shape: ShapeRecord<NoteProps>,
  _prevShape: ShapeRecord<NoteProps>,
  _ctx: RenderContext
): void {
  const bg = element.querySelector<SVGRectElement>('.od-note-bg');
  if (bg) {
    bg.setAttribute('width', String(shape.props.width));
    bg.setAttribute('height', String(shape.props.height));
    bg.setAttribute('fill', shape.props.color ?? '#fef08a');
  }

  const text = element.querySelector<SVGTextElement>('.od-note-text');
  if (text) {
    text.textContent = shape.props.text ?? '';
  }
}
