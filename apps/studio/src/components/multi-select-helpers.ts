import type { Shape } from "@open-draw/canvas";

export interface DerivedSharedStyles {
  readonly fill: string | undefined;
  readonly isFillMixed: boolean;
  readonly stroke: string | undefined;
  readonly isStrokeMixed: boolean;
  readonly strokeWidth: number | undefined;
  readonly isStrokeWidthMixed: boolean;
}

/**
 * Computes unified style properties or marks them as mixed when shapes have divergent values (R-008, R-016).
 */
export function computeSharedStyles(shapes: readonly Shape[]): DerivedSharedStyles {
  if (shapes.length === 0) {
    return {
      fill: undefined,
      isFillMixed: false,
      stroke: undefined,
      isStrokeMixed: false,
      strokeWidth: undefined,
      isStrokeWidthMixed: false,
    };
  }

  const firstFill = shapes[0]?.fill;
  const isFillMixed = shapes.some((s) => s.fill !== firstFill);

  const firstStroke = shapes[0]?.stroke;
  const isStrokeMixed = shapes.some((s) => s.stroke !== firstStroke);

  const firstStrokeWidth = shapes[0]?.strokeWidth;
  const isStrokeWidthMixed = shapes.some((s) => s.strokeWidth !== firstStrokeWidth);

  return {
    fill: isFillMixed ? undefined : firstFill,
    isFillMixed,
    stroke: isStrokeMixed ? undefined : firstStroke,
    isStrokeMixed,
    strokeWidth: isStrokeWidthMixed ? undefined : firstStrokeWidth,
    isStrokeWidthMixed,
  };
}

export function toColorInputValue(val: string | undefined | null, fallback: string): string {
  if (val && /^#[0-9a-fA-F]{6}$/.test(val)) return val;
  return fallback;
}

export const ALIGN_ACTIONS = [
  { alignment: "left", name: "align-left", label: "Align Left" },
  { alignment: "center", name: "align-center-horizontal", label: "Align Horizontal Center" },
  { alignment: "right", name: "align-right", label: "Align Right" },
  { alignment: "top", name: "align-top", label: "Align Top" },
  { alignment: "middle", name: "align-center-vertical", label: "Align Vertical Center" },
  { alignment: "bottom", name: "align-bottom", label: "Align Bottom" },
] as const;

export const DISTRIBUTE_ACTIONS = [
  { axis: "horizontal", name: "distribute-horizontal", label: "Distribute Horizontally" },
  { axis: "vertical", name: "distribute-vertical", label: "Distribute Vertically" },
] as const;

export const COLOR_SWATCH_STYLE: React.CSSProperties = {
  width: "26px",
  height: "var(--od-control-height)",
  padding: 0,
  cursor: "pointer",
  flexShrink: 0,
};

export const HEX_INPUT_STYLE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  width: 0,
  padding: "0 var(--od-4)",
  fontSize: "var(--od-text-xs)",
};

export const DIVIDER_STYLE: React.CSSProperties = {
  width: "1px",
  height: "16px",
  backgroundColor: "var(--od-border)",
  margin: "0 2px",
  flexShrink: 0,
};

export function getSelectionSummary(shapes: readonly Shape[]): string {
  if (shapes.length === 0) return "No items";
  const counts = new Map<string, number>();
  for (const s of shapes) {
    counts.set(s.kind, (counts.get(s.kind) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [kind, count] of counts.entries()) {
    parts.push(`${count} ${kind}${count > 1 ? "s" : ""}`);
  }
  return parts.join(", ");
}
