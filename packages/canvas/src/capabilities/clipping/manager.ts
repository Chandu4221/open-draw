import type { Bounds, ShapeId, ShapeRecord } from '@open-draw/schema';
import type { ShapeRegistry } from '../../registry.js';
import type { CanvasStore } from '../../store/index.js';
import type { ChildOrphanedEvent, OrphanListener } from './defs.js';

export function isContainedWithin(child: Bounds, container: Bounds): boolean {
  return (
    child.x >= container.x &&
    child.y >= container.y &&
    child.x + child.width <= container.x + container.width &&
    child.y + child.height <= container.y + container.height
  );
}

export function findSuggestedParent(
  childBounds: Bounds,
  shapes: Iterable<ShapeRecord>,
  registry: ShapeRegistry,
  excludeId?: ShapeId
): ShapeRecord | null {
  let bestCandidate: ShapeRecord | null = null;
  let smallestArea = Infinity;

  for (const candidate of shapes) {
    if (candidate.id === excludeId) continue;

    const def = registry.get(candidate.type);
    if (!def?.capabilities?.clipping?.isMask(candidate)) {
      continue;
    }

    const containerBounds = def.geometry.bounds(candidate);
    if (isContainedWithin(childBounds, containerBounds)) {
      const area = containerBounds.width * containerBounds.height;
      if (area < smallestArea) {
        smallestArea = area;
        bestCandidate = candidate;
      }
    }
  }

  return bestCandidate;
}

export class ClippingManager {
  private orphanListeners: Set<OrphanListener> = new Set();

  onChildOrphaned(listener: OrphanListener): () => void {
    this.orphanListeners.add(listener);
    return () => this.orphanListeners.delete(listener);
  }

  emitOrphaned(event: ChildOrphanedEvent): void {
    for (const listener of this.orphanListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Orphan listener error:', err);
      }
    }
  }

  handleParentDeletion(deletedParentId: ShapeId, store: CanvasStore): void {
    const orphaned: ShapeRecord[] = [];
    for (const shape of store.listShapes()) {
      if (shape.meta['parent'] === deletedParentId || shape.meta['parentId'] === deletedParentId) {
        orphaned.push(shape);
      }
    }

    if (orphaned.length === 0) return;

    store.transact(() => {
      for (const child of orphaned) {
        store.updateShape(child.id, {
          meta: { parent: undefined, parentId: undefined },
        });
        this.emitOrphaned({ childId: child.id, previousParentId: deletedParentId });
      }
    });
  }

  detachChild(childId: ShapeId, store: CanvasStore): void {
    const child = store.getShape(childId);
    if (!child) return;
    const parentId = (child.meta['parent'] ?? child.meta['parentId']) as string | undefined;
    if (!parentId || typeof parentId !== 'string') return;

    store.updateShape(childId, {
      meta: { parent: undefined, parentId: undefined },
    });
    this.emitOrphaned({ childId, previousParentId: parentId });
  }
}
