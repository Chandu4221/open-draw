// Closed registry of named interaction actions (R-005, R-011, R-012).
// Action IDs are kebab-case string values; the type derives from the value union.
import { CANCEL } from "./cancel";
import { COPY } from "./copy";
import { DELETE_SELECTED } from "./delete-selected";
import { DUPLICATE } from "./duplicate";
import { PASTE } from "./paste";
import { REDO } from "./redo";
import { SELECT_TOOL } from "./select-tool";
import { SELECT_TOOL_ELLIPSE } from "./select-tool-ellipse";
import { SELECT_TOOL_LINE } from "./select-tool-line";
import { SELECT_TOOL_PEN_PATH } from "./select-tool-pen-path";
import { SELECT_TOOL_RECT } from "./select-tool-rect";
import { SELECT_TOOL_TEXT } from "./select-tool-text";
import { UNDO } from "./undo";

export const ACTIONS = {
  cancel: CANCEL,
  undo: UNDO,
  redo: REDO,
  deleteSelected: DELETE_SELECTED,
  duplicate: DUPLICATE,
  copy: COPY,
  paste: PASTE,
  selectTool: SELECT_TOOL,
  selectToolRect: SELECT_TOOL_RECT,
  selectToolEllipse: SELECT_TOOL_ELLIPSE,
  selectToolLine: SELECT_TOOL_LINE,
  selectToolPenPath: SELECT_TOOL_PEN_PATH,
  selectToolText: SELECT_TOOL_TEXT,
} as const;

export type ActionId = (typeof ACTIONS)[keyof typeof ACTIONS];
