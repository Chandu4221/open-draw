// Branded shape id — the only identity a shape ever has (R-006: parse, don't
// validate). The brand keeps ids distinct from plain strings inside the core.
export type ShapeId = string & { readonly __brand: "ShapeId" };

// Structural virtual root: a registry constant, never a record in `shapes`.
// It cannot be selected, moved, deleted, or exported as a shape (ADR-0002 D2).
export const ROOT_ID = "canvas:root" as ShapeId;

const SHAPE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

// Boundary conversion: validates a candidate id and brands it. Fails loudly —
// never a silent fallback.
export function parseShapeId(value: unknown): ShapeId {
  if (typeof value !== "string" || !SHAPE_ID_PATTERN.test(value)) {
    throw new Error(`parseShapeId: invalid shape id: ${JSON.stringify(value)}`);
  }
  return value as ShapeId;
}

export function isRootId(id: ShapeId): boolean {
  return id === ROOT_ID;
}
