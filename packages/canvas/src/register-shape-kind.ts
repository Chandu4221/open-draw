// Shape kind registration seam (ADR-0003 D1, D2, R-006, R-008).
// Allows runtime shape registration and capability lookup without stringly logic.
import type { BoundingBox, CapabilityId, Point } from "@open-draw/contracts";
import { CAPABILITY_VALUES } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";

export type ShapeHitTester = (box: BoundingBox, shape: Shape, worldPoint: Point) => boolean;

export interface ShapeKindRegistration {
  readonly kind: string;
  readonly capabilities: readonly CapabilityId[];
  readonly hitTest?: ShapeHitTester;
}

export interface ShapeKindRegistry {
  readonly registrations: Readonly<Record<string, ShapeKindRegistration>>;
  has(kind: string): boolean;
  hasCapability(kind: string, capability: CapabilityId): boolean;
  get(kind: string): ShapeKindRegistration | undefined;
}

export function validateRegistration(registration: ShapeKindRegistration): void {
  if (typeof registration.kind !== "string" || registration.kind.trim() === "") {
    throw new Error("shape kind must be a non-empty string");
  }
  if (!Array.isArray(registration.capabilities)) {
    throw new Error("shape capabilities must be an array");
  }
  for (const capability of registration.capabilities) {
    if (!CAPABILITY_VALUES.has(capability)) {
      throw new Error(`unknown capability: ${capability}`);
    }
  }
}

export function createShapeKindRegistry(
  initial: readonly ShapeKindRegistration[] = [],
): ShapeKindRegistry {
  const map: Record<string, ShapeKindRegistration> = {};

  for (const reg of initial) {
    validateRegistration(reg);
    if (map[reg.kind] !== undefined) {
      throw new Error(`duplicate shape kind registration: ${reg.kind}`);
    }
    map[reg.kind] = reg;
  }

  return {
    registrations: map,
    has: (kind) => map[kind] !== undefined,
    hasCapability: (kind, capability) => {
      const reg = map[kind];
      return reg !== undefined && reg.capabilities.includes(capability);
    },
    get: (kind) => map[kind],
  };
}

export function registerShapeKind(
  registry: ShapeKindRegistry,
  registration: ShapeKindRegistration,
): ShapeKindRegistry {
  validateRegistration(registration);
  if (registry.has(registration.kind)) {
    throw new Error(`duplicate shape kind registration: ${registration.kind}`);
  }
  return createShapeKindRegistry([...Object.values(registry.registrations), registration]);
}
