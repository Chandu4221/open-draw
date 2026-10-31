// Pure document serializer (R-008, R-014, R-041, R-044). Emits version-only
// schema without timestamps. Sibling z-order is preserved by maintaining map
// iteration order. ROOT_ID is strictly excluded.
import { isRootId } from "@open-draw/contracts";
import type { Document } from "./document";
import { DocumentError } from "./errors";
import { isCustomShape } from "./shape";

export interface SerializedDocument {
  readonly schema: {
    readonly version: number;
  };
  readonly shapes: Record<string, unknown>;
}

function isJsonSerializable(value: unknown, seen = new Set<unknown>()): boolean {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return typeof value === "number" ? Number.isFinite(value) : true;
  }
  if (
    typeof value === "undefined" ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  ) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!isJsonSerializable(item, seen)) {
        return false;
      }
    }
  } else {
    for (const [, v] of Object.entries(value)) {
      if (
        typeof v === "function" ||
        typeof v === "undefined" ||
        typeof v === "symbol" ||
        typeof v === "bigint"
      ) {
        return false;
      }
      if (!isJsonSerializable(v, seen)) {
        return false;
      }
    }
  }
  seen.delete(value);
  return true;
}

export function serializeDocument(doc: Document): string {
  const shapesOutput: Record<string, unknown> = {};

  for (const [id, shape] of Object.entries(doc.shapes)) {
    if (isRootId(shape.id)) {
      continue;
    }

    const shapeRecord: Record<string, unknown> = {
      id: shape.id,
      kind: shape.kind,
      parent: shape.parent,
      boundingBox: {
        x: shape.boundingBox.x,
        y: shape.boundingBox.y,
        width: shape.boundingBox.width,
        height: shape.boundingBox.height,
      },
    };

    if (shape.label !== undefined) {
      shapeRecord.label = shape.label;
    }

    if (isCustomShape(shape)) {
      if (shape.customData !== undefined) {
        for (const [k, v] of Object.entries(shape.customData)) {
          shapeRecord[k] = v;
        }
      }
    } else {
      switch (shape.kind) {
        case "page":
        case "rect":
        case "ellipse":
          break;
        case "section":
          shapeRecord.direction = shape.direction;
          break;
        case "line":
          shapeRecord.start = { x: shape.start.x, y: shape.start.y };
          shapeRecord.end = { x: shape.end.x, y: shape.end.y };
          break;
        case "pen-path":
          shapeRecord.points = shape.points.map((p) => ({ x: p.x, y: p.y }));
          break;
      }
    }

    const meta: Record<string, unknown> = {
      order: shape.meta.order ?? {},
    };
    if (shape.meta.hiddenOn !== undefined && shape.meta.hiddenOn.length > 0) {
      meta.hiddenOn = shape.meta.hiddenOn;
    }
    if (shape.meta.semantic !== undefined) {
      meta.semantic = shape.meta.semantic;
    }
    if (shape.meta.pluginData !== undefined) {
      if (!isJsonSerializable(shape.meta.pluginData)) {
        throw new DocumentError(
          "invalidDocument",
          `meta.pluginData on shape ${shape.id} is not JSON-serializable`,
        );
      }
      meta.pluginData = shape.meta.pluginData;
    }
    shapeRecord.meta = meta;

    shapesOutput[id] = shapeRecord;
  }

  const output: SerializedDocument = {
    schema: {
      version: doc.schema.version,
    },
    shapes: shapesOutput,
  };

  return JSON.stringify(output, null, 2);
}
