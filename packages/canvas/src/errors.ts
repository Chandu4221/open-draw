// Typed canvas errors (R-005, R-006: fail loudly with typed errors).
export const CANVAS_ERRORS = {
  duplicateRegistration: "duplicate-registration",
  invalidCapability: "invalid-capability",
  invalidRegistration: "invalid-registration",
} as const;

export type CanvasErrorCode = keyof typeof CANVAS_ERRORS;

export class CanvasError extends Error {
  readonly code: CanvasErrorCode;

  constructor(code: CanvasErrorCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = "CanvasError";
    this.code = code;
  }
}
