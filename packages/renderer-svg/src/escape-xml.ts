// XML / SVG text and attribute escaping (R-008, R-016).
// Escapes &, <, >, ", and ' to XML entities.

/**
 * Escapes special XML characters for safe embedding in SVG text nodes and attribute values.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
