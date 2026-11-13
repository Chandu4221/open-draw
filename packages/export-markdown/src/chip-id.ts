// Chip ID system (Milestone 11A Section 3).
// Pure export-time reference derivation from ShapeId (R-025, R-042).
// Format: "#" + shapeId (e.g. #s-7a01). Never stored, byte-stable.
import { parseShapeId, type ShapeId } from "@open-draw/canvas";
import { EXPORT_CHIP_PREFIX } from "./export-contract";

/**
 * Formats a canonical ShapeId into an export chip reference (e.g. "#s-7a01").
 */
export function formatChipId(shapeId: ShapeId): string {
  return `${EXPORT_CHIP_PREFIX}${shapeId}`;
}

/**
 * Checks if a string has the valid chip reference format.
 */
export function isChipId(value: string): boolean {
  return typeof value === "string" && value.startsWith(EXPORT_CHIP_PREFIX);
}

/**
 * Extracts and validates the underlying ShapeId from a chip reference.
 */
export function parseChipId(chipId: string): ShapeId {
  if (!isChipId(chipId)) {
    throw new Error(
      `invalid chip id: ${JSON.stringify(chipId)}, expected prefix "${EXPORT_CHIP_PREFIX}"`,
    );
  }
  return parseShapeId(chipId.slice(EXPORT_CHIP_PREFIX.length));
}
