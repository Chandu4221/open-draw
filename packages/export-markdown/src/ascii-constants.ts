// ASCII layout sketch constants and registries (Milestone 11A B4).
// R-005: Closed as const registries, zero string literals in internals.

export const ASCII_SKETCH_SHAPE_THRESHOLD = 5 as const;
export const ASCII_GRID_WIDTH = 80 as const;
export const ASCII_GRID_MAX_HEIGHT = 40 as const;

export const ASCII_BOX_CHARS = {
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  horizontal: "─",
  vertical: "│",
  space: " ",
  ellipsis: "…",
  ellipse: "◯",
  bracketOpen: "[",
  bracketClose: "]",
} as const;

export const ASCII_CAPTIONS = {
  layoutNotice: "ascii sketch — approximate spatial layout; boxes in tree above are exact",
  omitsLines: "sketch omits: lines",
  omitsPenPaths: "sketch omits: pen-paths",
  omitsLinesAndPenPaths: "sketch omits: lines, pen-paths",
} as const;

export const EXPORT_SECTION_HEADINGS = {
  document: "# OpenDraw Document",
  aiGuidance: "## AI Implementation Guidance",
  sketch: "## Layout Sketch",
  legend: "## Legend",
} as const;
