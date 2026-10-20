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
