// Root resolution for platform and design style (R-026, ADR-0004 D7).
// Platform and style are properties of root shapes (pages) only; children
// inherit both by tree position and never store either.
import {
  type PlatformId,
  type ShapeId,
  type StyleId,
  isRootId,
  PLATFORMS,
  STYLE_PROFILES,
} from "@open-draw/contracts";
import type { Document, PageShape } from "@open-draw/document";

/**
 * Resolves the root page ancestor for any shape in the document.
 * If the shape itself is a root page, returns it.
 */
export function resolveRootPage(doc: Document, shapeId: ShapeId): PageShape | undefined {
  let currentId: ShapeId | undefined = shapeId;
  const visited = new Set<ShapeId>();

  while (currentId !== undefined && !isRootId(currentId)) {
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);
    const shape = doc.shapes[currentId];
    if (shape === undefined) {
      break;
    }
    if (isRootId(shape.parent) && shape.kind === "page") {
      return shape;
    }
    currentId = shape.parent;
  }
  return undefined;
}

/**
 * Resolves the effective platform for a shape from its root ancestor (R-026).
 * Defaults to "web" if no root page is found or if root has no explicit platform.
 */
export function resolveRootPlatform(doc: Document, shapeId: ShapeId): PlatformId {
  const root = resolveRootPage(doc, shapeId);
  return root?.meta.platform ?? PLATFORMS.web;
}

/**
 * Resolves the effective design style for a shape from its root ancestor (R-026).
 * Defaults to "minimal" if no root page is found or if root has no explicit style.
 */
export function resolveRootStyle(doc: Document, shapeId: ShapeId): StyleId {
  const root = resolveRootPage(doc, shapeId);
  return root?.meta.style ?? STYLE_PROFILES.minimal;
}
