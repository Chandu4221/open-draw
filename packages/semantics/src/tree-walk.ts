// Hierarchical semantic tree walk (ADR-0004 Context, Scope note).
// Preorder hierarchical traversal: root page -> sections -> contents.
// Provides the pure traversal seam consumed by future Markdown exporters.
import type { DeviceType, PlatformProfile, SemanticConflict, ShapeId } from "@open-draw/contracts";
import { childrenOf, type Document, type Shape } from "@open-draw/document";
import { computeSemanticConflict } from "./compute-conflict";
import { resolveShapeDisplayName } from "./display-name";
import { resolveSemantic, type ResolvedSemantic } from "./resolve-semantic";

export interface SemanticTreeNode {
  readonly shape: Shape;
  readonly depth: number;
  readonly displayName: string;
  readonly semantic?: ResolvedSemantic;
  readonly conflict?: SemanticConflict;
}

/**
 * Pure hierarchical preorder walk of a document from a root shape.
 */
export function walkSemanticTree(
  doc: Document,
  rootId: ShapeId,
  profile?: PlatformProfile,
  deviceType?: DeviceType,
): readonly SemanticTreeNode[] {
  const rootShape = doc.shapes[rootId];
  if (rootShape === undefined) {
    return [];
  }

  const nodes: SemanticTreeNode[] = [];

  function visit(shape: Shape, depth: number): void {
    const semantic = resolveSemantic(profile, shape.meta.semantic);
    const conflict = computeSemanticConflict(doc, shape, profile);
    const displayName = resolveShapeDisplayName(shape, profile);

    nodes.push({
      shape,
      depth,
      displayName,
      ...(semantic !== undefined ? { semantic } : {}),
      ...(conflict !== undefined ? { conflict } : {}),
    });

    const children = [...childrenOf(doc, shape.id)];
    if (children.length === 0) {
      return;
    }

    // If deviceType is provided, sort by responsive order (absent = 0)
    if (deviceType !== undefined) {
      children.sort((a, b) => {
        const orderA = a.meta.order[deviceType] ?? 0;
        const orderB = b.meta.order[deviceType] ?? 0;
        return orderA - orderB;
      });
    }

    for (const child of children) {
      visit(child, depth + 1);
    }
  }

  visit(rootShape, 0);
  return nodes;
}
