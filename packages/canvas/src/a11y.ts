import type { ShapeRecord } from '@open-draw/schema';
import type { ShapeDefinition } from './registry.js';

/**
 * Computes semantic role and accessible label for SVG shape wrappers.
 * Containers (shapes with clipping or group capability) receive 'group' to prevent nested-interactive violations.
 * Shapes with visible text (props.text, props.label, or text capability) include visible text in accessible name (WCAG 2.5.3).
 */
export function computeShapeAria(
  shape: ShapeRecord,
  def?: ShapeDefinition
): { role: string; ariaLabel: string } {
  const isContainer = Boolean(def?.capabilities?.clipping || def?.capabilities?.group);
  const role = isContainer ? 'group' : 'button';

  let visibleText = '';
  if (def?.capabilities?.text?.canEditText(shape)) {
    visibleText = def.capabilities.text.getText(shape).trim();
  } else if (typeof shape.props['text'] === 'string' && shape.props['text'].trim()) {
    visibleText = shape.props['text'].trim();
  } else if (typeof shape.props['label'] === 'string' && shape.props['label'].trim()) {
    visibleText = shape.props['label'].trim();
  }

  const metaName =
    typeof shape.meta['name'] === 'string' && shape.meta['name'].trim()
      ? shape.meta['name'].trim()
      : '';

  let ariaLabel: string;
  if (visibleText && metaName) {
    ariaLabel = `${visibleText} (${shape.type} ${metaName})`;
  } else if (visibleText) {
    ariaLabel = `${visibleText} (${shape.type})`;
  } else if (metaName) {
    ariaLabel = `${shape.type} ${metaName}`;
  } else {
    ariaLabel = shape.type;
  }

  return { role, ariaLabel };
}

export const A11Y_FOCUS_STYLES = `
  .od-canvas-root:focus-visible { outline: 2px solid #3b82f6; outline-offset: -2px; }
  .od-shape:focus-visible:not(.od-selected):not(:has(.od-selection-frame)) { outline: 2px solid #3b82f6; outline-offset: 2px; }
  .od-shape:hover:not(.od-selected):not(:has(.od-selection-frame)):not(:has(.od-selection-outline)):not(.od-frame-target) {
    outline: 1.5px solid rgba(59, 130, 246, 0.45);
    outline-offset: 1px;
  }
  .od-shape.od-selected,
  .od-shape:has(.od-selection-frame),
  .od-shape:has(.od-selection-outline) { outline: none !important; }
`;

