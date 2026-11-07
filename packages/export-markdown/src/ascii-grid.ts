// Pure 2D character grid operations for ASCII sketch rendering (Milestone 11A B4).
// Pure data structures and functions, zero side effects (R-008, R-010).
import { ASCII_BOX_CHARS } from "./ascii-constants";

export interface AsciiGrid {
  readonly width: number;
  readonly height: number;
  readonly cells: string[][];
}

/**
 * Creates an empty 2D character grid filled with spaces.
 */
export function createGrid(width: number, height: number): AsciiGrid {
  const cells: string[][] = [];
  for (let y = 0; y < height; y++) {
    cells.push(new Array(width).fill(ASCII_BOX_CHARS.space));
  }
  return { width, height, cells };
}

/**
 * Sets a single character cell if within grid boundaries.
 */
export function setCell(grid: AsciiGrid, x: number, y: number, char: string): void {
  if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
    grid.cells[y]![x] = char;
  }
}

/**
 * Writes a string horizontally into the grid starting at (x, y).
 */
export function writeString(
  grid: AsciiGrid,
  x: number,
  y: number,
  text: string,
  maxWidth?: number,
): void {
  if (y < 0 || y >= grid.height) {
    return;
  }

  let str = text;
  if (maxWidth !== undefined && maxWidth > 0 && str.length > maxWidth) {
    str =
      maxWidth > 1 ? str.slice(0, maxWidth - 1) + ASCII_BOX_CHARS.ellipsis : str.slice(0, maxWidth);
  }

  for (let i = 0; i < str.length; i++) {
    const col = x + i;
    if (col >= 0 && col < grid.width) {
      grid.cells[y]![col] = str[i]!;
    }
  }
}

/**
 * Draws a rectangular container border with box-drawing characters and optional top-left header.
 */
export function drawBox(
  grid: AsciiGrid,
  x: number,
  y: number,
  width: number,
  height: number,
  header?: string,
): void {
  const w = Math.max(2, width);
  const h = Math.max(2, height);
  const right = Math.min(grid.width - 1, x + w - 1);
  const bottom = Math.min(grid.height - 1, y + h - 1);

  // Corners
  setCell(grid, x, y, ASCII_BOX_CHARS.topLeft);
  setCell(grid, right, y, ASCII_BOX_CHARS.topRight);
  setCell(grid, x, bottom, ASCII_BOX_CHARS.bottomLeft);
  setCell(grid, right, bottom, ASCII_BOX_CHARS.bottomRight);

  // Vertical sides
  for (let row = y + 1; row < bottom; row++) {
    setCell(grid, x, row, ASCII_BOX_CHARS.vertical);
    setCell(grid, right, row, ASCII_BOX_CHARS.vertical);
  }

  // Bottom horizontal
  for (let col = x + 1; col < right; col++) {
    setCell(grid, col, bottom, ASCII_BOX_CHARS.horizontal);
  }

  // Top border with optional header
  let col = x + 1;
  if (header !== undefined && header.length > 0 && header.length + 3 <= w) {
    setCell(grid, col++, y, ASCII_BOX_CHARS.space);
    for (let i = 0; i < header.length; i++) {
      setCell(grid, col++, y, header[i]!);
    }
    setCell(grid, col++, y, ASCII_BOX_CHARS.space);
  }

  while (col < right) {
    setCell(grid, col++, y, ASCII_BOX_CHARS.horizontal);
  }
}

/**
 * Draws an ellipse marker inside its bounding cell.
 */
export function drawEllipse(
  grid: AsciiGrid,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const cx = Math.max(0, Math.min(grid.width - 1, x + Math.floor(width / 2)));
  const cy = Math.max(0, Math.min(grid.height - 1, y + Math.floor(height / 2)));
  setCell(grid, cx, cy, ASCII_BOX_CHARS.ellipse);
}

/**
 * Draws a bracketed button: [ Label ].
 */
export function drawButton(
  grid: AsciiGrid,
  x: number,
  y: number,
  text: string,
  maxWidth?: number,
): void {
  const buttonText = `${ASCII_BOX_CHARS.bracketOpen} ${text} ${ASCII_BOX_CHARS.bracketClose}`;
  writeString(grid, x, y, buttonText, maxWidth);
}

/**
 * Renders the grid rows into a clean multi-line string.
 */
export function renderGridToString(grid: AsciiGrid): string {
  return grid.cells.map((row) => row.join("").trimEnd()).join("\n");
}
