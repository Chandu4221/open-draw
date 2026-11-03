// Closed registry of canvas gesture kinds (R-005, R-009).
export const GESTURE_KINDS = {
  move: "move",
  draw: "draw",
  resize: "resize",
  pan: "pan",
  press: "press",
  select: "select",
} as const;

export type GestureKind = (typeof GESTURE_KINDS)[keyof typeof GESTURE_KINDS];
