// Boundary parser: `unknown` in, typed `Document` out (R-006: parse, don't
// validate; R-044: opaque plugin data forward compatibility). Hand-rolled on
// purpose — zero runtime dependencies in the document core; Zod is re-evaluated
// only when a real external boundary demands it.
import type {
  BoundingBox,
  CustomShapeKind,
  DeviceType,
  PluginId,
  Point,
  ShapeId,
  ShapeKind,
} from "@open-draw/contracts";
import {
  DEVICE_TYPE_BY_VALUE,
  PLATFORM_BY_VALUE,
  ROOT_ID,
  SHAPE_KIND_VALUES,
  isRootId,
  isValidCustomShapeKind,
  isValidPluginId,
  parseShapeId,
} from "@open-draw/contracts";
import type { Document } from "./document";
import { SCHEMA_VERSION, createDocument } from "./document";
import { DocumentError } from "./errors";
import type { CustomShape, SectionDirection, SemanticTag, Shape, ShapeMeta } from "./shape";
import { SECTION_DIRECTIONS } from "./shape";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parsePoint(value: unknown, context: string): Point {
  if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    throw new DocumentError("invalidShape", `${context} must be { x, y } with finite numbers`);
  }
  return { x: value.x, y: value.y };
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

  // R-044: Validate pluginData envelope (PluginId syntax), but treat contents as opaque
  let pluginData: Record<PluginId, unknown> | undefined;
  if (value.pluginData !== undefined) {
    if (!isRecord(value.pluginData)) {
      throw new DocumentError("invalidMeta", "meta.pluginData must be an object");
    }
    pluginData = {};
    for (const [key, pluginVal] of Object.entries(value.pluginData)) {
      if (!isValidPluginId(key)) {
        throw new DocumentError("invalidMeta", `invalid plugin id in meta.pluginData: ${key}`);
      }
      pluginData[key as PluginId] = pluginVal;
    }
  }

  // Cast is safe here: every field was validated above; internal code trusts
  // the type from here on (R-006).
  return {
    ...(semantic === undefined ? {} : { semantic }),
    order,
    ...(hiddenOn === undefined ? {} : { hiddenOn }),
    ...(pluginData === undefined ? {} : { pluginData }),
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
  if (typeof value.kind !== "string") {
    throw new DocumentError("invalidShape", `kind must be a string: ${String(value.kind)}`);
  }

  let kind: ShapeKind;
  if (SHAPE_KIND_VALUES.has(value.kind)) {
    kind = value.kind as ShapeKind;
  } else if (isValidCustomShapeKind(value.kind)) {
    kind = value.kind as CustomShapeKind;
  } else {
    throw new DocumentError("invalidShape", `unknown kind on shape: ${value.kind}`);
  }

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
  if (kind === "line") {
    const start = parsePoint(value.start, "line start");
    const end = parsePoint(value.end, "line end");
    return { ...base, kind, start, end } as Shape;
  }
  if (kind === "pen-path") {
    if (!Array.isArray(value.points)) {
      throw new DocumentError("invalidShape", "pen-path points must be an array");
    }
    const points = value.points.map((pt, i) => parsePoint(pt, `pen-path point[${i}]`));
    return { ...base, kind, points } as Shape;
  }
  if (typeof kind === "string" && !SHAPE_KIND_VALUES.has(kind)) {
    // Custom shape: preserve any extra non-base properties
    const extra: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (
        k !== "id" &&
        k !== "kind" &&
        k !== "parent" &&
        k !== "boundingBox" &&
        k !== "label" &&
        k !== "meta"
      ) {
        extra[k] = v;
      }
    }
    const custom: CustomShape = {
      ...base,
      kind: kind as CustomShapeKind,
      ...(Object.keys(extra).length > 0 ? { customData: extra } : {}),
    };
    return custom;
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
