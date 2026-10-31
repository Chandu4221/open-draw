// Shape capability registry (ADR-0003 D1, R-005, R-012).
// Instead of a monolithic god-interface, shape modules declare capabilities
// from this closed registry. Internal canvas code checks capabilities (e.g.
// hasCapability(shape, CAPABILITIES.movable)), keeping the core decoupled
// from concrete shape kinds.
export const CAPABILITIES = {
  resizable: "resizable",
  movable: "movable",
  textLabel: "text-label",
  freehandPath: "freehand-path",
} as const;

export type CapabilityId = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export const CAPABILITY_VALUES: ReadonlySet<string> = new Set(Object.values(CAPABILITIES));
