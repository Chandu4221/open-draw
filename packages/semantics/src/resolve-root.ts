// Root resolution for platform and design style (R-026, ADR-0004 D7).
// Platform and style are properties of root shapes only; children
// inherit both by tree position and never store either.
import {
  type PlatformId,
  type ShapeId,
  type StyleId,
  isRootId,
  STYLE_PROFILES,
} from "@open-draw/contracts";
import type { Document, Shape } from "@open-draw/document";

/**
 * Resolves the root shape ancestor (immediate child of ROOT_ID) for any shape in the document (R-026).
 * If the shape itself is an immediate child of ROOT_ID, returns it.
 */
export function resolveRootShape(doc: Document, shapeId: ShapeId): Shape | undefined {
  let currentId: ShapeId | undefined = shapeId;
  const visited = new Set<ShapeId>();

  while (currentId !== undefined && !isRootId(currentId)) {
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);
    const shape: Shape | undefined = doc.shapes[currentId];
    if (shape === undefined) {
      break;
    }
    if (isRootId(shape.parent)) {
      return shape;
    }
    currentId = shape.parent;
  }
  return undefined;
}

/**
 * Resolves the root page ancestor for any shape in the document.
 * Backward-compatible helper for legacy page-kind roots.
 */
export function resolveRootPage(doc: Document, shapeId: ShapeId): Shape | undefined {
  return resolveRootShape(doc, shapeId);
}

/**
 * Resolves the effective platform for a shape from its root ancestor (R-026, Ruling 10).
 * Returns undefined if no root shape is found or if the root shape has no explicit platform (Platform-Agnostic Mode).
 */
export function resolveRootPlatform(doc: Document, shapeId: ShapeId): PlatformId | undefined {
  const root = resolveRootShape(doc, shapeId);
  return root?.meta.platform;
}

/**
 * Resolves the effective design style for a shape from its root ancestor (R-026).
 * Defaults to "minimal" if no root shape is found or if root has no explicit style.
 */
export function resolveRootStyle(doc: Document, shapeId: ShapeId): StyleId {
  const root = resolveRootShape(doc, shapeId);
  return root?.meta.style ?? STYLE_PROFILES.minimal;
}
