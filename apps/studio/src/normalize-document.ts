import {
  isRootId,
  SHAPE_KINDS,
  type Document,
  type Shape,
  type ShapeId,
  type ShapeMeta,
} from "@open-draw/canvas";
import {
  getShapeSemantic,
  isContainerSemantic,
  isLeafComponentSemantic,
  PLUGIN_ROOT_PLATFORM,
  PLUGIN_ROOT_ROLE,
  resolveRootPlatform,
} from "@open-draw/semantics";

export const ROOT_CONTAINER_KINDS: ReadonlySet<string> = new Set([
  SHAPE_KINDS.page,
  SHAPE_KINDS.section,
  SHAPE_KINDS.rect,
]);

function withoutIsContainer(meta: ShapeMeta): ShapeMeta {
  if (meta.isContainer === undefined) return meta;
  const next = { ...meta };
  delete next.isContainer;
  return next;
}

/**
 * Normalizes a Studio document to support N-level deep parenting and reparenting across platforms.
 *
 * Rules:
 * 1. Platform Agnostic / NONE:
 *    Parenting is ignored; plain rectangles and nested shapes do not act as automatic containers.
 * 2. Active Platform Profiles (web, ios, android-native, flutter):
 *    Parenting applies across all N levels deep.
 *    - Root platform screens are marked `meta.isContainer: true`.
 *    - Nested section-scoped shapes (e.g. Hero Section, Navigation Bar, Card, Sheet, etc.) and
 *      unclassified rectangles inside the platform screen are marked `meta.isContainer: true`.
 *    - Atomic leaf components (button, input, switch, slider, chip, text, lines) do not act as containers.
 */
export function normalizeStudioDocument(doc: Document): Document {
  let modified = false;
  const nextShapes: Record<ShapeId, Shape> = { ...doc.shapes };

  // Pre-calculate child counts for O(1) checks
  const childCounts = new Map<ShapeId, number>();
  for (const s of Object.values(doc.shapes)) {
    childCounts.set(s.parentId, (childCounts.get(s.parentId) ?? 0) + 1);
  }

  for (const shape of Object.values(doc.shapes)) {
    const rootPlatform = resolveRootPlatform(doc, shape.id);
    const hasActivePlatform = rootPlatform !== undefined;

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
    } else {
      // Nested shape (depth >= 2)
      if (!hasActivePlatform) {
        // Platform is NONE / Agnostic; strip automatic container flag from nested shapes without children
        if (shape.meta.isContainer === true && (childCounts.get(shape.id) ?? 0) === 0) {
          nextShapes[shape.id] = {
            ...shape,
            meta: withoutIsContainer(shape.meta),
          };
          modified = true;
        }
        continue;
      }

      // Inside an active platform screen:
      if (
        shape.kind === SHAPE_KINDS.line ||
        shape.kind === SHAPE_KINDS.penPath ||
        shape.kind === SHAPE_KINDS.text
      ) {
        // Open strokes and text are never containers
        if (shape.meta.isContainer === true) {
          nextShapes[shape.id] = {
            ...shape,
            meta: withoutIsContainer(shape.meta),
          };
          modified = true;
        }
        continue;
      }

      const semantic = getShapeSemantic(shape);
      const isExplicitContainer =
        shape.kind === SHAPE_KINDS.page ||
        shape.kind === SHAPE_KINDS.section ||
        (semantic !== undefined && isContainerSemantic(semantic));

      const isExplicitLeaf = semantic !== undefined && isLeafComponentSemantic(semantic);

      if (isExplicitContainer) {
        if (shape.meta.isContainer !== true) {
          nextShapes[shape.id] = {
            ...shape,
            meta: {
              ...shape.meta,
              isContainer: true,
            },
          };
          modified = true;
        }
      } else if (isExplicitLeaf) {
        if (shape.meta.isContainer === true && (childCounts.get(shape.id) ?? 0) === 0) {
          nextShapes[shape.id] = {
            ...shape,
            meta: withoutIsContainer(shape.meta),
          };
          modified = true;
        }
      } else if (shape.kind === SHAPE_KINDS.rect) {
        // Unclassified wireframe rectangle inside a platform screen
        if (shape.meta.isContainer !== true) {
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
  }

  return modified ? { ...doc, shapes: nextShapes } : doc;
}
