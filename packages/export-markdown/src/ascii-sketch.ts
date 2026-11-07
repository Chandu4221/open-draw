// Deterministic 80-column ASCII layout sketch renderer (Milestone 11A B4).
// Pure Document → string projection, zero side effects (R-008, R-016).
// Byte-stable: fixed 80-column width, pinned rounding, zero Math.random (R-021, R-041).
import { SHAPE_KINDS } from "@open-draw/contracts";
import type { Document, Shape } from "@open-draw/document";
import { absoluteBoundingBox, shapeListInOrder } from "@open-draw/document";
import {
  ASCII_BOX_CHARS,
  ASCII_CAPTIONS,
  ASCII_GRID_MAX_HEIGHT,
  ASCII_GRID_WIDTH,
  ASCII_SKETCH_SHAPE_THRESHOLD,
  EXPORT_SECTION_HEADINGS,
} from "./ascii-constants";
import {
  createGrid,
  drawBox,
  drawButton,
  drawEllipse,
  renderGridToString,
  writeString,
} from "./ascii-grid";
import { formatChipId } from "./chip-id";
import type { MarkdownExportOptions } from "./types";

function formatBoxHeader(shape: Shape, width: number): string | undefined {
  const chipId = formatChipId(shape.id);
  const label =
    shape.label !== undefined && shape.label !== ""
      ? shape.label
      : shape.content !== undefined && shape.content !== ""
        ? shape.content
        : undefined;

  if (label !== undefined) {
    const fullHeader = `${label} (${chipId})`;
    if (fullHeader.length + 3 <= width) {
      return fullHeader;
    }
  }

  if (chipId.length + 3 <= width) {
    return chipId;
  }

  return undefined;
}

/**
 * Pure function rendering a deterministic 80-column ASCII layout sketch of the document.
 * Returns undefined when shape count is <= threshold (unless explicitly enabled) or when canvas is empty.
 */
export function renderAsciiSketch(
  doc: Document,
  options?: MarkdownExportOptions,
): string | undefined {
  const shapes = Object.values(doc.shapes);
  const shapeCount = shapes.length;

  if (options?.includeAsciiSketch === false) {
    return undefined;
  }

  if (options?.includeAsciiSketch !== true && shapeCount <= ASCII_SKETCH_SHAPE_THRESHOLD) {
    return undefined;
  }

  const drawableShapes = shapes.filter(
    (s) => s.kind !== SHAPE_KINDS.line && s.kind !== SHAPE_KINDS.penPath,
  );

  if (drawableShapes.length === 0) {
    return undefined;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const shape of drawableShapes) {
    const box = absoluteBoundingBox(doc, shape);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }

  const worldWidth = Math.max(1, maxX - minX);
  const worldHeight = Math.max(1, maxY - minY);

  const rawScale = Math.min(ASCII_GRID_WIDTH / worldWidth, ASCII_GRID_MAX_HEIGHT / worldHeight);
  const scale = Math.round(rawScale * 10000) / 10000;
  const gridWidth = ASCII_GRID_WIDTH;
  const gridHeight = Math.min(ASCII_GRID_MAX_HEIGHT, Math.max(3, Math.round(worldHeight * scale)));
  const grid = createGrid(gridWidth, gridHeight);

  let hasLines = false;
  let hasPenPaths = false;
  for (const shape of shapes) {
    if (shape.kind === SHAPE_KINDS.line) {
      hasLines = true;
    } else if (shape.kind === SHAPE_KINDS.penPath) {
      hasPenPaths = true;
    }
  }

  const orderedShapes = shapeListInOrder(doc);
  for (const shape of orderedShapes) {
    if (shape.kind === SHAPE_KINDS.line || shape.kind === SHAPE_KINDS.penPath) {
      continue;
    }

    const box = absoluteBoundingBox(doc, shape);
    const localX = box.x - minX;
    const localY = box.y - minY;
    const col = Math.round(localX * scale);
    const row = Math.round(localY * scale);
    const width = Math.max(1, Math.round(box.width * scale));
    const height = Math.max(1, Math.round(box.height * scale));

    if (shape.kind === SHAPE_KINDS.rect && shape.meta.semantic?.id === "button") {
      const text = shape.content ?? shape.label ?? "Button";
      const btnY = row + Math.floor(height / 2);
      drawButton(grid, col, btnY, text, width);
    } else if (shape.kind === SHAPE_KINDS.text) {
      const text = shape.content ?? shape.label ?? "";
      if (text.length > 0) {
        const textY = row + Math.floor(height / 2);
        const displayText =
          width > 0 && text.length > width
            ? width > 1
              ? text.slice(0, width - 1) + ASCII_BOX_CHARS.ellipsis
              : text.slice(0, width)
            : text;
        const textX = col + Math.max(0, Math.floor((width - displayText.length) / 2));
        writeString(grid, textX, textY, displayText);
      }
    } else if (shape.kind === SHAPE_KINDS.ellipse) {
      drawEllipse(grid, col, row, width, height);
    } else {
      const header = formatBoxHeader(shape, width);
      drawBox(grid, col, row, width, height, header);
    }
  }

  const captions: string[] = [ASCII_CAPTIONS.layoutNotice];
  if (hasLines && hasPenPaths) {
    captions.push(ASCII_CAPTIONS.omitsLinesAndPenPaths);
  } else if (hasLines) {
    captions.push(ASCII_CAPTIONS.omitsLines);
  } else if (hasPenPaths) {
    captions.push(ASCII_CAPTIONS.omitsPenPaths);
  }

  const renderedGrid = renderGridToString(grid);

  const lines: string[] = [
    EXPORT_SECTION_HEADINGS.sketch,
    "",
    "```",
    renderedGrid,
    "```",
    ...captions,
  ];

  return lines.join("\n");
}
