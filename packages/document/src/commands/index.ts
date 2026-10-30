// Command registry index (uniform registry-folder layout, R-011/R-012).
import type { Document } from "../document";
import type { CreateShape } from "./create-shape";
import type { DeleteShape } from "./delete-shape";
import type { ReparentShape } from "./reparent-shape";
import type { SetShapeLabel } from "./set-shape-label";

export { COMMANDS } from "./registry";
export type { CommandId } from "./registry";
export type { CreateShape } from "./create-shape";
export { applyCreateShape } from "./create-shape";
export type { DeleteShape } from "./delete-shape";
export { applyDeleteShape } from "./delete-shape";
export type { SetShapeLabel } from "./set-shape-label";
export { applySetShapeLabel } from "./set-shape-label";
export type { ReparentShape } from "./reparent-shape";
export { applyReparentShape } from "./reparent-shape";

export type Command = CreateShape | DeleteShape | SetShapeLabel | ReparentShape;

export interface CommandResult {
  readonly document: Document;
  readonly inverse: readonly Command[];
}
