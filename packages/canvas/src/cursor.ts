// Cursor style resolution for tools and interaction affordances (R-008, R-011).
import type { HandleId } from "./handles";
import { TOOLS, type ToolId } from "./tools";

export function resolveToolCursor(tool: ToolId, spacePressed = false): string {
  if (spacePressed) return "grab";
  switch (tool) {
    case TOOLS.drawRect:
    case TOOLS.drawEllipse:
    case TOOLS.drawLine:
    case TOOLS.drawPenPath:
      return "crosshair";
    case TOOLS.drawText:
      return "text";
    case TOOLS.select:
    default:
      return "default";
  }
}

export function resolveHandleCursor(handle: HandleId): string {
  switch (handle) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
  }
}
