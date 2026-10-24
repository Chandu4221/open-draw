import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import { DEFAULT_INK_PROPS, type InkProps } from './defs.js';

export function pointsToSvgPath(pts: readonly number[], ox: number, oy: number): string {
  if (!pts || pts.length < 2) return '';
  const count = Math.floor(pts.length / 2);
  if (count === 1) {
    const lx = pts[0]! - ox;
    const ly = pts[1]! - oy;
    return `M ${lx} ${ly} L ${lx + 0.1} ${ly + 0.1}`;
  }
  let d = `M ${pts[0]! - ox} ${pts[1]! - oy}`;
  for (let i = 1; i < count; i++) {
    d += ` L ${pts[i * 2]! - ox} ${pts[i * 2 + 1]! - oy}`;
  }
  return d;
}

export function renderInk(shape: ShapeRecord<InkProps>, ctx: RenderContext): SVGElement {
  const stroke = shape.props.stroke ?? DEFAULT_INK_PROPS.stroke ?? '#1e293b';
  const strokeWidth = shape.props.strokeWidth ?? DEFAULT_INK_PROPS.strokeWidth ?? 3;
  const isHighlighter = Boolean(shape.props.isHighlighter);
  const d = pointsToSvgPath(shape.props.pts, shape.x, shape.y);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'od-ink-path');
  path.setAttribute('d', d);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', stroke);
  path.setAttribute('stroke-width', String(strokeWidth));
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  if (isHighlighter) {
    path.setAttribute('stroke-opacity', '0.4');
    path.style.mixBlendMode = 'multiply';
  }

  if (ctx.overlaySlot) {
    updateInkOverlayLabel(ctx.overlaySlot, shape.props.pts, shape.x, shape.y, shape.props.label);
  }

  return path;
}

export function updateInk(
  element: SVGElement,
  shape: ShapeRecord<InkProps>,
  _prevShape: ShapeRecord<InkProps>,
  ctx: RenderContext
): void {
  const stroke = shape.props.stroke ?? DEFAULT_INK_PROPS.stroke ?? '#1e293b';
  const strokeWidth = shape.props.strokeWidth ?? DEFAULT_INK_PROPS.strokeWidth ?? 3;
  const isHighlighter = Boolean(shape.props.isHighlighter);
  const d = pointsToSvgPath(shape.props.pts, shape.x, shape.y);

  const path = (element.querySelector('.od-ink-path') ??
    (element.classList.contains('od-ink-path') ? element : null)) as SVGElement | null;
  if (path) {
    path.setAttribute('d', d);
    path.setAttribute('stroke', stroke);
    path.setAttribute('stroke-width', String(strokeWidth));
    if (isHighlighter) {
      path.setAttribute('stroke-opacity', '0.4');
      path.style.mixBlendMode = 'multiply';
    }
  }

  if (ctx.overlaySlot) {
    updateInkOverlayLabel(ctx.overlaySlot, shape.props.pts, shape.x, shape.y, shape.props.label);
  }
}

function updateInkOverlayLabel(
  slot: SVGGElement,
  pts: readonly number[],
  ox: number,
  oy: number,
  labelText?: string
): void {
  let label = slot.querySelector('.od-ink-label') as SVGTextElement | null;
  if (!labelText || !pts || pts.length < 2) {
    if (label) label.remove();
    return;
  }

  const lx = pts[0]! - ox;
  const ly = pts[1]! - oy;

  if (!label) {
    label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'od-ink-label');
    label.setAttribute('font-size', '11');
    label.setAttribute('font-family', 'Inter, system-ui, sans-serif');
    label.setAttribute('font-weight', '500');
    label.setAttribute('fill', '#475569');
    slot.appendChild(label);
  }

  label.setAttribute('x', String(lx));
  label.setAttribute('y', String(ly - 6));
  label.textContent = labelText;
}
