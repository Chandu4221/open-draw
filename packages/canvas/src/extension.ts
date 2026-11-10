// Custom shape extension contract and helpers (ADR-0003, R-005, R-006, R-008).
import {
  CAPABILITY_VALUES,
  isValidCustomShapeKind,
  ROOT_ID,
  type BoundingBox,
  type CustomShapeContract,
  type ShapeId,
} from "@open-draw/contracts";
import { createCustomShape, type Shape, type ShapeInit, type ShapeMeta } from "@open-draw/document";
import type { ShapeSvgRenderer } from "@open-draw/renderer-svg";
import { CanvasError } from "./errors";
import type { ShapeHitTester } from "./register-shape-kind";

export interface CustomShapeCreateOptions {
  readonly label?: string | undefined;
  readonly content?: string | undefined;
  readonly fill?: string | undefined;
  readonly stroke?: string | undefined;
  readonly strokeWidth?: number | undefined;
  readonly parentId?: ShapeId | undefined;
  readonly meta?: Partial<ShapeMeta> | undefined;
  readonly [key: string]: unknown;
}

export interface CustomShapeExtension extends CustomShapeContract {
  readonly hitTest?: ShapeHitTester | undefined;
  readonly render: ShapeSvgRenderer;
  readonly create?: (id: ShapeId, box: BoundingBox, options?: CustomShapeCreateOptions) => Shape;
  readonly validate?: (shape: Shape) => void;
}

export function validateCustomShapeExtension(extension: CustomShapeExtension): void {
  if (
    typeof extension !== "object" ||
    extension === null ||
    typeof extension.kind !== "string" ||
    !isValidCustomShapeKind(extension.kind)
  ) {
    throw new CanvasError(
      "invalidRegistration",
      `custom shape kind must be namespaced "<scope>:<name>": ${String(extension?.kind)}`,
    );
  }
  if (typeof extension.label !== "string" || extension.label.trim() === "") {
    throw new CanvasError("invalidRegistration", "custom shape label must be a non-empty string");
  }
  if (!Array.isArray(extension.capabilities)) {
    throw new CanvasError("invalidRegistration", "custom shape capabilities must be an array");
  }
  for (const capability of extension.capabilities) {
    if (!CAPABILITY_VALUES.has(capability)) {
      throw new CanvasError("invalidCapability", `unknown capability: ${capability}`);
    }
  }
  if (typeof extension.render !== "function") {
    throw new CanvasError(
      "invalidRegistration",
      `custom shape render must be an SVG rendering function for kind: ${extension.kind}`,
    );
  }
}

export function createDefaultCustomShape(
  extension: CustomShapeExtension,
  id: ShapeId,
  box: BoundingBox,
  options?: CustomShapeCreateOptions,
): Shape {
  validateCustomShapeExtension(extension);
  if (extension.create) {
    return extension.create(id, box, options);
  }
  const init: ShapeInit = {
    parentId: options?.parentId ?? ROOT_ID,
    meta: {
      order: {},
      ...(options?.meta ?? {}),
    },
    ...(options?.label !== undefined ? { label: options.label } : {}),
    ...(options?.content !== undefined ? { content: options.content } : {}),
    ...(options?.fill !== undefined ? { fill: options.fill } : {}),
    ...(options?.stroke !== undefined ? { stroke: options.stroke } : {}),
    ...(options?.strokeWidth !== undefined ? { strokeWidth: options.strokeWidth } : {}),
  };
  return createCustomShape(id, extension.kind, box, {}, init);
}
