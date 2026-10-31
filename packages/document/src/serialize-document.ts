// Pure document serializer (R-008, R-014, R-041). Emits version-only schema
// without timestamps. Sibling z-order is preserved by maintaining map
// iteration order. ROOT_ID is strictly excluded.
import { isRootId } from "@open-draw/contracts";
import type { Document } from "./document";

export interface SerializedDocument {
  readonly schema: {
    readonly version: number;
  };
  readonly shapes: Record<string, unknown>;
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

    if (shape.kind === "section") {
      shapeRecord.direction = shape.direction;
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
