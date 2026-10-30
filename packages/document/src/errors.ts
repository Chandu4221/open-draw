// Typed document errors (R-006: fail loudly with typed errors — never silent
// fallback or coercion). One canonical registry; callers branch on `code`.
export const DOCUMENT_ERRORS = {
  duplicateShapeId: "duplicate-shape-id",
  invalidCommand: "invalid-command",
  invalidDocument: "invalid-document",
  invalidMeta: "invalid-meta",
  invalidSchema: "invalid-schema",
  invalidShape: "invalid-shape",
  parentCycle: "parent-cycle",
  shapeNotFound: "shape-not-found",
  unknownParent: "unknown-parent",
} as const;

export type DocumentErrorCode = keyof typeof DOCUMENT_ERRORS;

export class DocumentError extends Error {
  readonly code: DocumentErrorCode;

  constructor(code: DocumentErrorCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = "DocumentError";
    this.code = code;
  }
}
