// Document constraints and limits (ADR-0002, R-006, Ruling V1).
// Enforced at boundary parsing to guarantee stack-safety and prevent freeze/OOM.
export const MAX_DOCUMENT_DEPTH = 256;
