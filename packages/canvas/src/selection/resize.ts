import type { Bounds } from '@open-draw/schema';
import { boundsOf } from '@open-draw/schema';
import type { HandleType } from './handles.js';

export interface ResizeOptions {
  readonly aspect?: boolean;
  readonly fromCenter?: boolean;
  readonly minW?: number;
  readonly minH?: number;
}

export function resizeBounds(
  initial: Bounds,
  handle: HandleType,
  dx: number,
  dy: number,
  options: ResizeOptions = {}
): Bounds {
  if (handle === 'rotate') return initial;

  const minW = options.minW ?? 10;
  const minH = options.minH ?? 10;
  const aspect = options.aspect ?? false;
  const fromCenter = options.fromCenter ?? false;
  const { width: w, height: h, x, y } = initial;
  const ratio = w / h;

  let newW = w;
  let newH = h;
  let newX = x;
  let newY = y;

  if (handle === 'e' || handle === 'w') {
    const delta = (fromCenter ? 2 : 1) * (handle === 'e' ? dx : -dx);
    newW = Math.max(minW, w + delta);
    newH = h;
    newX = fromCenter ? x - (newW - w) / 2 : handle === 'w' ? x + (w - newW) : x;
    newY = y;
    return boundsOf(newX, newY, newW, newH);
  }

  if (handle === 's' || handle === 'n') {
    const delta = (fromCenter ? 2 : 1) * (handle === 's' ? dy : -dy);
    newW = w;
    newH = Math.max(minH, h + delta);
    newX = x;
    newY = fromCenter ? y - (newH - h) / 2 : handle === 'n' ? y + (h - newH) : y;
    return boundsOf(newX, newY, newW, newH);
  }

  // Corner handles (se, nw, ne, sw)
  const signX = handle === 'se' || handle === 'ne' ? 1 : -1;
  const signY = handle === 'se' || handle === 'sw' ? 1 : -1;

  const mult = fromCenter ? 2 : 1;
  const rawW = w + mult * signX * dx;
  const rawH = h + mult * signY * dy;

  if (aspect) {
    const scale = Math.max(rawW / w, rawH / h);
    let candW = w * scale;
    let candH = candW / ratio;
    if (candW < minW) {
      candW = minW;
      candH = candW / ratio;
    }
    if (candH < minH) {
      candH = minH;
      candW = candH * ratio;
    }
    newW = candW;
    newH = candH;
  } else {
    newW = Math.max(minW, rawW);
    newH = Math.max(minH, rawH);
  }

  if (fromCenter) {
    newX = x - (newW - w) / 2;
    newY = y - (newH - h) / 2;
  } else {
    newX = signX === 1 ? x : x + (w - newW);
    newY = signY === 1 ? y : y + (h - newH);
  }

  return boundsOf(newX, newY, newW, newH);
}
