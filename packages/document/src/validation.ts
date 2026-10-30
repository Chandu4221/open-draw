// Boundary parser: `unknown` in, typed `Document` out (R-006: parse, don't
// validate). Hand-rolled on purpose — zero runtime dependencies in the
// document core; Zod is re-evaluated only when a real external boundary
// demands it.
import type { BoundingBox, DeviceType, ShapeId, ShapeKind } from "@open-draw/contracts";
import {
  DEVICE_TYPE_BY_VALUE,
  PLATFORM_BY_VALUE,
  ROOT_ID,
  SHAPE_KIND_VALUES,
  isRootId,
  parseShapeId,
} from "@open-draw/contracts";
import type { Document } from "./document";
import { SCHEMA_VERSION, createDocument } from "./document";
import { DocumentError } from "./errors";
import type { SectionDirection, SemanticTag, Shape, ShapeMeta } from "./shape";
import { SECTION_DIRECTIONS } from "./shape";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseBoundingBox(value: unknown): BoundingBox {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y) ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height)
  ) {
    throw new DocumentError(
      "invalidShape",
      "boundingBox must be { x, y, width, height } with finite numbers",
    );
  }
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

function parseDeviceType(value: unknown): DeviceType {
  if (typeof value !== "string") {
    throw new DocumentError(
      "invalidMeta",
      `device type must be a string: ${JSON.stringify(value)}`,
    );
  }
  const deviceType = DEVICE_TYPE_BY_VALUE[value];
  if (deviceType === undefined) {
    throw new DocumentError("invalidMeta", `unknown device type: ${value}`);
  }
  return deviceType;
}

function parseSemantic(value: unknown): SemanticTag {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.platform !== "string") {
    throw new DocumentError("invalidMeta", "semantic must be { id, platform } with strings");
  }
  const platform = PLATFORM_BY_VALUE[value.platform];
  if (platform === undefined) {
    throw new DocumentError("invalidMeta", `unknown platform: ${value.platform}`);
  }
  return { id: value.id, platform };
}

function parseMeta(value: unknown): ShapeMeta {
  if (!isRecord(value)) {
    throw new DocumentError("invalidMeta", "meta must be an object");
  }
  const order: Partial<Record<DeviceType, number>> = {};
  if (value.order !== undefined) {
    if (!isRecord(value.order)) {
      throw new DocumentError("invalidMeta", "meta.order must be an object");
    }
    for (const [serialized, orderValue] of Object.entries(value.order)) {
      const deviceType = parseDeviceType(serialized);
      if (!isFiniteNumber(orderValue)) {
        throw new DocumentError("invalidMeta", `order for ${serialized} must be a number`);
      }
      order[deviceType] = orderValue;
    }
  }
  let hiddenOn: readonly DeviceType[] | undefined;
  if (value.hiddenOn !== undefined) {
    if (!Array.isArray(value.hiddenOn)) {
      throw new DocumentError("invalidMeta", "meta.hiddenOn must be an array");
    }
    hiddenOn = value.hiddenOn.map(parseDeviceType);
  }
  const semantic = value.semantic === undefined ? undefined : parseSemantic(value.semantic);
  // Cast is safe here: every field was validated above; internal code trusts
  // the type from here on (R-006).
  return {
    ...(semantic === undefined ? {} : { semantic }),
    order,
    ...(hiddenOn === undefined ? {} : { hiddenOn }),
  };
}

function parseSectionDirection(value: unknown): SectionDirection {
  if (
    typeof value !== "string" ||
    (value !== SECTION_DIRECTIONS.row && value !== SECTION_DIRECTIONS.column)
  ) {
    throw new DocumentError("invalidShape", "section direction must be row or column");
  }
  return value === SECTION_DIRECTIONS.row ? SECTION_DIRECTIONS.row : SECTION_DIRECTIONS.column;
}

function parseShape(value: unknown): Shape {
  if (!isRecord(value)) {
    throw new DocumentError("invalidShape", "a shape must be an object");
  }
  const id = parseShapeId(value.id);
  if (typeof value.kind !== "string" || !SHAPE_KIND_VALUES.has(value.kind)) {
    throw new DocumentError("invalidShape", `unknown kind on shape: ${String(value.kind)}`);
  }
  const kind = value.kind as ShapeKind;
  if (value.parent === undefined) {
    throw new DocumentError("invalidShape", "parent must be present (virtual root, no nulls)");
  }
  const parent: ShapeId = value.parent === ROOT_ID ? ROOT_ID : parseShapeId(value.parent);
  const boundingBox = parseBoundingBox(value.boundingBox);
  if (value.label !== undefined && typeof value.label !== "string") {
    throw new DocumentError("invalidShape", "label must be a string when present");
  }
  const meta = parseMeta(value.meta);
  const base = {
    id,
    kind,
    parent,
    boundingBox,
    ...(value.label === undefined ? {} : { label: value.label }),
    meta,
  };
  // Validated cast at the boundary: kind membership was checked above and the
  // kind-specific fields are checked right here.
  if (kind === "section") {
    return { ...base, kind, direction: parseSectionDirection(value.direction) } as Shape;
  }
  return base as Shape;
}

export function parseDocument(input: unknown): Document {
  if (!isRecord(input)) {
    throw new DocumentError("invalidDocument", "a document must be an object");
  }
  if (!isRecord(input.schema) || input.schema.version !== SCHEMA_VERSION) {
    throw new DocumentError("invalidSchema", `expected schema version ${SCHEMA_VERSION}`);
  }
  if (!isRecord(input.shapes)) {
    throw new DocumentError("invalidDocument", "shapes must be a record keyed by shape id");
  }
  const shapes: Shape[] = [];
  for (const [key, entry] of Object.entries(input.shapes)) {
    const shape = parseShape(entry);
    if (shape.id !== key) {
      throw new DocumentError("invalidShape", `record key must match shape id: ${key}`);
    }
    if (isRootId(shape.parent) && shape.kind !== "page") {
      throw new DocumentError("invalidShape", `root children must be pages: ${shape.id}`);
    }
    shapes.push(shape);
  }
  return createDocument(shapes);
}
