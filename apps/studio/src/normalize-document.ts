import { isRootId, SHAPE_KINDS, type Document, type Shape, type ShapeId } from "@open-draw/canvas";
import { PLUGIN_ROOT_PLATFORM, PLUGIN_ROOT_ROLE } from "@open-draw/semantics";

export const ROOT_CONTAINER_KINDS: ReadonlySet<string> = new Set([
  SHAPE_KINDS.page,
  SHAPE_KINDS.section,
  SHAPE_KINDS.rect,
]);

/**
 * Normalizes a Studio document so that all root container shapes (immediate children of ROOT_ID
 * with kind in ROOT_CONTAINER_KINDS or holding platform/role metadata) have `meta.isContainer: true`.
 *
 * This allows @open-draw/canvas's pure `isContainerShape` to recognize them as drop targets
 * for shape creation and drag-reparenting without polluting canvas SDK with Studio domain models.
 */
export function normalizeStudioDocument(doc: Document): Document {
  let modified = false;
  const nextShapes: Record<ShapeId, Shape> = { ...doc.shapes };

  for (const shape of Object.values(doc.shapes)) {
    if (isRootId(shape.parentId)) {
      const isContainerCandidate =
        ROOT_CONTAINER_KINDS.has(shape.kind) ||
        shape.meta.platform !== undefined ||
        shape.meta.role !== undefined ||
        Boolean(
          (shape.meta.pluginData as Record<string, unknown> | undefined)?.[PLUGIN_ROOT_PLATFORM],
        ) ||
        Boolean((shape.meta.pluginData as Record<string, unknown> | undefined)?.[PLUGIN_ROOT_ROLE]);

      if (isContainerCandidate && shape.meta.isContainer !== true) {
        nextShapes[shape.id] = {
          ...shape,
          meta: {
            ...shape.meta,
            isContainer: true,
          },
        };
        modified = true;
      }
    }
  }

  return modified ? { ...doc, shapes: nextShapes } : doc;
}
