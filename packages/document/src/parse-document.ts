// Boundary parser from JSON string to validated Document (R-006: parse, don't validate).
// Fails loudly with typed DocumentError on any schema or shape mismatch.
import type { Document } from "./document";
import { DocumentError } from "./errors";
import { parseDocument as parseDocumentFromUnknown } from "./validation";

export function parseDocument(json: string): Document {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new DocumentError(
      "invalidDocument",
      `invalid JSON syntax: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new DocumentError("invalidDocument", "serialized document must be an object");
  }

  return parseDocumentFromUnknown(parsed);
}
