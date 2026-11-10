// Hierarchical semantic tree walk (ADR-0004 Context, Scope note).
// Preorder hierarchical traversal: root page -> sections -> contents.
// Provides the pure traversal seam consumed by future Markdown exporters.
import {
  isRootId,
  type DeviceType,
  type PlatformProfile,
  type SemanticConflict,
  type ShapeId,
} from "@open-draw/contracts";
import {
  buildChildIndex,
  childrenOf,
  type ChildIndex,
  type Document,
  type Shape,
} from "@open-draw/document";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { computeSemanticConflict } from "./compute-conflict";
import { resolveShapeDisplayName, resolveShapeSemanticType } from "./display-name";
import { resolveRootShape } from "./resolve-root";
import { resolveSemantic, type ResolvedSemantic } from "./resolve-semantic";

export interface SemanticTreeNode {
  readonly shape: Shape;
  readonly depth: number;
  readonly displayName: string;
  readonly semanticType?: string;
  readonly semantic?: ResolvedSemantic;
  readonly conflict?: SemanticConflict;
}

/**
 * Pure hierarchical preorder walk of a document from a root shape or the virtual canvas root (ROOT_ID).
 */
export function walkSemanticTree(
  doc: Document,
  rootId: ShapeId,
  profile?: PlatformProfile,
  deviceType?: DeviceType | Readonly<Record<ShapeId, DeviceType | undefined>>,
  childIndex?: ChildIndex,
): readonly SemanticTreeNode[] {
  const nodes: SemanticTreeNode[] = [];
  const index = childIndex ?? buildChildIndex(doc);

  function visit(
    shape: Shape,
    depth: number,
    inheritedRoot?: Shape,
    inheritedProfile?: PlatformProfile,
  ): void {
    const isRoot = isRootId(shape.parentId);
    const rootShape = isRoot ? shape : (inheritedRoot ?? resolveRootShape(doc, shape.id));
    const shapePlatform = rootShape?.meta.platform;
    const shapeProfile =
      shapePlatform !== undefined
        ? PLATFORM_PROFILES[shapePlatform]
        : (inheritedProfile ?? profile);
    const semantic = resolveSemantic(shapeProfile, shape.meta.semantic);
    const conflict = computeSemanticConflict(doc, shape, shapeProfile);
    const displayName = resolveShapeDisplayName(shape, shapeProfile);
    const semanticType = resolveShapeSemanticType(shape, shapeProfile);

    nodes.push({
      shape,
      depth,
      displayName,
      ...(semanticType !== undefined ? { semanticType } : {}),
      ...(semantic !== undefined ? { semantic } : {}),
      ...(conflict !== undefined ? { conflict } : {}),
    });

    const children = [...childrenOf(doc, shape.id, index)];
    if (children.length === 0) {
      return;
    }

    // If deviceType is provided (global or scoped to root), sort by responsive order (absent = 0)
    const activeDevice: DeviceType | undefined =
      typeof deviceType === "object" && deviceType !== null && rootShape !== undefined
        ? deviceType[rootShape.id]
        : (deviceType as DeviceType | undefined);

    if (activeDevice !== undefined) {
      children.sort((a, b) => {
        const orderA = a.meta.order?.[activeDevice] ?? 0;
        const orderB = b.meta.order?.[activeDevice] ?? 0;
        return orderA - orderB;
      });
    }

    for (const child of children) {
      visit(child, depth + 1, rootShape, shapeProfile);
    }
  }

  if (isRootId(rootId)) {
    for (const child of childrenOf(doc, rootId, index)) {
      visit(child, 0);
    }
    return nodes;
  }

  const rootShape = doc.shapes[rootId];
  if (rootShape === undefined) {
    return [];
  }

  visit(rootShape, 0);
  return nodes;
}
