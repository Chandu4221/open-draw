// Resize handles: transient presentation affordances (R-031 — overlays are
// presentation state only, never stored). Four corners this milestone.
export const HANDLES = {
  nw: "nw",
  ne: "ne",
  se: "se",
  sw: "sw",
} as const;

export type HandleId = keyof typeof HANDLES;
