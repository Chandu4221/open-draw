import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import { DEFAULT_ARROW_PROPS, type ArrowProps } from './defs.js';
import { resolveArrowEndpoints } from './geometry.js';

export function renderArrow(shape: ShapeRecord<ArrowProps>, ctx: RenderContext): SVGElement[] {
  const { start, end } = resolveArrowEndpoints(shape, ctx.store, ctx.registry);
  const stroke = shape.props.stroke ?? DEFAULT_ARROW_PROPS.stroke ?? '#1e293b';
  const strokeWidth = shape.props.strokeWidth ?? DEFAULT_ARROW_PROPS.strokeWidth ?? 2;
  const labelText = shape.props.label;

  const lx1 = start.x - shape.x;
  const ly1 = start.y - shape.y;
  const lx2 = end.x - shape.x;
  const ly2 = end.y - shape.y;

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', `od-arrowhead-${shape.id}`);
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '8');
  marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '6');
  marker.setAttribute('markerHeight', '6');
  marker.setAttribute('orient', 'auto-start-reverse');

  const markerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  markerPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  markerPath.setAttribute('fill', stroke);
  marker.appendChild(markerPath);
  defs.appendChild(marker);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'od-arrow-path');
  path.setAttribute('d', `M ${lx1} ${ly1} L ${lx2} ${ly2}`);
  path.setAttribute('stroke', stroke);
  path.setAttribute('stroke-width', String(strokeWidth));
  path.setAttribute('fill', 'none');
  path.setAttribute('marker-end', `url(#od-arrowhead-${shape.id})`);

  if (ctx.overlaySlot) {
    updateArrowOverlayLabel(ctx.overlaySlot, lx1, ly1, lx2, ly2, labelText);
  }

  return [defs, path];
}

export function updateArrow(
  element: SVGElement,
  shape: ShapeRecord<ArrowProps>,
  _prevShape: ShapeRecord<ArrowProps>,
  ctx: RenderContext
): void {
  const { start, end } = resolveArrowEndpoints(shape, ctx.store, ctx.registry);
  const stroke = shape.props.stroke ?? DEFAULT_ARROW_PROPS.stroke ?? '#1e293b';
  const strokeWidth = shape.props.strokeWidth ?? DEFAULT_ARROW_PROPS.strokeWidth ?? 2;
  const labelText = shape.props.label;

  const lx1 = start.x - shape.x;
  const ly1 = start.y - shape.y;
  const lx2 = end.x - shape.x;
  const ly2 = end.y - shape.y;

  const path = element.querySelector('.od-arrow-path');
  if (path) {
    path.setAttribute('d', `M ${lx1} ${ly1} L ${lx2} ${ly2}`);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', String(strokeWidth));
  }

  const markerPath = element.querySelector(`#od-arrowhead-${shape.id} path`);
  if (markerPath) {
    markerPath.setAttribute('fill', stroke);
  }

  if (ctx.overlaySlot) {
    updateArrowOverlayLabel(ctx.overlaySlot, lx1, ly1, lx2, ly2, labelText);
  }
}

function updateArrowOverlayLabel(
  slot: SVGGElement,
  lx1: number,
  ly1: number,
  lx2: number,
  ly2: number,
  labelText?: string
): void {
  let label = slot.querySelector('.od-arrow-label') as SVGTextElement | null;
  if (!labelText) {
    if (label) label.remove();
    return;
  }

  const midX = (lx1 + lx2) / 2;
  const midY = (ly1 + ly2) / 2;

  if (!label) {
    label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'od-arrow-label');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'sans-serif');
    label.setAttribute('font-weight', '500');
    label.setAttribute('fill', '#334155');
    label.setAttribute('text-anchor', 'middle');
    slot.appendChild(label);
  }

  label.setAttribute('x', String(midX));
  label.setAttribute('y', String(midY - 6));
  label.textContent = labelText;
}
