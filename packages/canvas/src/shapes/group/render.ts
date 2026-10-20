import type { ShapeRecord } from '@open-draw/schema';
import type { RenderContext } from '../../registry.js';
import type { GroupProps } from './defs.js';

export function renderGroup(_shape: ShapeRecord<GroupProps>, _ctx: RenderContext): SVGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.setAttribute('class', 'od-group-content');
  return group;
}

export function updateGroup(_element: SVGElement, _shape: ShapeRecord<GroupProps>, _prevShape: ShapeRecord<GroupProps>, _ctx: RenderContext): void {
  // Group wrapper position is updated by engine; children handle their own updates
}
