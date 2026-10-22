import type { Bounds, Camera } from '@open-draw/schema';
import { getHandleDescriptors, type HandleDescriptor } from './handles.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BASE_HANDLE_SIZE = 8;
const BASE_ROTATE_OFFSET = 24;

export function renderHandles(
  slot: SVGGElement,
  localBounds: Bounds,
  camera: Camera = { x: 0, y: 0, zoom: 1 }
): SVGGElement {
  const handleScale = 1 / camera.zoom; // EXEMPTION: counter-scaling handles for constant screen size per §3.2
  const size = BASE_HANDLE_SIZE * handleScale;
  const half = size / 2;
  const rotOffset = BASE_ROTATE_OFFSET * handleScale;

  let frame = slot.querySelector(':scope > .od-selection-frame') as SVGGElement | null;
  if (!frame) {
    frame = document.createElementNS(SVG_NS, 'g');
    frame.setAttribute('class', 'od-selection-frame');
    slot.appendChild(frame);
  }

  // 1. Selection outline
  let outline = frame.querySelector(':scope > .od-selection-outline') as SVGRectElement | null;
  if (!outline) {
    outline = document.createElementNS(SVG_NS, 'rect');
    outline.setAttribute('class', 'od-selection-outline');
    outline.setAttribute('fill', 'none');
    outline.setAttribute('stroke', '#3b82f6');
    outline.setAttribute('stroke-width', '1.5');
    outline.setAttribute('pointer-events', 'none');
    outline.setAttribute('vector-effect', 'non-scaling-stroke');
    frame.appendChild(outline);
  }
  outline.setAttribute('x', String(localBounds.x));
  outline.setAttribute('y', String(localBounds.y));
  outline.setAttribute('width', String(Math.max(1, localBounds.width)));
  outline.setAttribute('height', String(Math.max(1, localBounds.height)));

  // 2. Connector line to rotate handle
  const midX = localBounds.x + localBounds.width / 2;
  const rotY = localBounds.y - rotOffset;
  let connector = frame.querySelector(':scope > .od-handle-connector') as SVGLineElement | null;
  if (!connector) {
    connector = document.createElementNS(SVG_NS, 'line');
    connector.setAttribute('class', 'od-handle-connector');
    connector.setAttribute('stroke', '#3b82f6');
    connector.setAttribute('stroke-width', '1');
    connector.setAttribute('vector-effect', 'non-scaling-stroke');
    connector.setAttribute('pointer-events', 'none');
    frame.appendChild(connector);
  }
  connector.setAttribute('x1', String(midX));
  connector.setAttribute('y1', String(localBounds.y));
  connector.setAttribute('x2', String(midX));
  connector.setAttribute('y2', String(rotY));

  // 3. Handles
  const descriptors = getHandleDescriptors(localBounds, rotOffset);
  for (const d of descriptors) {
    _renderHandle(frame, d, size, half);
  }

  return frame;
}

function _renderHandle(frame: SVGGElement, d: HandleDescriptor, size: number, half: number): void {
  if (d.type === 'rotate') {
    let circle = frame.querySelector(':scope > .od-handle-rotate') as SVGCircleElement | null;
    if (!circle) {
      circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('class', 'od-handle od-handle-rotate');
      circle.setAttribute('data-handle', 'rotate');
      circle.setAttribute('fill', '#ffffff');
      circle.setAttribute('stroke', '#3b82f6');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('vector-effect', 'non-scaling-stroke');
      circle.style.pointerEvents = 'auto';
      circle.style.cursor = d.cursor;
      frame.appendChild(circle);
    }
    circle.setAttribute('cx', String(d.point.x));
    circle.setAttribute('cy', String(d.point.y));
    circle.setAttribute('r', String(half));
    return;
  }

  let rect = frame.querySelector(`:scope > .od-handle-${d.type}`) as SVGRectElement | null;
  if (!rect) {
    rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('class', `od-handle od-handle-${d.type}`);
    rect.setAttribute('data-handle', d.type);
    rect.setAttribute('fill', '#ffffff');
    rect.setAttribute('stroke', '#3b82f6');
    rect.setAttribute('stroke-width', '1.5');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    rect.style.pointerEvents = 'auto';
    rect.style.cursor = d.cursor;
    frame.appendChild(rect);
  }
  rect.setAttribute('x', String(d.point.x - half));
  rect.setAttribute('y', String(d.point.y - half));
  rect.setAttribute('width', String(size));
  rect.setAttribute('height', String(size));
}

export function removeHandles(slot: SVGGElement): void {
  const frame = slot.querySelector(':scope > .od-selection-frame');
  frame?.remove();
}
