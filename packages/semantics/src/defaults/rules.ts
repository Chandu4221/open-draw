import type { ShapeRecord, Snapshot } from '@open-draw/schema';

export type ConfidenceTier = 'strong' | 'weak';

export interface TypeInferenceResult {
  readonly type: string;
  readonly confidence: number; // 0.0 to 1.0
  readonly tier: ConfidenceTier;
  readonly ruleId: string;
  readonly explanation: string;
}

export interface InferenceRule {
  readonly id: string;
  readonly targetType: string;
  readonly confidence: number;
  readonly tier: ConfidenceTier;
  readonly explanation: string;
  evaluate(shape: ShapeRecord, scene: Snapshot, parent?: ShapeRecord): boolean;
}

function getWidth(shape: ShapeRecord): number {
  return typeof shape.props.width === 'number' ? shape.props.width : 0;
}

function getHeight(shape: ShapeRecord): number {
  return typeof shape.props.height === 'number' ? shape.props.height : 0;
}

/**
 * Standard rule table for creation-time semantic inference per Phase 3 §2.
 */
export const INFERENCE_RULES: readonly InferenceRule[] = [
  // 1. Full-width rect directly inside a page => section (strong)
  {
    id: 'full-width-rect-in-page',
    targetType: 'section',
    confidence: 0.92,
    tier: 'strong',
    explanation: 'Rectangle spanning >= 75% of page width inside a page container',
    evaluate: (shape, _scene, parent) => {
      if (shape.type !== 'rect' || !parent) return false;
      const parentSem = (parent.meta.semantic ?? {}) as Record<string, unknown>;
      if (parentSem.type !== 'page' && parent.type !== 'frame') return false;
      const parentW = getWidth(parent);
      const shapeW = getWidth(shape);
      return parentW > 0 && shapeW >= parentW * 0.75;
    },
  },

  // 2. Rect inside column or section => card (strong)
  {
    id: 'rect-in-section-or-column',
    targetType: 'card',
    confidence: 0.88,
    tier: 'strong',
    explanation: 'Rectangle container inside a section or column',
    evaluate: (shape, _scene, parent) => {
      if (shape.type !== 'rect' || !parent) return false;
      const parentSem = (parent.meta.semantic ?? {}) as Record<string, unknown>;
      return parentSem.type === 'section' || parentSem.type === 'column';
    },
  },

  // 3. First text shape inside a card at top => heading (strong)
  {
    id: 'first-text-in-card-top',
    targetType: 'heading',
    confidence: 0.85,
    tier: 'strong',
    explanation: 'Text shape positioned near the top of a card container',
    evaluate: (shape, scene, parent) => {
      if (shape.type !== 'text' || !parent) return false;
      const parentSem = (parent.meta.semantic ?? {}) as Record<string, unknown>;
      if (parentSem.type !== 'card') return false;

      const cardH = getHeight(parent);
      const isTop = cardH > 0 ? (shape.y - parent.y) <= cardH * 0.4 : true;
      if (!isTop) return false;

      // Check if it is the first/highest text child
      const siblingTexts = scene.shapes.filter(
        (s) => (s.meta.parent === parent.id || s.meta.parentId === parent.id) && s.type === 'text' && s.id !== shape.id
      );
      const isFirst = siblingTexts.every((s) => s.y >= shape.y);
      return isFirst;
    },
  },

  // 4. Small rect inside nav or with centered dimensions => button (weak -> ghost)
  {
    id: 'small-rect-button',
    targetType: 'button',
    confidence: 0.65,
    tier: 'weak',
    explanation: 'Compact rectangle with button-like aspect ratio (w <= 240, h <= 64)',
    evaluate: (shape, _scene, parent) => {
      if (shape.type !== 'rect') return false;
      const w = getWidth(shape);
      const h = getHeight(shape);
      if (w > 0 && h > 0 && w <= 240 && h <= 64 && w >= h * 1.5) {
        if (parent) {
          const parentSem = (parent.meta.semantic ?? {}) as Record<string, unknown>;
          if (parentSem.type === 'nav') return true;
        }
        return true;
      }
      return false;
    },
  },

  // 5. Ink over a shape => annotation (weak, informational)
  {
    id: 'ink-annotation',
    targetType: 'annotation',
    confidence: 0.5,
    tier: 'weak',
    explanation: 'Freehand ink stroke treated as an informational annotation',
    evaluate: (shape) => {
      return shape.type === 'ink' || shape.type === 'highlighter';
    },
  },

  // 6. Thin rect => divider (strong)
  {
    id: 'thin-rect-divider',
    targetType: 'divider',
    confidence: 0.90,
    tier: 'strong',
    explanation: 'Thin rectangle (h <= 3 or w <= 3) treated as a visual divider/separator',
    evaluate: (shape) => {
      if (shape.type !== 'rect') return false;
      const w = getWidth(shape);
      const h = getHeight(shape);
      return (h > 0 && h <= 3 && w >= 20) || (w > 0 && w <= 3 && h >= 20);
    },
  },

  // 7. Full-width rect at bottom of page => footer (strong)
  {
    id: 'bottom-rect-footer',
    targetType: 'footer',
    confidence: 0.88,
    tier: 'strong',
    explanation: 'Rectangle spanning >= 75% of page width at the bottom of a page container',
    evaluate: (shape, _scene, parent) => {
      if (shape.type !== 'rect' || !parent) return false;
      const parentSem = (parent.meta.semantic ?? {}) as Record<string, unknown>;
      if (parentSem.type !== 'page' && parent.type !== 'frame') return false;
      const parentW = getWidth(parent);
      const parentH = getHeight(parent);
      const shapeW = getWidth(shape);
      const shapeH = getHeight(shape);
      const relY = shape.y - parent.y;
      return parentW > 0 && parentH > 0 && shapeW >= parentW * 0.75 && (relY + shapeH) >= parentH * 0.75;
    },
  },
];

