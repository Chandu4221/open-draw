export class InvalidBoundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBoundsError';
  }
}

export class CorruptSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorruptSnapshotError';
  }
}

export class CycleDetectedError extends Error {
  readonly shapeId: string;
  readonly targetParentId: string;

  constructor(shapeId: string, targetParentId: string) {
    super(`Cannot set parent "${targetParentId}" for shape "${shapeId}": cycle detected`);
    this.name = 'CycleDetectedError';
    this.shapeId = shapeId;
    this.targetParentId = targetParentId;
  }
}

