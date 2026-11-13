// Root resolution for platform and design style (R-026, ADR-0004 D7).
// Platform and style are properties of root shapes only; children
// inherit both by tree position and never store either.
import type { Document, Shape, ShapeId } from "@open-draw/canvas";
import { isRootId } from "@open-draw/canvas";
import type { DesignStyleId, PlatformId, StyleId, ThemePalette } from "@open-draw/profiles";
import { STYLE_PROFILES } from "@open-draw/profiles";
import { ROOT_ROLES, type RootRole } from "./root-roles";

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
    if (isRootId(shape.parentId)) {
      return shape;
    }
    currentId = shape.parentId;
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

/**
 * Resolves the effective design style (for AI / dev mockup handoff) from its root ancestor (R-024, R-026).
 * In platform-agnostic mode (root.meta.platform is undefined), returns undefined.
 * Otherwise returns root.meta.designStyle.
 */
export function resolveRootDesignStyle(doc: Document, shapeId: ShapeId): DesignStyleId | undefined {
  const root = resolveRootShape(doc, shapeId);
  if (root?.meta.platform === undefined) {
    return undefined;
  }
  return root.meta.designStyle;
}

/**
 * Resolves the root role (screen vs component) from its root ancestor (R-024, R-026).
 * Defaults to "screen" if no root shape is found or if root has no explicit role.
 */
export function resolveRootRole(doc: Document, shapeId: ShapeId): RootRole {
  const root = resolveRootShape(doc, shapeId);
  return root?.meta.role ?? ROOT_ROLES.screen;
}

/**
 * Resolves the root theme palette from its root ancestor (Idea 6, R-026).
 * Returns undefined if no theme is defined.
 */
export function resolveRootTheme(doc: Document, shapeId: ShapeId): ThemePalette | undefined {
  const root = resolveRootShape(doc, shapeId);
  return root?.meta.theme;
}

/**
 * Resolves whether dark mode is enabled from its root ancestor (Idea 4, R-026).
 * Defaults to false if no root shape is found or if root has no explicit darkMode.
 */
export function resolveRootDarkMode(doc: Document, shapeId: ShapeId): boolean {
  const root = resolveRootShape(doc, shapeId);
  return root?.meta.darkMode ?? false;
}
