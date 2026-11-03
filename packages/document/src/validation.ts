// Boundary parser: `unknown` in, typed `Document` out (R-006: parse, don't
// validate; R-044: opaque plugin data forward compatibility). Hand-rolled on
// purpose — zero runtime dependencies in the document core; Zod is re-evaluated
// only when a real external boundary demands it.
import type { BoundingBox, CustomShapeKind, Point, ShapeId, ShapeKind } from "@open-draw/contracts";
import {
  ROOT_ID,
  SHAPE_KINDS,
  SHAPE_KIND_VALUES,
  isRootId,
  isValidCustomShapeKind,
  parseShapeId,
} from "@open-draw/contracts";
import type { Document } from "./document";
import { SCHEMA_VERSION, createDocument } from "./document";
import { DocumentError } from "./errors";
import {
  BASE_SHAPE_KEY_SET,
  SECTION_DIRECTIONS,
  type CustomShape,
  type SectionDirection,
  type Shape,
} from "./shape";
import { parseMeta } from "./meta-validation";
import { validateDocumentDepth } from "./depth-validation";

export { validateDocumentDepth } from "./depth-validation";
export { parseMeta, parseSemantic, parseDeviceType } from "./meta-validation";

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

function parseSectionDirection(value: unknown): SectionDirection {
  if (
    typeof value !== "string" ||
    (value !== SECTION_DIRECTIONS.row && value !== SECTION_DIRECTIONS.column)
  ) {
    throw new DocumentError("invalidShape", `invalid section direction: ${JSON.stringify(value)}`);
  }
  return value;
}

function parseKind(value: unknown): ShapeKind {
  if (typeof value !== "string") {
    throw new DocumentError("invalidShape", "shape kind must be a string");
  }
  if (SHAPE_KIND_VALUES.has(value)) {
    return value as ShapeKind;
  }
  if (isValidCustomShapeKind(value)) {
    return value as CustomShapeKind;
  }
  throw new DocumentError("invalidShape", `unrecognized shape kind: ${value}`);
}

function parseParentId(value: unknown): ShapeId | typeof ROOT_ID {
  if (typeof value !== "string") {
    throw new DocumentError("invalidShape", "parent must be a string");
  }
  if (value === ROOT_ID) {
    return ROOT_ID;
  }
  try {
    return parseShapeId(value);
  } catch (err) {
    throw new DocumentError(
      "invalidShape",
      `parent is not a valid shape id: ${(err as Error).message}`,
    );
  }
}

const COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function parseColor(value: unknown, fieldName: string): string {
  if (
    typeof value !== "string" ||
    (value !== "none" && value !== "transparent" && !COLOR_REGEX.test(value))
  ) {
    throw new DocumentError(
      "invalidShape",
      `${fieldName} must be a valid hex color string or "none"/"transparent"`,
    );
  }
  return value;
}

function parseStrokeWidth(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new DocumentError("invalidShape", "strokeWidth must be a non-negative finite number");
  }
  return value;
}

function parseShape(value: unknown): Shape {
  if (!isRecord(value)) {
    throw new DocumentError("invalidShape", "shape must be an object");
  }
  if (typeof value.id !== "string") {
    throw new DocumentError("invalidShape", "shape id must be a string");
  }
  let id: ShapeId;
  try {
    id = parseShapeId(value.id);
  } catch (err) {
    throw new DocumentError("invalidShape", `shape id is invalid: ${(err as Error).message}`);
  }
  const kind = parseKind(value.kind);
  const parent = parseParentId(value.parent);
  const boundingBox = parseBoundingBox(value.boundingBox);
  if (value.label !== undefined && typeof value.label !== "string") {
    throw new DocumentError("invalidShape", "label must be a string when present");
  }
  if (value.content !== undefined && typeof value.content !== "string") {
    throw new DocumentError("invalidShape", "content must be a string when present");
  }
  let fill: string | undefined;
  if (value.fill !== undefined) {
    fill = parseColor(value.fill, "fill");
  }
  let stroke: string | undefined;
  if (value.stroke !== undefined) {
    stroke = parseColor(value.stroke, "stroke");
  }
  let strokeWidth: number | undefined;
  if (value.strokeWidth !== undefined) {
    strokeWidth = parseStrokeWidth(value.strokeWidth);
  }
  const isRootShape = isRootId(parent);
  const meta = parseMeta(value.meta, isRootShape);
  const base = {
    id,
    kind,
    parent,
    boundingBox,
    ...(value.label === undefined ? {} : { label: value.label }),
    ...(value.content === undefined ? {} : { content: value.content }),
    ...(fill === undefined ? {} : { fill }),
    ...(stroke === undefined ? {} : { stroke }),
    ...(strokeWidth === undefined ? {} : { strokeWidth }),
    meta,
  };

  // Validated cast at the boundary: kind membership was checked above and the
  // kind-specific fields are checked right here.
  if (kind === SHAPE_KINDS.section) {
    return { ...base, kind, direction: parseSectionDirection(value.direction) } as Shape;
  }
  if (kind === SHAPE_KINDS.line) {
    const start = parsePoint(value.start, "line start");
    const end = parsePoint(value.end, "line end");
    return { ...base, kind, start, end } as Shape;
  }
  if (kind === SHAPE_KINDS.penPath) {
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
      if (!BASE_SHAPE_KEY_SET.has(k)) {
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

  // Pre-validate document depth before expensive per-shape parsing (Ruling V1, R-006)
  validateDocumentDepth(input.shapes);

  const shapes: Shape[] = [];
  for (const [key, entry] of Object.entries(input.shapes)) {
    const shape = parseShape(entry);
    if (shape.id !== key) {
      throw new DocumentError("invalidShape", `record key must match shape id: ${key}`);
    }
    shapes.push(shape);
  }
  return createDocument(shapes);
}
