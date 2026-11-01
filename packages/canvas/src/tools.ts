// Closed registry of interaction tools (R-005, R-012, ADR-0003 D8).
// Tools are transient view state — never stored in the document (R-016 placement test).
// Serialized values are kebab-case (R-014), so the type derives from the VALUES —
// the same value-union pattern as CommandId in the commands registry.
export const TOOLS = {
  select: "select",
  drawRect: "draw-rect",
  drawEllipse: "draw-ellipse",
  drawLine: "draw-line",
  drawPenPath: "draw-pen-path",
} as const;

export type ToolId = (typeof TOOLS)[keyof typeof TOOLS];
