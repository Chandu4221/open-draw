import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import { DEFAULT_FRAME_PROPS, type FrameProps } from './defs.js';

export function renderFrame(shape: ShapeRecord<FrameProps>, ctx: RenderContext): SVGElement[] {
  const w = Math.max(50, shape.props.width ?? DEFAULT_FRAME_PROPS.width);
  const h = Math.max(50, shape.props.height ?? DEFAULT_FRAME_PROPS.height);
  const fill = shape.props.fill ?? DEFAULT_FRAME_PROPS.fill ?? '#ffffff';
  const stroke = shape.props.stroke ?? DEFAULT_FRAME_PROPS.stroke ?? '#cbd5e1';
  const labelText = shape.props.label ?? DEFAULT_FRAME_PROPS.label ?? 'Frame';

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
  clipPath.setAttribute('id', `od-frame-clip-${shape.id}`);

  const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  clipRect.setAttribute('class', 'od-frame-clip-rect');
  clipRect.setAttribute('x', '0');
  clipRect.setAttribute('y', '0');
  clipRect.setAttribute('width', String(w));
  clipRect.setAttribute('height', String(h));
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);

  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('class', 'od-frame-bg');
  bgRect.setAttribute('x', '0');
  bgRect.setAttribute('y', '0');
  bgRect.setAttribute('width', String(w));
  bgRect.setAttribute('height', String(h));
  bgRect.setAttribute('fill', fill);
  bgRect.setAttribute('stroke', stroke);
  bgRect.setAttribute('stroke-width', '1');

  const childrenLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  childrenLayer.setAttribute('class', 'od-frame-children');
  childrenLayer.setAttribute('clip-path', `url(#od-frame-clip-${shape.id})`);

  if (ctx.overlaySlot) {
    updateOverlayLabel(ctx.overlaySlot, labelText);
  }

  return [defs, bgRect, childrenLayer];
}

export function updateFrame(
  element: SVGElement,
  shape: ShapeRecord<FrameProps>,
  _prevShape: ShapeRecord<FrameProps>,
  ctx: RenderContext
): void {
  const w = Math.max(50, shape.props.width ?? DEFAULT_FRAME_PROPS.width);
  const h = Math.max(50, shape.props.height ?? DEFAULT_FRAME_PROPS.height);
  const fill = shape.props.fill ?? DEFAULT_FRAME_PROPS.fill ?? '#ffffff';
  const stroke = shape.props.stroke ?? DEFAULT_FRAME_PROPS.stroke ?? '#cbd5e1';
  const labelText = shape.props.label ?? DEFAULT_FRAME_PROPS.label ?? 'Frame';

  const clipRect = element.querySelector('.od-frame-clip-rect');
  if (clipRect) {
    clipRect.setAttribute('width', String(w));
    clipRect.setAttribute('height', String(h));
  }

  const bgRect = element.querySelector('.od-frame-bg');
  if (bgRect) {
    bgRect.setAttribute('width', String(w));
    bgRect.setAttribute('height', String(h));
    bgRect.setAttribute('fill', fill);
    bgRect.setAttribute('stroke', stroke);
  }

  if (ctx.overlaySlot) {
    updateOverlayLabel(ctx.overlaySlot, labelText);
  }
}

function updateOverlayLabel(slot: SVGGElement, text: string): void {
  let label = slot.querySelector('.od-frame-label') as SVGTextElement | null;
  if (!label) {
    label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'od-frame-label');
    label.setAttribute('x', '0');
    label.setAttribute('y', '-8');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    label.setAttribute('font-weight', '500');
    label.setAttribute('fill', '#64748b');
    slot.appendChild(label);
  }
  label.textContent = text;
}
