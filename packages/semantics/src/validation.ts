import { isValidShapeName, type Snapshot } from '@open-draw/schema';
import { getSemanticType, type ShapeSemanticMeta } from './types.js';

export interface SemanticIssue {
  readonly shapeId: string;
  readonly level: 'warning' | 'error';
  readonly code: string;
  readonly message: string;
  readonly parentId?: string;
}

/**
 * Pure function that validates semantic containment and naming across a scene snapshot.
 * Emits warnings for nonsensical containment (e.g. card contains a page), never mutates.
 */
export function validateSemantics(scene: Snapshot): readonly SemanticIssue[] {
  const issues: SemanticIssue[] = [];
  const shapeMap = new Map(scene.shapes.map((s) => [s.id, s]));

  for (const shape of scene.shapes) {
    const semantic = (shape.meta?.semantic ?? {}) as ShapeSemanticMeta;
    const type = semantic.type;

    // 1. Validate Shape Name
    if (semantic.name !== undefined && !isValidShapeName(semantic.name)) {
      issues.push({
        shapeId: shape.id,
        level: 'warning',
        code: 'invalid-shape-name',
        message: `Shape "${shape.id}" has an invalid name (must be <= 64 characters without control chars).`,
      });
    }

    if (!type) continue;

    const typeDef = getSemanticType(type);
    if (!typeDef) {
      issues.push({
        shapeId: shape.id,
        level: 'warning',
        code: 'unknown-semantic-type',
        message: `Shape "${shape.id}" has unknown semantic type "${type}".`,
      });
      continue;
    }

    // 2. Validate Containment Hierarchy
    const parentId = (shape.meta?.parent ?? shape.meta?.parentId) as string | undefined;
    if (parentId) {
      const parent = shapeMap.get(parentId);
      if (parent) {
        const parentSemantic = (parent.meta?.semantic ?? {}) as ShapeSemanticMeta;
        const parentType = parentSemantic.type;

        if (parentType) {
          const parentTypeDef = getSemanticType(parentType);
          if (parentTypeDef) {
            // Check allowed parents
            if (typeDef.allowedParents && !typeDef.allowedParents.includes(parentType)) {
              issues.push({
                shapeId: shape.id,
                parentId: parent.id,
                level: 'warning',
                code: 'invalid-parent',
                message: `Shape "${shape.id}" of semantic type "${type}" cannot be contained within parent "${parent.id}" of type "${parentType}".`,
              });
            }

            // Check allowed children
            if (parentTypeDef.allowedChildren && !parentTypeDef.allowedChildren.includes(type)) {
              issues.push({
                shapeId: shape.id,
                parentId: parent.id,
                level: 'warning',
                code: 'invalid-child',
                message: `Parent "${parent.id}" of semantic type "${parentType}" cannot contain child "${shape.id}" of type "${type}".`,
              });
            }
          }
        }
      }
    } else {
      // Shape has no parent: if it's a type that requires a parent (e.g. column must be in section)
      if (typeDef.allowedParents && typeDef.allowedParents.length > 0 && !typeDef.allowedParents.includes('page')) {
        issues.push({
          shapeId: shape.id,
          level: 'warning',
          code: 'missing-parent',
          message: `Shape "${shape.id}" of semantic type "${type}" should reside inside one of: ${typeDef.allowedParents.join(', ')}.`,
        });
      }
    }
  }

  return Object.freeze(issues);
}
