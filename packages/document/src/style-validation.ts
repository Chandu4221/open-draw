// Style validation for shapes (fill, stroke, strokeWidth) (R-006, ADR-0006 F1).
import { DocumentError } from "./errors";

const COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function parseColor(value: unknown, fieldName: string): string {
  if (
    typeof value !== "string" ||
    (value !== "none" && value !== "transparent" && !COLOR_REGEX.test(value))
  ) {
    throw new DocumentError(
      "invalidShape",
      `${fieldName} must be a valid hex color string or "none"/"transparent"`,
    );
  }
  return value;
}

export function parseStrokeWidth(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new DocumentError("invalidShape", "strokeWidth must be a non-negative finite number");
  }
  return value;
}
