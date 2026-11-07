// String escaping utilities for structured Markdown export (R-006, R-008, R-016).
// Pure functions, zero dependencies.

/**
 * Safely escapes user-derived strings for structured Markdown export (R-008, R-016).
 * Neutralizes newlines, Markdown formatting syntax, and raw HTML tags.
 */
export function escapeMarkdownText(text: string): string {
  if (text === "") {
    return "";
  }
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/([`*_#[\]()<>~|])/g, "\\$1")
    .trim();
}

/**
 * Safely escapes strings rendered inside a Markdown backtick code span (`...`) (R-006, R-008).
 * Neutralizes newlines so they cannot start a new line, and replaces backticks so they cannot close the code span early.
 */
export function escapeCodeSpan(text: string): string {
  if (text === "") {
    return "";
  }
  return text
    .replace(/[\r\n\t]+/g, " ")
    .replace(/`/g, "'")
    .trim();
}
