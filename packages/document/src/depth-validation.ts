// Pre-validation of document tree depth (R-006, Ruling V1).
// Ensures hostile nested documents are rejected in O(N) before allocation.
import { MAX_DOCUMENT_DEPTH, ROOT_ID } from "@open-draw/contracts";
import { DocumentError } from "./errors";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateDocumentDepth(rawShapes: Record<string, unknown>): void {
  const depthCache = new Map<string, number>();

  for (const [id, entry] of Object.entries(rawShapes)) {
    if (depthCache.has(id)) {
      continue;
    }
    const path: string[] = [id];
    let cursor: unknown = isRecord(entry)
      ? entry.parentId !== undefined
        ? entry.parentId
        : entry.parent
      : undefined;
    let pathDepth = 1;

    while (cursor !== undefined && cursor !== ROOT_ID) {
      if (typeof cursor !== "string") {
        break;
      }
      if (depthCache.has(cursor)) {
        pathDepth += depthCache.get(cursor)!;
        break;
      }
      path.push(cursor);
      pathDepth++;
      if (pathDepth > MAX_DOCUMENT_DEPTH) {
        throw new DocumentError(
          "documentDepthExceeded",
          `document depth exceeds maximum of ${MAX_DOCUMENT_DEPTH}`,
        );
      }
      if (path.indexOf(cursor) !== path.length - 1) {
        break;
      }
      const parentEntry = rawShapes[cursor];
      cursor = isRecord(parentEntry)
        ? parentEntry.parentId !== undefined
          ? parentEntry.parentId
          : parentEntry.parent
        : undefined;
    }

    if (pathDepth > MAX_DOCUMENT_DEPTH) {
      throw new DocumentError(
        "documentDepthExceeded",
        `document depth exceeds maximum of ${MAX_DOCUMENT_DEPTH}`,
      );
    }

    for (let i = 0; i < path.length; i++) {
      depthCache.set(path[i]!, pathDepth - i);
    }
  }
}
