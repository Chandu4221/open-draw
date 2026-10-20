import { CorruptSnapshotError, type ShapeId, type ShapeRecord, type Snapshot } from '@open-draw/schema';
import type { MetaValidator } from './types.js';

export function parseAndValidateSnapshot(
  snapshot: unknown,
  metaValidators: Map<string, MetaValidator>
): Map<ShapeId, ShapeRecord> {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new CorruptSnapshotError('Snapshot must be an object');
  }

  const s = snapshot as Partial<Snapshot>;
  if (typeof s.version !== 'number' || s.version < 1) {
    throw new CorruptSnapshotError(`Invalid snapshot version: ${s.version}`);
  }

  if (!Array.isArray(s.shapes)) {
    throw new CorruptSnapshotError('Snapshot shapes must be an array');
  }

  const newShapes = new Map<ShapeId, ShapeRecord>();

  for (const item of s.shapes) {
    if (!item || typeof item !== 'object') {
      throw new CorruptSnapshotError('Shape record must be an object');
    }

    if (typeof item.id !== 'string' || item.id.trim() === '') {
      throw new CorruptSnapshotError('Shape record must have a non-empty string id');
    }

    if (typeof item.type !== 'string' || item.type.trim() === '') {
      throw new CorruptSnapshotError(`Shape "${item.id}" must have a non-empty string type`);
    }

    if (!Number.isFinite(item.x) || !Number.isFinite(item.y)) {
      throw new CorruptSnapshotError(`Shape "${item.id}" must have finite x and y coordinates`);
    }

    if (!item.props || typeof item.props !== 'object') {
      throw new CorruptSnapshotError(`Shape "${item.id}" props must be an object`);
    }

    if (!item.meta || typeof item.meta !== 'object') {
      throw new CorruptSnapshotError(`Shape "${item.id}" meta must be an object`);
    }

    // Validate registered meta namespaces
    const meta = item.meta as Record<string, unknown>;
    for (const [namespace, validator] of metaValidators.entries()) {
      if (namespace in meta) {
        const isValid = validator(meta[namespace]);
        if (!isValid) {
          throw new CorruptSnapshotError(
            `Shape "${item.id}" contains invalid meta for namespace "${namespace}"`
          );
        }
      }
    }

    const validatedShape: ShapeRecord = Object.freeze({
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
      rotation: typeof item.rotation === 'number' ? item.rotation : 0,
      hidden: Boolean(item.hidden),
      meta: Object.freeze({ ...meta }),
      props: Object.freeze({ ...item.props }),
    });

    newShapes.set(validatedShape.id, validatedShape);
  }

  return newShapes;
}
