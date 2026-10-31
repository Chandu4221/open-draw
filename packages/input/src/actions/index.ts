// Closed registry of named interaction actions (R-005, R-011, R-012).
// Action IDs are kebab-case string values; the type derives from the value union.
import { CANCEL } from "./cancel";
import { DELETE_SELECTED } from "./delete-selected";
import { REDO } from "./redo";
import { SELECT_TOOL } from "./select-tool";
import { UNDO } from "./undo";

export const ACTIONS = {
  cancel: CANCEL,
  undo: UNDO,
  redo: REDO,
  deleteSelected: DELETE_SELECTED,
  selectTool: SELECT_TOOL,
} as const;

export type ActionId = (typeof ACTIONS)[keyof typeof ACTIONS];
