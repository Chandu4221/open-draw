import type { ShapeId, ShapeRecord } from '@open-draw/schema';
import type { ShapeRegistry } from '../registry.js';
import type { CanvasStore } from '../store/index.js';

export function isGroupShape(shape: ShapeRecord, registry: ShapeRegistry): boolean {
  const def = registry.get(shape.type);
  return def?.capabilities?.group?.isGroup === true;
}

export function getGroupMembers(shape: ShapeRecord, registry: ShapeRegistry): readonly ShapeId[] {
  const def = registry.get(shape.type);
  if (!def?.capabilities?.group?.isGroup) return [];
  if (def.capabilities.group.getMembers) {
    return def.capabilities.group.getMembers(shape);
  }
  return (shape.props?.memberIds as readonly ShapeId[]) ?? [];
}

export function findGroupForMember(
  memberId: ShapeId,
  store: CanvasStore,
  registry: ShapeRegistry
): ShapeRecord | null {
  for (const candidate of store.listShapes()) {
    if (isGroupShape(candidate, registry)) {
      const members = getGroupMembers(candidate, registry);
      if (members.includes(memberId)) {
        return candidate;
      }
    }
  }
  return null;
}
