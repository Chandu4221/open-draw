// Pure JSON export projection with machine-readable shape parity (Milestone 11A A1-A6).
// Pure Document → string projection, zero side effects (R-008, R-016).
// Derives chipId, explicit shapeOrder, and semantics registry fingerprint at export time (R-025, R-041, R-042).
import {
  isRootId,
  PLATFORMS,
  ROOT_ROLES,
  SHAPE_KINDS,
  STYLE_PROFILES,
  type ShapeId,
} from "@open-draw/contracts";
import {
  isCustomShape,
  shapeListInOrder,
  type Document,
  type LineShape,
  type PenPathShape,
} from "@open-draw/document";
import { SEMANTICS_REGISTRY_VERSION } from "@open-draw/semantics";
import { compileAiDirectives } from "./ai-directives";
import { formatChipId } from "./chip-id";
import type { JsonExportOptions } from "./types";

export interface ExportedJsonDocument {
  readonly schema: {
    readonly version: number;
  };
  readonly semantics: {
    readonly version: number;
  };
  readonly shapeOrder: readonly ShapeId[];
  readonly aiGuidance?: {
    readonly directives: readonly string[];
  };
  readonly shapes: Readonly<Record<string, unknown>>;
}

/**
 * Pins a coordinate or dimension to 2 decimal places and asserts it is finite (D2).
 */
export function roundCoordinate(n: number, context = "coordinate"): number {
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid non-finite number in ${context}: ${n}`);
  }
  return Math.round(n * 100) / 100;
}

/**
 * Pure function projecting an OpenDraw document into machine-readable, AI-ready JSON.
 * Deterministic and byte-stable (R-016, R-025, R-041).
 */
export function exportJson(doc: Document, options?: JsonExportOptions): string {
  const orderedShapes = shapeListInOrder(doc);
  const shapeOrder: ShapeId[] = [];
  const shapesOutput: Record<string, unknown> = {};

  for (const shape of orderedShapes) {
    if (isRootId(shape.id)) {
      continue;
    }

    shapeOrder.push(shape.id);

    const shapeRecord: Record<string, unknown> = {
      id: shape.id,
      chipId: formatChipId(shape.id),
      kind: shape.kind,
      parentId: shape.parentId,
      boundingBox: {
        x: roundCoordinate(shape.boundingBox.x, `shape ${shape.id} boundingBox.x`),
        y: roundCoordinate(shape.boundingBox.y, `shape ${shape.id} boundingBox.y`),
        width: roundCoordinate(shape.boundingBox.width, `shape ${shape.id} boundingBox.width`),
        height: roundCoordinate(shape.boundingBox.height, `shape ${shape.id} boundingBox.height`),
      },
    };

    if (shape.label !== undefined) {
      shapeRecord.label = shape.label;
    }
    if (shape.content !== undefined) {
      shapeRecord.content = shape.content;
    }

    // A1: Computed style fields where shape carries them
    if (shape.fill !== undefined) {
      shapeRecord.fill = shape.fill;
    }
    if (shape.stroke !== undefined) {
      shapeRecord.stroke = shape.stroke;
    }
    if (shape.strokeWidth !== undefined) {
      shapeRecord.strokeWidth = roundCoordinate(shape.strokeWidth, `shape ${shape.id} strokeWidth`);
    }

    if (isCustomShape(shape)) {
      if (shape.customData !== undefined) {
        for (const [k, v] of Object.entries(shape.customData)) {
          shapeRecord[k] = v;
        }
      }
    } else {
      switch (shape.kind) {
        case SHAPE_KINDS.page:
        case SHAPE_KINDS.rect:
        case SHAPE_KINDS.ellipse:
        case SHAPE_KINDS.text:
          break;
        case SHAPE_KINDS.section:
          shapeRecord.direction = shape.direction;
          break;
        case SHAPE_KINDS.line: {
          const line = shape as LineShape;
          shapeRecord.start = {
            x: roundCoordinate(line.start.x, `shape ${shape.id} line.start.x`),
            y: roundCoordinate(line.start.y, `shape ${shape.id} line.start.y`),
          };
          shapeRecord.end = {
            x: roundCoordinate(line.end.x, `shape ${shape.id} line.end.x`),
            y: roundCoordinate(line.end.y, `shape ${shape.id} line.end.y`),
          };
          break;
        }
        case SHAPE_KINDS.penPath: {
          const pen = shape as PenPathShape;
          shapeRecord.points = pen.points.map((p, idx) => ({
            x: roundCoordinate(p.x, `shape ${shape.id} penPath.point[${idx}].x`),
            y: roundCoordinate(p.y, `shape ${shape.id} penPath.point[${idx}].y`),
          }));
          break;
        }
      }
    }

    const meta: Record<string, unknown> = {};

    // A4: Explicit semantic: null for untagged shapes
    if (shape.meta.semantic !== undefined) {
      const semantic: Record<string, unknown> = {
        id: shape.meta.semantic.id,
        platform: PLATFORMS[shape.meta.semantic.platform] ?? shape.meta.semantic.platform,
      };
      if (shape.meta.semantic.properties !== undefined) {
        semantic.properties = shape.meta.semantic.properties;
      }
      meta.semantic = semantic;
    } else {
      meta.semantic = null;
    }

    if (shape.meta.platform !== undefined) {
      meta.platform = PLATFORMS[shape.meta.platform] ?? shape.meta.platform;
    }
    if (shape.meta.style !== undefined) {
      meta.style = STYLE_PROFILES[shape.meta.style] ?? shape.meta.style;
    }
    if (shape.meta.role !== undefined) {
      meta.role = ROOT_ROLES[shape.meta.role] ?? shape.meta.role;
    }
    if (shape.meta.theme !== undefined) {
      meta.theme = shape.meta.theme;
    }
    if (shape.meta.darkMode !== undefined) {
      meta.darkMode = shape.meta.darkMode;
    }
    if (shape.meta.hiddenOn !== undefined && shape.meta.hiddenOn.length > 0) {
      meta.hiddenOn = shape.meta.hiddenOn;
    }
    // A3: Empty order: {} is omitted from export
    if (shape.meta.order !== undefined && Object.keys(shape.meta.order).length > 0) {
      meta.order = shape.meta.order;
    }
    if (shape.meta.pluginData !== undefined) {
      meta.pluginData = shape.meta.pluginData;
    }

    shapeRecord.meta = meta;
    shapesOutput[shape.id] = shapeRecord;
  }

  const output: Record<string, unknown> = {
    schema: {
      version: doc.schema.version,
    },
    semantics: {
      version: SEMANTICS_REGISTRY_VERSION,
    },
    shapeOrder,
  };

  if (options?.creativityLevel !== undefined || options?.includeAiDirectives === true) {
    const directives = compileAiDirectives(doc, options);
    if (directives.length > 0) {
      output.aiGuidance = { directives };
    }
  }

  output.shapes = shapesOutput;

  return JSON.stringify(output, null, 2);
}
