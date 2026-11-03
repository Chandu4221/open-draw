// Resize handles: transient presentation affordances (R-031 — overlays are
// presentation state only, never stored; ADR-0006 Option A).
// Four corner handles and four edge midpoint handles.
export const HANDLES = {
  nw: "nw",
  n: "n",
  ne: "ne",
  e: "e",
  se: "se",
  s: "s",
  sw: "sw",
  w: "w",
} as const;

export type HandleId = keyof typeof HANDLES;
