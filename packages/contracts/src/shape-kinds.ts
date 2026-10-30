// Closed registry of shape kinds (R-005, ADR-0002 D3). One canonical list;
// `SHAPE_KIND_LABELS` lives in the same module so display names never drift
// from the kinds they label.
//
// kind vs semantic: `kind` answers "how does this behave STRUCTURALLY?"
// (container that owns a coordinate space and reflows children: page,
// section — vs leaf content: rect, ellipse). `semantic` in meta answers
// "what does it MEAN on the active platform?" (NAVBAR, CARD, TOPAPPBAR…,
// from the platform profile data module; absent = NONE, R-024). The web
// profile's PAGE/SECTION vocabulary maps onto these structural kinds —
// the same way a rect keeps its intrinsic identity while meaning "card".
export const SHAPE_KINDS = {
  page: "page",
  section: "section",
  rect: "rect",
  ellipse: "ellipse",
} as const;

export type ShapeKind = keyof typeof SHAPE_KINDS;

export const SHAPE_KIND_LABELS: Readonly<Record<ShapeKind, string>> = {
  page: "Page",
  section: "Section",
  rect: "Rectangle",
  ellipse: "Ellipse",
};

export const SHAPE_KIND_VALUES: ReadonlySet<string> = new Set(Object.values(SHAPE_KINDS));
