import type { Point, ShapeId, ShapeRecord } from '@open-draw/schema';
import type { ShapeRegistry } from '../../registry.js';
import type { CanvasStore } from '../../store.js';
import { type AnchorPosition, type ArrowProps, getAnchorPoint } from '../../shapes/arrow/index.js';
import type { TargetUnboundEvent, UnbindListener } from './defs.js';

type Mutable<T> = { -readonly [P in keyof T]?: T[P] };

export class ConnectorManager {
  private unbindListeners: Set<UnbindListener> = new Set();

  onTargetUnbound(listener: UnbindListener): () => void {
    this.unbindListeners.add(listener);
    return () => this.unbindListeners.delete(listener);
  }

  emitUnbound(event: TargetUnboundEvent): void {
    for (const listener of this.unbindListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Target unbound listener error:', err);
      }
    }
  }

  handleTargetDeletion(
    deletedShapeId: ShapeId,
    deletedShapeRecord: ShapeRecord | undefined,
    store: CanvasStore,
    registry: ShapeRegistry
  ): void {
    const arrowsToUpdate: Array<{
      arrow: ShapeRecord<ArrowProps>;
      patchProps: Mutable<ArrowProps>;
      events: TargetUnboundEvent[];
    }> = [];

    for (const shape of store.listShapes()) {
      const def = registry.get(shape.type);
      if (!def?.capabilities?.connector) continue;

      const props = shape.props as ArrowProps;
      const patchProps: Mutable<ArrowProps> = {};
      const events: TargetUnboundEvent[] = [];

      if (props.startBinding?.shapeId === deletedShapeId) {
        let fallbackPoint: Point = props.startPoint ?? { x: shape.x, y: shape.y };
        if (deletedShapeRecord) {
          const targetDef = registry.get(deletedShapeRecord.type);
          if (targetDef) {
            fallbackPoint = getAnchorPoint(targetDef.geometry.bounds(deletedShapeRecord), props.startBinding.anchor);
          }
        }
        patchProps.startBinding = undefined;
        patchProps.startPoint = fallbackPoint;
        events.push({
          arrowId: shape.id,
          which: 'start',
          previousTargetId: deletedShapeId,
          fallbackPoint,
        });
      }

      if (props.endBinding?.shapeId === deletedShapeId) {
        let fallbackPoint: Point = props.endPoint ?? { x: shape.x + 100, y: shape.y };
        if (deletedShapeRecord) {
          const targetDef = registry.get(deletedShapeRecord.type);
          if (targetDef) {
            fallbackPoint = getAnchorPoint(targetDef.geometry.bounds(deletedShapeRecord), props.endBinding.anchor);
          }
        }
        patchProps.endBinding = undefined;
        patchProps.endPoint = fallbackPoint;
        events.push({
          arrowId: shape.id,
          which: 'end',
          previousTargetId: deletedShapeId,
          fallbackPoint,
        });
      }

      if (events.length > 0) {
        arrowsToUpdate.push({ arrow: shape as ShapeRecord<ArrowProps>, patchProps, events });
      }
    }

    if (arrowsToUpdate.length === 0) return;

    store.transact(() => {
      for (const item of arrowsToUpdate) {
        store.updateShape(item.arrow.id, {
          props: {
            ...item.arrow.props,
            ...item.patchProps,
          },
        });
        for (const ev of item.events) {
          this.emitUnbound(ev);
        }
      }
    });
  }

  findSnapTarget(
    pointerPagePt: Point,
    shapes: Iterable<ShapeRecord>,
    registry: ShapeRegistry,
    camera?: { pageToScreen: (pt: Point) => Point },
    excludeId?: ShapeId
  ): { shapeId: ShapeId; anchor: AnchorPosition; point: Point } | null {
    const anchors: AnchorPosition[] = ['top', 'right', 'bottom', 'left', 'center'];
    let closestTarget: { shapeId: ShapeId; anchor: AnchorPosition; point: Point } | null = null;
    let minDistance = 12;

    const screenPointer = camera ? camera.pageToScreen(pointerPagePt) : pointerPagePt;

    for (const shape of shapes) {
      if (shape.id === excludeId) continue;
      const def = registry.get(shape.type);
      if (!def || def.capabilities?.connector) continue;

      const bounds = def.geometry.bounds(shape);
      for (const anchor of anchors) {
        const pt = getAnchorPoint(bounds, anchor);
        const screenAnchor = camera ? camera.pageToScreen(pt) : pt;
        const dist = Math.hypot(screenPointer.x - screenAnchor.x, screenPointer.y - screenAnchor.y);
        if (dist <= minDistance) {
          minDistance = dist;
          closestTarget = { shapeId: shape.id, anchor, point: pt };
        }
      }
    }

    return closestTarget;
  }
}
