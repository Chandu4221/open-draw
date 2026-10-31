// Closed registry of built-in shape kinds and open custom shape contract
// (ADR-0002 D3, ADR-0003 D2, R-005, R-006).
// One canonical list for built-ins; `SHAPE_KIND_LABELS` lives in the same module
// so display names never drift from the kinds they label.
//
// Hybrid registry model:
// - Built-in shape kinds stay closed: page, section, rect, ellipse, line, pen-path.
// - Custom shape kinds are pattern-open: "<scope>:<name>" kebab-case branded strings.
export const SHAPE_KINDS = {
  page: "page",
  section: "section",
  rect: "rect",
  ellipse: "ellipse",
  line: "line",
  penPath: "pen-path",
} as const;

export type BuiltinShapeKind = (typeof SHAPE_KINDS)[keyof typeof SHAPE_KINDS];

export type CustomShapeKind = string & { readonly __brand: "CustomShapeKind" };

export type ShapeKind = BuiltinShapeKind | CustomShapeKind;

export const SHAPE_KIND_LABELS: Readonly<Record<BuiltinShapeKind, string>> = {
  page: "Page",
  section: "Section",
  rect: "Rectangle",
  ellipse: "Ellipse",
  line: "Line",
  "pen-path": "Pen Path",
};

export const SHAPE_KIND_VALUES: ReadonlySet<string> = new Set(Object.values(SHAPE_KINDS));

const CUSTOM_SHAPE_KIND_PATTERN = /^[a-z0-9-]+:[a-z0-9-]+$/;

export function isValidCustomShapeKind(value: string): boolean {
  return CUSTOM_SHAPE_KIND_PATTERN.test(value);
}

// Boundary conversion: validates candidate custom shape kind and brands it.
// Fails loudly on invalid syntax (R-006).
export function parseCustomShapeKind(value: unknown): CustomShapeKind {
  if (typeof value !== "string" || !CUSTOM_SHAPE_KIND_PATTERN.test(value)) {
    throw new Error(`parseCustomShapeKind: invalid custom shape kind: ${JSON.stringify(value)}`);
  }
  return value as CustomShapeKind;
}
