export type ShapeId = string;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Camera {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export interface ShapeRecord<P = Record<string, unknown>> {
  readonly id: ShapeId;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly rotation?: number;
  readonly hidden?: boolean;
  readonly meta: Readonly<Record<string, unknown>>;
  readonly props: Readonly<P>;
}

export interface Snapshot {
  readonly version: number;
  readonly shapes: ReadonlyArray<ShapeRecord>;
  readonly camera?: Camera;
  readonly meta?: Readonly<Record<string, unknown>>;
}
