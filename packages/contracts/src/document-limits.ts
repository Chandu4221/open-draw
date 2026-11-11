// Document constraints and limits (ADR-0002, R-006, Ruling V1).
// Enforced at boundary parsing to guarantee stack-safety and prevent freeze/OOM.
export const MAX_DOCUMENT_DEPTH = 256;
export const MAX_HISTORY_DEPTH = 100;
export const MAX_COORDINATE_BOUND = 100_000;
export const MAX_PASTE_SHAPE_COUNT = 500;
